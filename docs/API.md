# API Contract

Every route the system exposes. The copied UI already calls these exact paths and reads these exact fields. **Do not rename paths or fields** unless [UI.md](UI.md) lists the matching UI change.

Conventions:
- JSON bodies everywhere except document upload (multipart) and `/api/chat` (Server-Sent Events).
- Error shape: `{ "error": "<human-readable, generic message>" }`. Never include stack traces or provider error text.
- Auth: **customer**, **admin**, **API key**, or **public**, as listed per route. Helpers live in `lib/auth.ts` ([MODULES.md](MODULES.md)).
- `tenantId` and `userId` always come from the session or API key. Ignore them anywhere in a request, except the one rule on `/api/escalation` GET below.
- All handlers set `export const runtime = 'nodejs'`. Handlers that call the model also set `export const maxDuration = 60`.

---

## Auth

### `POST /api/auth/admin-login`: public
Body `{ "email": string, "password": string }`.
- `200 { "success": true, "tenantId": string }` and sets the `session` cookie (role `admin`).
- `400` if either field is missing. `401 { "error": "Invalid email or password." }` for an unknown email, a wrong password, or an inactive account (same message for all three).
- Rate limit: 10 attempts/min per IP.

### `POST /api/auth/logout`: public
Clears the cookie. `200 { "success": true }`.

### `GET /api/auth/session`: public
- `200 { "user": { "userId", "role": "admin" | "user", "tenantId", "email", "name" } }` when the cookie is valid and the account still exists and is active.
- `200 { "user": null }` otherwise. Never 401: the `AuthProvider` treats null as "signed out".
- Response header `Cache-Control: no-store`.

### `POST /api/demo/login`: public, demo only
Body `{ "company": "walkwave" | "nova", "customerId": string }`.
- `403 { "error": "Demo account selection is disabled." }` unless `ENABLE_DEMO=true`.
- `400` for an unknown company. `403` if `customerId` is not one of that company's customers in `lib/demo-config.ts`.
- `409 { "error": "Demo data is not ready. Run npm run seed." }` if the user document is missing, inactive, not `isDemo`, or has a different tenant.
- `200 { "success": true }` and sets the `session` cookie (role `user`, tenantId from the config, userId = customerId).
- Callers: the Walkwave storefront calls it **automatically** with `walkwave_jane` (`customers[0]`) when the assistant opens and there's no Walkwave customer session yet; Walkwave has no picker. Nova's picker calls it with Alice or Sam. `npm run verify` calls it directly (that's how Bob signs in). See [UI.md](UI.md#demo-customer-sessions).

---

## Customer chat

### `POST /api/chat`: customer
Body `{ "message": string, "history": [{ "role": "user"|"assistant", "content": string }], "requestId": string, "expectedCustomerId"?: string }`.

Errors before the stream starts are returned as JSON:
- `401` no customer session. `409 { "error": "Your account changed in another tab. Select your customer again." }` if `expectedCustomerId` ≠ the session userId. `400` validation error. `429` rate limited. `403` if the session's customer is no longer an active user of its tenant.

Otherwise `200`, `Content-Type: text/event-stream`. Each event is `data: <json>\n\n`:

| Event | Shape | When |
|---|---|---|
| agent | `{ "type": "agent", "name": "queryDatabase" \| "sendEmail" \| "escalateToHuman" \| "guardrailBlocked" }` | Each action as it happens |
| text | `{ "type": "text", "content": string }` | Once, with the final reply |
| result | `{ "type": "result", "reply", "actions": string[], "sources": string[], "escalationId"?: string, "orders"?: Order[], "trace": TraceStep[], "requestId": string }` | Once, last |
| error | `{ "type": "error", "message": string }` | Instead of text/result on failure (generic message) |

The stream closes after `result` or `error`. The UI in `ChatPanel.tsx` parses exactly this format.

`Order` = `{ orderId, productName, shippingStatus, trackingNumber: string|null, estimatedDelivery: string|null, currency, totalAmount }`.

`TraceStep` = `{ step: 'guardrail'|'rule'|'model'|'tool'|'check', name: string, status: 'ok'|'blocked'|'rejected'|'error'|'replaced', detail?: string }`: the decision trace (F7). It holds tool names, rule names and order IDs only, never message text or personal data. The chat panel ignores it; Nova's "Inspect API response" panel shows it.

### `GET /api/escalation/[id]`: customer (owner) or admin (same tenant)
- `200 { "id", "status": "pending"|"approved"|"rejected", "reason", "adminNote" }`.
- `404` if not found, other tenant, or (for a customer) not their ticket. `400` if the id contains `/`.
- The chat panel polls this every 5 seconds.

---

## Enterprise API

### `POST /api/v1/chat`: API key
Header `Authorization: Bearer af_...`. Body `{ "message", "history"?, "requestId"?, "customerId"? }`.
- `401 { "error": "Invalid or inactive API key." }` if the key is missing, unknown, or inactive. Look the key up by `sha256(key)`, never by the plain value.
- `400` validation error. `403 { "error": "Customer is not authorized for this company." }` if `customerId` is not an active user of the key's tenant.
- `429` rate limited (30/min per key).
- `200 { "reply", "actions", "sources", "orders"?, "escalationId"?, "trace", "requestId" }`, the same fields as the chat `result` event minus `type`.
- Without `customerId`, only policy questions work. Order, email and refund intents reply "Please sign in…" with no action.
- On success, increment `usageCount` and set `lastUsed` on the key (failure to do so is logged, not returned).

### `POST /api/demo/enterprise-chat`: customer (Nova tenant only)
Simulates Nova's own backend. The Nova page calls it from `ChatPanel.tsx`.
- `401` unless the session is a customer of `tnt_nova`. `409` on an `expectedCustomerId` mismatch. `503` if `NOVA_DEMO_API_KEY` is unset.
- `NOVA_DEMO_API_KEY` comes from the environment only. The old repo fell back to a plain key stored in `api_keys/nova_demo_key`; don't port that, because only the hash is ever stored (D10, D19).
- Forwards `{ message, history, requestId, customerId: session.userId }` to `${APP_BASE_URL}/api/v1/chat` with `Authorization: Bearer ${NOVA_DEMO_API_KEY}`, a 50-second timeout, and `cache: 'no-store'`. Returns the upstream status and JSON unchanged. `APP_BASE_URL` is required: `http://localhost:3000` locally, the deployed app's own URL when hosted. There is no platform-specific fallback (the old repo read Vercel's `VERCEL_PROJECT_PRODUCTION_URL`, D19).
- `502 { "error": "Nova could not reach its AgentForge API integration." }` on network failure.

