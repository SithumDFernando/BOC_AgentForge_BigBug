# AgentForge — Architecture

This document has two parts that must never be mixed up. Slides and pitch answers must say which one they are describing.

- **Part A: Prototype.** What this repo builds and runs. Each cloud piece is marked with its status; only say it "runs" once [PROGRESS.md](PROGRESS.md) records it as live.
- **Part B: Target.** How we would run it in production on Google Cloud. Not built.

---

## Part A: Prototype

```
Browser (Walkwave widget / Nova custom UI / any site with widget.js (F12) / Admin portal)
        │  HTTPS, HTTP-only session cookie or widget token
        ▼
Cloud Run service "agentforge" (asia-south1, max 2 instances)     ← local `npm start` as fallback
  Next.js 16 app (App Router, Node runtime), one container
  ├─ Route handlers (/api/**)   auth → validate → lib → JSON
  ├─ lib/auth        JWT session (jose), bcrypt passwords, API-key hashing
  ├─ lib/guardrails  injection block, PII scrub (before every model call)
  ├─ lib/chat        refund rule → agent loop (≤ 3 tool calls) → output checks; rules as degraded mode
  ├─ lib/tools       searchPolicies · getMyOrders · sendEmailUpdate · requestManagerReview
  ├─ lib/knowledge   PDF/TXT extract → chunk → embed → Firestore vectors; findNearest search
  ├─ lib/llm         provider interface: generate() with tools, embed()  (Vertex AI; OpenAI fallback)
  ├─ lib/email       nodemailer → Gmail SMTP
  ├─ lib/log         structured JSON logs → Cloud Logging
  └─ lib/db          firebase-admin Firestore (server only)
        │
        ├──► Firestore (Native, asia-south1): data + vector index. Client access denied by rules. PITR + daily backups
        ├──► Vertex AI: Gemini chat model + text embeddings (service-account auth)
        ├──► OpenAI API (optional fallback for generate only)
        ├──► Gmail SMTP (app password from Secret Manager)
        ├──► Secret Manager: JWT_SECRET, SMTP_PASS, NOVA_DEMO_API_KEY, admin passwords, OPENAI_API_KEY
        └──► Cloud Logging / Monitoring: logs, uptime check on /api/health, alerts, dashboard
```

| Piece | Status |
|---|---|
| Next.js app, Firestore, Gmail SMTP | Built in M0–M5 |
| Vertex AI, Firestore vector search, tools | Built in M2–M3 |
| Cloud Run, Secret Manager, Cloud Logging, uptime check, PITR, backups | M5b (F10, F11); needs a human with `gcloud` |
| Widget (F12) | M5c (P1) |

The old repo's demo ran on Vercel. This repo doesn't use Vercel: it isn't one of the platforms the competition permits (D17).

### Request flow: customer chat message

1. The route handler reads the session (or widget token, or API key). Missing or wrong role → 401. `tenantId` and `userId` come from there only.
2. Input validation: message 1–4000 chars, history at most 8 turns, `requestId` format.
3. Guardrails: injection check (block + log) → pull out any explicit email address → scrub personal data.
4. **Refund rule** in server code: a refund over the limit, or a refund request that asks for a human → escalation ticket (idempotent per `requestId`) → fixed reply. The model isn't called.
5. **Agent loop**: the model gets the scrubbed conversation and four tool definitions. Each tool call is validated, run by the server with the session's identity, recorded, and returned as data. At most 3 tool calls, at most 4 model calls.
6. **Output checks**: order facts must match the tool result (otherwise the database text replaces the reply); no orders → the fixed not-found reply; a reply that used no tool → a fixed help reply; the email outcome is appended by the server.
7. If the model provider fails → **degraded mode**: the deterministic rules from before D22 answer (order template, policy answer, email).
8. Append to `chat_history`. Every step goes to `agent_actions` and a structured log line with the `requestId`. Together they're the decision trace, also returned as `trace`.

The model never sees another customer's data and can't move money or decide a ticket: no tool does that.

### Vector search

Each chunk's embedding (768 dimensions) is stored as a Firestore vector. A query filters `tenantId ==` and runs `findNearest` (cosine, top 5) in the same request, using one composite vector index. This keeps tenant filtering inside the database query, with no extra vendor. At large scale: Vertex AI Vector Search (Part B).

### Firestore data model

