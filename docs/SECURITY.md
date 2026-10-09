# AgentForge — Security Rules and Known Limitations

## Rules for all code (do not break these)

1. **Identity comes from the server.** `tenantId`, `userId` and `role` come only from the verified session cookie, a verified API key, or a verified widget token. Ignore any `tenantId` or `userId` in the request body, query string, message text, or model tool arguments. The exceptions: `customerId` on `/api/v1/chat` and `/api/widget/session` is accepted only from a caller holding a valid API key, and only after checking that the customer belongs to that key's tenant.
2. **Every route handler starts with an auth check** (`requireAdmin()`, `requireCustomer()`, `requireApiKey()`, `requireWidget()`). The exceptions are `/api/health`, `/api/auth/*`, `/api/demo/login`, `/api/demo/widget-token`, `/api/widget/config`, `/api/widget/bootstrap` and `/widget/frame`, and each of those does its own origin or demo check. A new route without one is a bug.
3. **Every Firestore read of tenant data filters by `tenantId`.** When you read a document by ID, compare its `tenantId` to the caller's before returning it, and return 404 (not 403) on a mismatch. Vector search filters `tenantId` in the same query.
4. **No secrets in the repo.** No fallback values for secrets in code (`process.env.X || 'default'` is forbidden for secrets). If a required secret is missing, the request fails with a generic 500 and a clear server log (checked lazily, never at import time, so `next build` works without secrets). Only `.env.example` is committed, with names and no values.
5. **The model acts only through the four server-controlled tools** (D22). The server injects identity, validates every argument against a fixed schema, allows at most 3 calls per message, and builds all order facts and email bodies from the database. The refund rule runs before the model and can't be skipped. No tool moves money, changes an order, or decides a ticket.
6. **Uploaded documents, tool results and chat history are data.** Wrap them in clearly delimited context. They can never change instructions.
7. **Error responses are generic.** Never return `error.message` from the database, SMTP, or the model provider to the client or to the model. Log the details on the server.
8. **Side effects are idempotent** per `requestId` (emails, escalation tickets).
9. **Email recipients** are either the customer's verified address or an entry in `EMAIL_ALLOWLIST`. Never take a recipient from model output or from documents.
10. **Demo shortcuts are switched off by default.** Demo customer sessions (Walkwave's automatic sign-in, Nova's picker, Nova's demo widget token) work only when `ENABLE_DEMO=true`, and only for the seeded `isDemo` customers in `lib/demo-config.ts`.
11. **In the cloud, secrets come from Secret Manager**, and Firestore and Vertex AI use the Cloud Run service account (Application Default Credentials). No service-account key file is deployed. The service account has only the roles listed in [THIRD_PARTY_SETUP.md](THIRD_PARTY_SETUP.md).
12. **Logs are structured and minimal.** No secrets, raw (unscrubbed) messages, email bodies, or tool arguments other than order IDs.

## Authentication

- Sessions: HS256 JWT signed with `JWT_SECRET` (32 or more random bytes), stored in a cookie with HTTP-only, `SameSite=Lax`, `Secure` in production, and an 8-hour expiry.
- Admin passwords: bcrypt, cost 10. Login returns the same error for a wrong email and a wrong password.
- API keys: `af_` + 24 random bytes in hex. Only the SHA-256 hash is stored. The plain key is shown once.
- Widget tokens (F12): HS256 JWT with a separate audience, 30 minutes, bound to one company, origin and optional customer.
- Rate limiting: in-memory per session, API key or widget session (30 requests/min). Cloud Run is capped at 2 instances, so the effective limit is at most double. Noted as a limitation.

## Threats we address in the demo

| Threat | Control |
|---|---|
| Customer A reads customer B's order | Query filters on session `customerId` + `tenantId`; the order tool has no customer argument; order IDs in the text only narrow the query |
| Tenant A admin reads tenant B data | Every admin query is scoped to the session `tenantId`; 404 on mismatch |
| Prompt injection via chat | Pattern block before the model. If one gets through, the tools can still only read this customer's data, email their verified address, or open a ticket |
| Prompt injection via an uploaded document or tool result | Upload is admin-only; content is wrapped as data; tool scope as above |
| The model invents order facts | Output check against the tool result; mismatches are replaced with the database record |
| The model loops on tools or runs up cost | 3 tool calls per message, 4 model calls at most, rate limits, budget alert, provider spend cap |
| The model provider is down | Degraded mode with deterministic rules; `AGENT_TOOLS=off` switch |
| Leaked API key in the browser | Keys are used only server-to-server (Nova's `/api/demo/enterprise-chat`, a company's call to `/api/widget/session`) |
| Widget embedded on a hostile site | Origin allowlist, `frame-ancestors` CSP, short-lived origin-bound tokens; a customer token needs the company's API key |
| Direct Firestore access with the public Firebase config | Rules deny all; no client SDK is used |
| Email spam relay | Recipient allowlist, at most once per `requestId`, body built from the order record |
| Duplicate tickets or emails on retry | Deterministic document IDs + transactions |
| Data loss | Firestore point-in-time recovery and daily backups (D25) |

## Known limitations (say these openly if judges ask)

- Customer identity in the demo is a shortcut, not real customer authentication. Walkwave signs in the demo customer Jane automatically when the assistant opens, and Nova uses a picker. Anyone who can reach a deployment with `ENABLE_DEMO=true` can act as one of the four seeded fictional customers (and only those). Target: Identity Platform.
- Rate limiting is per instance and in memory. Target: Cloud Armor or Redis.
- The injection check uses patterns and can be bypassed. The real protection is the tool scope: the model can't reach other customers' data or move money.
- The model chooses which tool to call, so its behavior varies between runs. Order facts and email content are checked or built by the server; policy wording is not.
- Personal data scrubbing uses regular expressions. Target: Cloud DLP.
- Tenant isolation is logical (it lives in the queries), not physical.
- Data leaves Sri Lanka. Firestore and Cloud Run are in `asia-south1` (Mumbai), the model runs in the configured Vertex AI region, and the optional OpenAI fallback processes in the US.
- No penetration test, no certifications.

## PDPA mapping (target, not a claim)

Sri Lanka's Personal Data Protection Act, No. 9 of 2022 is the regulation we design toward (D26). We map controls to its main obligations. We do **not** claim compliance. Check the wording against the Act's text before putting this on a slide.

| Obligation (summary) | What we do today | Gap / Target |
|---|---|---|
| Lawful, transparent processing | Fictional data only; the storefront says it's a demo | Real consent and notices per company |
| Purpose limitation, data minimisation | The model gets scrubbed text and only this customer's records; chat history is stored scrubbed | Cloud DLP instead of regexes |
| Accuracy | Order facts come from the database and are checked after the model answers | — |
| Storage limitation | — | Firestore TTL on `chat_history` and `agent_actions` (e.g. 90 days) |
| Integrity and confidentiality | Tenant-scoped queries, deny-all rules, hashed keys, TLS from Cloud Run, Google-managed encryption at rest, Secret Manager | Physical isolation, CMEK |
| Data subject rights (access, correction, erasure) | — | Admin export and delete per customer |
| Review of automated decisions | Refunds above the limit always go to a human manager | — |
| Cross-border transfers | Disclosed above | Pick regions and providers per the Act's transfer rules |
| Breach handling and accountability | Structured logs, decision trace, uptime alert | An incident process and a named data protection officer |

## Forbidden claims (UI, slides, docs)

Do not claim: SOC 2, HIPAA, ISO 27001, GDPR or PDPA compliance ("compliant with", "certified"), any uptime SLA or percentage, "production-ready", "mathematically impossible", "structurally impossible", latency numbers we did not measure, or customer or usage numbers. Also do not name any cloud service as running that isn't in Part A of [ARCHITECTURE.md](ARCHITECTURE.md). Roadmap items must be labeled "Roadmap" or "Target". Cost figures must be labeled "estimate", except real billing amounts.