---

## Admin

All admin routes: `401` without an admin session. Every query is scoped to `session.tenantId`.

### `GET /api/admin/stats`
`200 { "totalUsers": number, "totalDocs": number, "tokenUsage": number, "totalEscalations": number }`.
`tokenUsage` = the sum of `tokens` across the tenant's `chat_history` records. It must be the model provider's real usage, not an estimate.

### `GET /api/admin/documents`
`200 { "documents": [{ "id", "title", "filename", "status": "indexed", "chunkCount", "fileSize", "createdAt" }] }`, newest first. Never return the text or the chunks.

### `POST /api/admin/documents` (multipart)
Fields `file` (PDF or TXT, ≤ 4 MB) and `title` (optional, ≤ 200 characters, default: the filename).
- `200 { "success": true, "document": { ...same fields as GET } }` only after every chunk is stored.
- `400 { "error": "<readable reason>" }` for a bad file type, an empty or scanned PDF, or text that is too long. These messages are safe to show.
- `500` generic message if embedding or storage fails. Nothing stays half-written ([MODULES.md](MODULES.md#libknowledgets)).

### `DELETE /api/admin/documents?id=<docId>`
Deletes the document and all its chunks. `404` if it's missing or belongs to another tenant. `200 { "success": true }`.

### `GET /api/admin/api-keys`
`200 { "keys": [{ "id", "name", "key": "<prefix, e.g. af_3f9a…>", "createdAt", "lastUsed": string|null, "usageCount", "isActive" }] }`. Active keys only, newest first.
The field is named `key` because the UI reads `k.key.substring(0, 7)`. It holds the **prefix only** (first 7 characters + `…`).

### `POST /api/admin/api-keys`
Body `{ "name": string }` (1–80 characters).
`200 { "key": { "id", "name", "key": "<FULL plain key, shown once>", "createdAt", "lastUsed": null, "usageCount": 0, "isActive": true } }`. Store only `keyHash` and `prefix`.

### `DELETE /api/admin/api-keys?id=<keyId>`
Sets `isActive: false` (revoke). `404` if the key belongs to another tenant. `200 { "success": true }`.

### `GET /api/escalation?status=pending|approved|rejected[&tenantId=...]`
- `status` defaults to `pending`; any other value → `400`.
- If `tenantId` is present and ≠ `session.tenantId` → `403`. The re-synced UI no longer sends it, but keep the check (verify case 15).
- `200 { "escalations": [{ "id", "tenantId", "userId", "customerName": string|null, "customerEmail": string|null, "reason", "userMessage", "reviewRule", "amount": number|null, "urgency": "high", "status", "createdAt", "adminNote", "decidedAt" }], "count" }`. Newest first, at most 100.
- `customerName` and `customerEmail` are read from `users/{userId}` and returned only when that user has the same `tenantId`; otherwise `null`. The escalations page shows them.

### `PATCH /api/escalation`
Body `{ "id": string, "decision": "approved"|"rejected", "adminNote"?: string }`. Any `adminId` in the body is ignored; use the session.
- `400` invalid input. `404` not found or other tenant. `409 { "error": "This ticket was already reviewed." }`.
- The status update runs in a Firestore transaction (it reads `pending` and writes the decision atomically).
- `200 { "success": true, "id", "decision" }`.

---

## Website widget (F12, P1)

Origins are compared exactly after normalizing with `siteOrigin` ([MODULES.md](MODULES.md#libwidgetts-f12-p1)). Errors use the usual `{ error }` shape. Every response sets `Cache-Control: no-store`. Rate limits: 20/min per IP for bootstrap and token routes, 30/min per widget session for chat.

### `GET /widget.js`: public (static file)
The loader. It reads `data-company` and `data-token-url` from its own `<script>` tag and the page's `location.origin`. It adds the launcher button and an iframe pointing to `/widget/frame?company=…&origin=…`. It exposes `window.AgentForgeWidget = { open(), refreshIdentity(), destroy() }`.

### `GET /widget/frame?company=&origin=`: public
HTML for the chat panel. `403` text if the company or origin isn't allowed. Headers: `Content-Security-Policy` with `frame-ancestors` set to the company's allowed origins and `default-src 'self'`, `Referrer-Policy: no-referrer`, `X-Content-Type-Options: nosniff`.

### `GET /api/widget/config?company=&origin=`: public
`200 { "company", "name", "color" }`, with `Access-Control-Allow-Origin: <origin>` only when the origin is allowed. Otherwise `403`.

### `POST /api/widget/bootstrap`: public
Body `{ "company", "origin" }`. `200 { "token", "expiresAt", "customer": null, "name" }`: an anonymous token (policy questions only).

### `POST /api/widget/session`: API key
The company's **server** calls this after verifying its own signed-in customer. Body `{ "customerId", "origin" }`. `401` bad key, `403` origin not allowed or customer not an active user of the key's tenant. `200 { "token", "expiresAt", "customer": { "id", "name" }, "name" }`.

### `GET /api/widget/session`: widget token
The frame checks a token it was handed (from the company's token endpoint) before using it. `200 { "company", "origin", "customer": { "id", "name" } | null }`. `401` for an invalid or expired token, `403` if the origin is no longer allowed or the customer is inactive.

### `POST /api/demo/widget-token`: public, demo only
Nova's stand-in for "the company's server". `403` unless `ENABLE_DEMO=true`. Body `{ "company": "tnt_nova", "origin" }`. Uses the current Nova customer session if there is one, otherwise `nova_alice`. Only the seeded `isDemo` Nova customers. Same response as `/api/widget/session`.

### `POST /api/widget/chat`: widget token
Header `Authorization: Bearer <widget token>`. Body like `/api/chat`. `200` with the same JSON as `/api/v1/chat` (not SSE). Without a customer in the token, order, email and refund intents reply "Please sign in…" with no action.

### `GET /api/widget/escalation?id=`: widget token with a customer
`200 { "id", "status", "adminNote" }`. `404` unless the ticket belongs to the token's tenant and customer.

### `GET`/`POST /api/admin/widget`: admin
`GET` → `200 { "companyId": tenantId, "widget": WidgetConfig, "snippet": string }`. `POST` body `{ "widget": WidgetConfig }` → validated with `validateWidgetConfig` (`400` with a readable message) → saved to `tenants/{tenantId}.widget` → `200 { "success": true, "widget" }`. The snippet uses `APP_BASE_URL`.

---

## Public

### `GET /api/health`
`200 { "ok": true }`. Does not touch Firestore or the model.

---

## Routes that must NOT exist

`/api/dev-seed`, `/api/seed`, `/api/kb`, `/api/agent`, `/api/traces`, `/api/fleet`, `/api/architecture`, `/api/report`, `/api/ops/**`, `/api/auth/ops-login`, `/api/auth/user-*`, `/api/admin/{users,settings,analytics,agents,reports}`. Seeding happens only through `npm run seed`.
