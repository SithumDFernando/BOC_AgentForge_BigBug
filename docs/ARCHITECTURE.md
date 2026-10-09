# AgentForge — Architecture

This document has two parts that must never be mixed up. Slides and pitch answers must say which one they are describing.

- **Part A: Prototype.** What actually runs in this repo today.
- **Part B: Target.** How we would run it in production on Google Cloud. Not built.

---

## Part A: Prototype (what runs today)

```
Browser (Walkwave widget / Nova custom UI / Admin portal)
        │  HTTPS, HTTP-only session cookie
        ▼
Next.js 16 app (App Router, Node runtime): local, or Cloud Run if F10 is done
  ├─ Route handlers (/api/**)   auth → validate → service → JSON
  ├─ lib/auth        JWT session (jose), bcrypt passwords, API-key hashing
  ├─ lib/guardrails  injection block, PII scrub (before every model call)
  ├─ lib/chat        deterministic router: order? email? refund? else → policy Q&A
  ├─ lib/knowledge   PDF/TXT extract → chunk → embed → Firestore; cosine search
  ├─ lib/llm         provider interface: generate(), embed()  (OpenAI implementation)
  ├─ lib/email       nodemailer → Gmail SMTP
  └─ lib/db          firebase-admin Firestore (server only)
        │
        ├──► Firestore (Firebase project, Native mode). Client access denied by rules
        ├──► OpenAI API (chat model + text-embedding-3-small)
        └──► Gmail SMTP (app password)
```

### Where it runs

Today this repo runs only on a laptop (`npm run build && npm start`). Nothing from it is hosted yet. Cloud Run is F10 (D12). The old repo's demo ran on **Vercel**; this repo doesn't use Vercel, because it isn't one of the platforms the competition permits (AWS, GCP, Azure) and nothing here was deployed there (D17). Don't describe Vercel or Cloud Run as running unless it's true at the time.

### Request flow: customer chat message

1. The route handler reads the session. Missing session or wrong role → 401. `tenantId` and `userId` come from the session only.
2. Input validation: message 1–4000 chars, history at most 8 turns, `requestId` format.
3. Guardrails: injection check (block + log) → pull out any explicit email address → scrub personal data.
4. Deterministic intent routing in server code, in this order:
   1. **Refund over the limit, or the customer asks for a human** → create an escalation ticket (idempotent per `requestId`) → fixed reply.
   2. **Order intent** → Firestore query on `tenantId` + `customerId` (+ `orderId` if given) → reply built from a template.
   3. **Policy question** → embed the question → load the tenant's chunks → cosine top-5 → model answers **only** from those chunks → reply + sources.
   4. If **email intent** is present, the content from step 2 or 3 is emailed (idempotent per `requestId`, recipient checked).
5. Append to `chat_history`. Record each action in `agent_actions`.

The model is never given tools and never decides to take an action. It only writes text from the context it is given.

### Vector search without a vector database

A tenant has fewer than about 200 chunks. Each query loads that tenant's chunks (`where tenantId ==`) and ranks them by cosine similarity in memory. This removes a third-party dependency and keeps tenant filtering in the same query as the data. At larger scale, swap in Firestore vector search (`findNearest`) or Vertex AI Vector Search. See Part B.

### Firestore data model

| Collection | Key fields | Written by |
|---|---|---|
| `tenants/{tenantId}` | name, refundLimit, currency | seed |
| `business_admins/{id}` | tenantId, email, name, passwordHash, isActive | seed |
| `users/{customerId}` | tenantId, name, email, isActive, isDemo | seed |
| `demo_orders/{orderId}` | tenantId, customerId, productName, shippingStatus, trackingNumber, estimatedDelivery, totalAmount, currency | seed |
| `documents/{docId}` | tenantId, title, filename, status, chunkCount, createdAt | upload |
| `knowledge_chunks/{docId_i}` | tenantId, docId, title, content, embedding (number[]) | upload |
| `escalations/{tenant_user_requestId}` | tenantId, userId, reason, userMessage, reviewRule, amount, urgency, status, adminId, adminNote, decidedAt, createdAt | chat / admin |
| `api_keys/{id}` | tenantId, name, keyHash, prefix, isActive, usageCount, lastUsed | admin / seed |
| `email_requests/{tenant_user_requestId}` | status | chat |
| `chat_history/{auto}` | tenantId, userId, message (PII-scrubbed), reply, actions, tokens, createdAt | chat |
| `agent_actions/{auto}` | tenantId, userId, type, status, details, createdAt | all actions |

No composite indexes are needed: every query uses equality filters only, and sorting happens in memory.

Firestore rules: `allow read, write: if false;` on everything. Only the server, using the Admin SDK, can read or write.

---

## Part B: Target production architecture on Google Cloud (not built)

| Concern | Target service | Why |
|---|---|---|
| Compute | Cloud Run (min instances 1, autoscaling) | Stateless container, scales to zero for small tenants |
| Edge | Cloud Load Balancing + Cloud Armor | WAF, rate limiting, DDoS protection |
| Data | Firestore (Native) with per-tenant composite indexes | Serverless, multi-region option |
| Vectors | Firestore vector search, or Vertex AI Vector Search | Stays inside GCP, filtered by tenant |
| Model | Vertex AI (Gemini) behind the same `lib/llm` interface; OpenAI as fallback | Data residency, enterprise terms |
| Secrets | Secret Manager | No keys in env files or images |
| Async work | Pub/Sub → Cloud Run jobs (email, notifications) | Retries without blocking chat |
| Audit | Cloud Logging → BigQuery sink | Queryable decision audit |
| Identity | Identity Platform for customers and admins | Replaces the demo customer sessions (Walkwave's automatic sign-in, Nova's picker) |

Migration path from Part A: change the `lib/llm` implementation; replace the in-memory cosine search with `findNearest`; move email into a Pub/Sub consumer. Route handlers and the data model don't change.
