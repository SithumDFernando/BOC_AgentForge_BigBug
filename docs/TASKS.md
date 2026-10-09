# Build Plan

The ordered task list for building the system from this repo. Work top to bottom. Each milestone ends in a working, committed state.

Read first, in this order: [CLAUDE.md](../CLAUDE.md) → [SPEC.md](SPEC.md) → [DECISIONS.md](DECISIONS.md) → [API.md](API.md) → [MODULES.md](MODULES.md) → [UI.md](UI.md) → [TESTING.md](TESTING.md) → [SECURITY.md](SECURITY.md).

## Autonomous working protocol

1. **One task at a time**, in order. Don't start a milestone until the previous one's exit check passes.
2. After each task: run `npm run check` (typecheck + lint + unit tests + build). Fix failures before moving on.
3. **Commit after each task**, with a message like `M2.3: lib/knowledge search with tenant filter`. Never commit `.env.local`, service-account JSON or other secrets.
4. Update [PROGRESS.md](PROGRESS.md) after each task: tick it, and note anything skipped, assumed or blocked.
5. **Missing secrets don't block you.** If `.env.local` is absent, build everything, cover it with mocked unit tests, mark live checks as "needs live verification" in PROGRESS.md, and continue. Never invent or hardcode credentials.
6. **Don't ask questions; decide.** If the docs don't cover something, choose the simplest option consistent with SPEC, SECURITY and DECISIONS, then record it as a new entry in DECISIONS.md.
7. **Stay in scope.** Don't add features, pages, routes or dependencies beyond the docs. The allowed new dependencies are `openai`, `firebase-admin`, `vitest`, `tsx`, and `pdf-parse` (already listed).
8. **Don't edit** SPEC.md acceptance criteria or SECURITY.md rules. If one is impossible, explain why in PROGRESS.md and carry on with the rest.
9. Stop when M8 is done, or if the same failure persists after 3 different fix attempts. Then write a clear blocker note in PROGRESS.md.

---

## M0: Scaffold (repo builds with the copied UI)

- [ ] M0.1 `npm install`, then `npm install openai firebase-admin` and `npm install -D vitest tsx`.
- [ ] M0.2 Add `vitest.config.ts` (node environment, `@` alias → repo root, `include: ['lib/**/*.test.ts']`).
- [ ] M0.3 Stub the server modules the UI depends on, so the build passes: `lib/env.ts`, `lib/http.ts`, `lib/db.ts`, `lib/auth.ts` per [MODULES.md](MODULES.md).
- [ ] M0.4 `app/api/health/route.ts`.
- **Exit:** `npm run check` passes. Pages render under `npm run dev`; API calls may 404 for now.

## M1: Auth, data access, seed

- [ ] M1.1 `lib/env.ts`, `lib/http.ts`, `lib/db.ts` (lazy firebase-admin), `lib/rate-limit.ts`, `lib/validation.ts`.
- [ ] M1.2 `lib/auth.ts` (sessions, require*, API-key helpers, bcrypt) + `auth.test.ts`.
- [ ] M1.3 `middleware.ts` (or `proxy.ts`) protecting `/admin/*` except `/admin/login`.
- [ ] M1.4 Routes: `POST /api/auth/admin-login`, `POST /api/auth/logout`, `GET /api/auth/session`, `POST /api/demo/login`.
- [ ] M1.5 `scripts/seed.ts` (see "Seed data" below). Idempotent: fixed document IDs, `set` with merge, safe to run repeatedly. Never deletes other data.
- **Exit:** check passes. Live (if env is present): seed runs twice cleanly; admin login and the demo picker work in the browser.

## M2: Knowledge (F1)

- [ ] M2.1 `lib/llm.ts` (`generate`, `embed`).
- [ ] M2.2 `lib/knowledge.ts` (extract, chunk, index with rollback, delete, search, cosine) + `knowledge.test.ts`.
- [ ] M2.3 `/api/admin/documents` GET/POST/DELETE.
- [ ] M2.4 Seed indexes `data/walkwave/policies.md` and `data/nova/policies.md` through `indexDocument`, with fixed ids `demo_walkwave_policy` and `demo_nova_policy`.
- **Exit:** check passes. Live: upload `public/demo/Walkwave_Policies.pdf` in the admin UI → indexed.

## M3: Chat core (F2–F5, F7)

- [ ] M3.1 `lib/guardrails.ts` + `guardrails.test.ts`.
- [ ] M3.2 `lib/orders.ts`, `lib/email.ts` (+ `email.test.ts`), `lib/escalations.ts`.
- [ ] M3.3 `lib/chat.ts` router exactly as specified + `chat.test.ts`.
- [ ] M3.4 `POST /api/chat` (SSE per [API.md](API.md)), `GET /api/escalation/[id]`.
- **Exit:** check passes. Live: the Walkwave bubble answers the policy, order, not-found, injection and refund questions.

