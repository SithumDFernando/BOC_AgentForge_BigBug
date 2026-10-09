# AgentForge — Security Rules and Known Limitations

## Rules for all code (do not break these)

1. **Identity comes from the server.** `tenantId`, `userId` and `role` come only from the verified session cookie or a verified API key. Ignore any `tenantId` or `userId` in the request body, query string, or message text. The one exception is `customerId` on `/api/v1/chat`. It is accepted only from a caller holding a valid API key, and only after checking that the customer belongs to that key's tenant.
2. **Every route handler starts with an auth check** (`requireAdmin()`, `requireCustomer()`, `requireApiKey()`), except `/api/health` and the login routes. A new route without one is a bug.
3. **Every Firestore read of tenant data filters by `tenantId`.** When you read a document by ID, compare its `tenantId` to the caller's before returning it, and return 404 (not 403) on a mismatch.
4. **No secrets in the repo.** No fallback values for secrets in code (`process.env.X || 'default'` is forbidden for secrets). If a required secret is missing, refuse to start. Only `.env.example` is committed, with names and no values.
5. **Actions are decided by server code, never by the model.** The model gets no tools. Refund limits, email recipients and order data are enforced in TypeScript.
6. **Uploaded documents and chat history are data.** Wrap them in clearly delimited context. They can never change instructions.
7. **Error responses are generic.** Never return `error.message` from the database, SMTP, or OpenAI to the client. Log the details on the server.
8. **Side effects are idempotent** per `requestId` (emails, escalation tickets).
9. **Email recipients** are either the customer's verified address or an entry in `EMAIL_ALLOWLIST`. Never take a recipient from model output or from documents.
10. **Demo shortcuts are switched off by default.** The customer picker works only when `ENABLE_DEMO=true`.

## Authentication

- Sessions: HS256 JWT signed with `JWT_SECRET` (32 or more random bytes), stored in a cookie with HTTP-only, `SameSite=Lax`, `Secure` in production, and an 8-hour expiry.
- Admin passwords: bcrypt, cost 10. Login returns the same error for a wrong email and a wrong password.
- API keys: `af_` + 24 random bytes in hex. Only the SHA-256 hash is stored. The plain key is shown once.
- Rate limiting: in-memory per session or API key (30 requests/min). Good enough for one instance; note it as a limitation.

## Threats we address in the demo

| Threat | Control |
|---|---|
| Customer A reads customer B's order | Query filters on session `customerId` + `tenantId`; order IDs in the text are only a narrowing filter |
| Tenant A admin reads tenant B data | Every admin query is scoped to the session `tenantId`; 404 on mismatch |
| Prompt injection via chat | Pattern block before the model; the model has no tools; answers come only from context |
| Prompt injection via an uploaded document | Upload is admin-only; content is wrapped as data; the model can't take actions anyway |
| Leaked API key in the browser | Key is used only server-to-server (the Nova server route) |
| Direct Firestore access with the public Firebase config | Rules deny all; no client SDK is used |
| Email spam relay | Recipient allowlist, at most once per `requestId` |
| Duplicate tickets or emails on retry | Deterministic document IDs + transactions |

## Known limitations (say these openly if judges ask)

- Customer identity in the demo comes from a customer picker, not real customer authentication. Target: Identity Platform.
- Rate limiting is per instance and in memory. Target: Cloud Armor or Redis.
- The guardrail injection check uses patterns and can be bypassed. The real protection is that the model has no tools and no access to data outside the provided context.
- Personal data scrubbing uses regular expressions. Target: Cloud DLP.
- Tenant isolation is logical (it lives in the queries), not physical.
- No penetration test, no certifications.

## Forbidden claims (UI, slides, docs)

Do not claim: SOC 2, HIPAA, ISO 27001, GDPR compliance, any uptime SLA or percentage, "production-ready", "mathematically impossible", latency numbers we did not measure, or customer or usage numbers. Also do not name any cloud service as running that isn't in Part A of [ARCHITECTURE.md](ARCHITECTURE.md). Roadmap items must be labeled "Roadmap" or "Target".