| Collection | Key fields | Written by |
|---|---|---|
| `tenants/{tenantId}` | name, refundLimit, currency, widget `{ enabled, name, color, allowedOrigins }` | seed / admin |
| `business_admins/{id}` | tenantId, email, name, passwordHash, isActive | seed |
| `users/{customerId}` | tenantId, name, email, isActive, isDemo | seed |
| `demo_orders/{orderId}` | tenantId, customerId, productName, shippingStatus, trackingNumber, estimatedDelivery, totalAmount, currency | seed |
| `documents/{docId}` | tenantId, title, filename, status, chunkCount, createdAt | upload |
| `knowledge_chunks/{docId_i}` | tenantId, docId, title, content, embedding (vector, 768) | upload |
| `escalations/{tenant_user_requestId}` | tenantId, userId, reason, userMessage, reviewRule, amount, urgency, status, adminId, adminNote, decidedAt, createdAt | chat / admin |
| `api_keys/{id}` | tenantId, name, keyHash, prefix, isActive, usageCount, lastUsed | admin / seed |
| `email_requests/{tenant_user_requestId}` | status | chat |
| `chat_history/{auto}` | tenantId, userId, message (PII-scrubbed), reply, actions, tokens, createdAt | chat |
| `agent_actions/{auto}` | tenantId, userId, requestId, type, status, details, createdAt | all actions |

Indexes: one composite vector index on `knowledge_chunks` (`tenantId` ascending + `embedding` vector, 768, flat). Every other query uses equality filters only, and sorting happens in memory.

Firestore rules: `allow read, write: if false;` on everything. Only the server, using the Admin SDK, can read or write.

### Operations (F10, F11)

| Concern | What we run |
|---|---|
| Deploy | `gcloud run deploy --source .` from the repo's Dockerfile (standalone Next.js build) |
| Scaling and cost | min instances 0 (1 on demo day), max 2, scale to zero otherwise |
| Secrets | Secret Manager, mounted as env vars; Firestore and Vertex AI via the service account |
| Logs | Structured JSON on stdout → Cloud Logging; filter by `jsonPayload.requestId` / `tenantId` / `action` |
| Monitoring | Uptime check on `/api/health` with an email alert; (P1) log-based metrics for guardrail blocks, escalations, tool errors and 5xx, on one dashboard |
| Recovery | Firestore point-in-time recovery (7-day window) and a daily backup schedule (7-day retention) |
| Spend | Billing budget alert; OpenAI spend cap if the fallback is configured |
| Fallback | Local `npm run build && npm start` against the same Firestore, then the recorded demo |

---

## Part B: Target production architecture on Google Cloud (not built)

| Concern | Target service | Why |
|---|---|---|
| Edge | Global external load balancer + Cloud Armor | WAF, per-tenant rate limits, DDoS protection. Replaces Round 1's Apigee at a fraction of the cost |
| Compute | Cloud Run in two regions (`asia-south1` + `asia-south2`) behind the load balancer; the orchestration, tools and ingestion split into separate services when load differs | Regional failover; independent scaling, as Round 1 proposed |
| Data | Firestore with PITR, daily backups, and scheduled exports to Cloud Storage in a second region | Restore after a regional loss. Firestore has no Asia multi-region location, so a multi-region database means US/EU residency: a trade-off to decide per customer |
| Vectors | Vertex AI Vector Search for large tenants | Scale past Firestore vector search |
| Model | Vertex AI (Gemini) with routing between a fast and a stronger model; OpenAI or Anthropic as fallback | Cost control and resilience |
| Cache | Memorystore semantic cache | Fewer model calls for repeated questions |
| Async work | Pub/Sub → Cloud Run jobs for email and notifications, with retries and a dead-letter topic | Retries without blocking chat |
| Audit | Cloud Logging → BigQuery sink with a locked dataset; Cloud Trace | Queryable, tamper-evident decision history |
| Identity | Identity Platform for customers and admins, with MFA for admins | Replaces the demo customer sessions (Walkwave's automatic sign-in, Nova's picker) |
| Secrets | Secret Manager with per-tenant paths and CMEK | Tenant tool credentials |

Target recovery goals (to state as goals, not measured): data loss of at most a few minutes (PITR), and service restored in another region within hours from backups. Multi-region active-active only when a customer needs it.

Migration path from Part A: add the load balancer and the second region; split services along the existing `lib/` boundaries; move email into a Pub/Sub consumer; add the BigQuery sink. Route handlers and the data model don't change.