## M4: Enterprise API (F6)

- [ ] M4.1 `POST /api/v1/chat` (key lookup by hash, customer-tenant check, usage counter, rate limit).
- [ ] M4.2 `POST /api/demo/enterprise-chat` (server-to-server forward with `APP_BASE_URL`).
- **Exit:** check passes. Live: the Nova page as Alice shows NV-1001, and the raw JSON panel is filled in.

## M5: Admin features (F5, F8)

- [ ] M5.1 `GET`/`PATCH /api/escalation` (transactional decision).
- [ ] M5.2 `/api/admin/api-keys` GET/POST/DELETE (hashed, shown once, revoke).
- [ ] M5.3 `GET /api/admin/stats` (real counts, `tokenUsage` = sum of `chat_history.tokens`).
- **Exit:** check passes. Live: reject a ticket in admin → Jane's bubble shows "rejected" within 5 seconds.

## M6: UI edits

- [ ] M6.1 Every "Edit" row in [UI.md](UI.md) for the shell, storefronts and admin.
- [ ] M6.2 Confirm every admin screen has loading, empty and error states.
- **Exit:** check passes. No link in the app leads to a 404 (crawl the nav links by hand or with a quick script).

## M7: Public pages truth pass (F9)

- [ ] M7.1 Rewrite the content of home, architecture, security and docs (API reference); edit pricing and login per [UI.md](UI.md).
- [ ] M7.2 The forbidden-claims grep in UI.md prints nothing; Target/Roadmap labels checked by hand.
- **Exit:** check passes.

## M8: Verification and hardening

- [ ] M8.1 `scripts/verify.ts` with every case in [TESTING.md](TESTING.md).
- [ ] M8.2 Security pass: every `app/api/**/route.ts` starts with an auth helper (except health/login/session/demo-login/logout); no `process.env.X || '<secret>'` fallbacks; no `error.message` from providers reaches the client; routes from the "must NOT exist" list are absent.
- [ ] M8.3 Live (if env is present): `npm run seed` → `npm run build && npm start` → `npm run verify` all PASS. Then `npm run verify -- --send-email` once.
- [ ] M8.4 Update README quick start if anything changed. Tag `demo-ready`.
- **Exit:** everything above passes, or every remaining item is listed as blocked in PROGRESS.md with a reason.

## Stretch: F10 Cloud Run

Only after M8. Add a `Dockerfile` (multi-stage, `node:20-slim`, `next build` with `output: 'standalone'`), follow [THIRD_PARTY_SETUP.md §5](THIRD_PARTY_SETUP.md), then run verify against the Cloud Run URL. Deploying needs a human with `gcloud` access, so prepare the files and the commands, and note them in PROGRESS.md.

---

## Seed data (`scripts/seed.ts`)

It reads `.env.local` with `@next/env` `loadEnvConfig`, uses `lib/db.ts` and `lib/knowledge.ts`, and **does not write to `.env.local`**. If a required env var is missing, it stops with a clear message.

| Collection / ID | Data |
|---|---|
| `tenants/tnt_walkwave` | `{ name: 'Walkwave', currency: 'LKR', refundLimit: 50000 }` |
| `tenants/tnt_nova` | `{ name: 'Nova Electronics', currency: 'LKR', refundLimit: 50000 }` |
| `business_admins/walkwave_admin` | `{ tenantId: 'tnt_walkwave', email: 'admin@walkwave.example', name: 'Walkwave Manager', passwordHash: bcrypt(WALKWAVE_ADMIN_PASSWORD), isActive: true }` |
| `business_admins/nova_admin` | same shape, `tnt_nova`, `admin@nova.example`, `NOVA_ADMIN_PASSWORD` |
| `users/walkwave_jane`, `walkwave_bob`, `nova_alice`, `nova_sam` | `{ tenantId, name, email: '<name>@<company>.example', isActive: true, isDemo: true }` (names and IDs from `lib/demo-config.ts`) |
| `demo_orders/WW-1001` … `NV-1002` | the 4 rows in [SPEC.md](SPEC.md#seed-orders), plus `currency: 'LKR'` |
| `api_keys/nova_demo_key` | `{ tenantId: 'tnt_nova', name: 'Nova server integration', keyHash: sha256(NOVA_DEMO_API_KEY), prefix, isActive: true, usageCount: 0, lastUsed: null, createdAt }` |
| `documents/demo_walkwave_policy` + chunks | `indexDocument` with `data/walkwave/policies.md`, title "Walkwave policies" |
| `documents/demo_nova_policy` + chunks | `indexDocument` with `data/nova/policies.md`, title "Nova Electronics policies" |

It prints a summary of what it created and updated. It must never print passwords or keys.
