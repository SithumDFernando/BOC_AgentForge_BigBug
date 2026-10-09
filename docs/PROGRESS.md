# Progress Log

The build agent updates this after every task (see the protocol in [TASKS.md](TASKS.md)). Newest entries at the top.

## Status

| Milestone | State | Live-verified |
|---|---|---|
| M0 Scaffold | done | n/a (no secrets needed) |
| M1 Auth, data, seed | done (offline) | **no**: no `.env.local` yet |
| M2 Knowledge | done (offline) | **no** |
| M3 Chat core | not started | — |
| M4 Enterprise API | not started | — |
| M5 Admin features | not started | — |
| M5b Cloud Run, monitoring, recovery | not started | — |
| M5c Website widget (P1) | not started | — |
| M6 UI edits | not started | — |
| M7 Public pages truth pass | not started | — |
| M8 Verification | not started | — |

## Blockers

- **No live environment yet.** A git-ignored `.env` exists (Next.js and `npm run seed` both load it, like `.env.local`), but by length `FIREBASE_PRIVATE_KEY` (61 chars) and `OPENAI_API_KEY` (6 chars) are still placeholders, it predates the Vertex AI variables (`LLM_PROVIDER`, `GOOGLE_CLOUD_PROJECT`, `VERTEX_*`), and this machine has no `gcloud` or Application Default Credentials. Values were checked by length only and never printed. Fix: follow THIRD_PARTY_SETUP §2–3 and copy the new names from `.env.example`.

## Needs live verification

_Items built and unit-tested but not yet run against real Firestore, Vertex AI or SMTP._

- M1.5: `npm run seed` twice against real Firestore (the second run should report only `updated`).
- M2: `npm run seed` indexing both policies (needs the vector index), and uploading `public/demo/Walkwave_Policies.pdf` in the admin UI → indexed.
- M1.4: successful admin login, the session route with a real account, and demo login against seeded users (needs Firestore).

## Log

- 2026-10-10: M2.4 done; **M2 exit (offline) passed.** The seed indexes `data/walkwave/policies.md` and `data/nova/policies.md` through `indexDocument` with the fixed ids `demo_walkwave_policy` / `demo_nova_policy` (re-runs replace the chunks), and its env check now also requires the embedding provider's variables. `npm run check` passes (36 tests). The live upload is under "Needs live verification".
- 2026-10-10: M2.3 done. `/api/admin/documents` GET/POST/DELETE (admin only, tenant from the session, 4 MB request guard, title ≤ 200 characters defaulting to the filename, `maxDuration` 60). Checked on the dev server: 401 without a session; with an admin token, `.png` → 400 "Please upload a PDF or TXT file.", an empty file → 400, a bad id → 400; `Walkwave_Policies.pdf` parsed and then failed at Firestore with a generic 500 (no credentials, see Blockers).
- 2026-10-10: M2.2 done. `lib/knowledge.ts`: lazy PDF parsing (unreadable PDF → 400), chunking, `indexDocument` (embed first so a failure writes nothing; replaces old chunks of a fixed id; refuses another tenant's id; rolls back chunks if the document write fails), `listDocuments`, `deleteDocument` (document first, then chunks), `searchKnowledge` with a tenant-filtered cosine `findNearest` (distance ≤ 0.8, indexed docs only; logs a hint if the vector index is missing). `knowledge.test.ts`: 12 tests on an in-memory Firestore fake. A real `findNearest` needs the vector index (THIRD_PARTY_SETUP §2.7).
- 2026-10-10: M2.1 done. `lib/log.ts` (structured JSON logs, `recordAction`) and `lib/llm.ts`: Vertex AI via `@google/genai` 2.28 (new dependency, D21) and OpenAI, tool calls in both provider formats, Gemini's raw content replayed for thought signatures, 1 retry on 429/5xx/network, OpenAI fallback for `generate` only, 768-dim embeddings with batching and a length check. Output cap 1024 tokens (D29). `lib/env.ts` gained the Vertex names. `llm.test.ts`: 10 tests with mocked SDKs. Not yet run against real Vertex AI (needs a project).
- 2026-10-10: **Plan changes approved by the team and applied to the docs.** Cloud Run becomes P0 as M5b (D20, reverses D12; GCP over the AWS credits). Vertex AI Gemini is the model, with OpenAI as an optional fallback (D21). The model gets four scoped tools, with the deterministic rules kept as degraded mode (D22, reverses D5). Firestore vector search (D23), structured logs (D24), PITR and daily backups on (D25), PDPA as a mapped target (D26), the embeddable widget as F12/M5c (D27), and the Round 1 divergences explained in the new `docs/PITCH.md` (D28). SPEC F1, F3–F5, F7 and F10–F12, SECURITY rules 1, 2, 5, 7 and 10–12 and the PDPA mapping, ARCHITECTURE, MODULES, API, TASKS, TESTING, THIRD_PARTY_SETUP, DEMO_RUNBOOK, CLAUDE.md, README and `.env.example` were updated. Committed `.gitignore` (`*_private.md`).
- 2026-10-10: Second re-sync with the old repo (`9f06ce9`, 2 commits). Took `app/globals.css` (light-theme readability fix). Did not port the embeddable website widget from `122bfa4`: it's out of scope in SPEC and its server code conflicts with SECURITY rule 4 and D10; recorded in MIGRATION.md as pending a scope decision. `npm run check` passes.
- 2026-10-10: **Re-synced the frontend and docs with the old repo** (`BOC-2.0` at `c2d0621`, 11 new commits). Re-copied the public pages, `NavHeader`, the storefront, chat panel and CSS, the admin escalations page and `next.config.ts` (PDF worker packaging); deleted `/demo` and the now-unused `AnimatedShader`. Not ported: `demoEnabled()` always `true`, the plain-text Nova key read from Firestore, the Vercel URL fallback, and the "Recorded Chats" relabel (MIGRATION.md has the table). New decisions D17 (no Vercel; D12 unchanged), D18 (Walkwave auto demo session, `ENABLE_DEMO` gate kept), D19 (Nova key from env only). Updated UI, SPEC (F2 box and demo script, for the removed Walkwave picker), API (demo-login callers, escalation fields), MODULES, ARCHITECTURE, TASKS, TESTING, SECURITY (known limitation only), DEMO_RUNBOOK, THIRD_PARTY_SETUP, MIGRATION, README, CLAUDE.md and `.env.example`. Four lint errors in the copied escalations page got D14-style fixes. `npm run check` passes; the forbidden-claims grep prints nothing. No new dependency: the PDF worker's `@napi-rs/canvas` comes with `pdf-parse`.
- 2026-10-10: **M1 exit (offline) passed.** `npm run check` passes (14 unit tests). With `ENABLE_DEMO=true` in dev: an unknown company (including `toString`) → 400, a customer from the other company → 403, a valid pick reaches the Firestore read. The live half of the exit (seed twice, admin login and the demo picker in a browser) is under "Needs live verification".
- 2026-10-10: M1.5 done. `scripts/seed.ts` seeds tenants, admins, demo customers, the 4 orders and `api_keys/nova_demo_key`. Fixed IDs, `set` with merge, never deletes. `createdAt`, and the key's `usageCount`/`lastUsed`, are written only on first create, so re-seeding doesn't reset usage (D16). Policy documents are added in M2.4, once `lib/knowledge.ts` exists. The Nova admin name is "Nova Manager" (not specified; mirrors Walkwave). Checked: a missing env stops with a list of names; with fake env it reaches the Firestore connection, which shows the imports and `@/` alias resolve under tsx; no secret value is printed.
- 2026-10-10: M1.4 done. `POST /api/auth/admin-login` (10/min per IP, the same 401 for an unknown email, a wrong password or an inactive account, with a dummy bcrypt compare for unknown emails to equalize timing), `POST /api/auth/logout`, `GET /api/auth/session` (re-checks that the account exists, is active and matches the tenant; `no-store`), `POST /api/demo/login`. Added `readJson` (400 on malformed JSON) and `clientIp` to `lib/http.ts`. Checked in dev without Firestore: validation 400s, the demo gate 403, the rate limit 429, `{ user: null }` with no cookie, and a generic 500 when the database is unreachable.
- 2026-10-10: M1.3 done. `proxy.ts` (Next 16 deprecates `middleware.ts`) redirects `/admin` and `/admin/*` except `/admin/login` when there's no valid admin JWT. Checked in dev with a throwaway shell `JWT_SECRET`: no cookie, a garbage cookie and a customer session → 307 to `/admin/login`; an admin token → 200; `/admin/login` → 200.
- 2026-10-10: M1.2 done. `lib/auth.ts` per MODULES.md, plus `signSession`/`verifySession` (shared by `getSession`) and `hashPassword` (bcrypt cost 10, used by the seed). `requireApiKey` accepts any bearer token shape and validates only by sha256 lookup + `isActive`, because the docs don't fix the format of `NOVA_DEMO_API_KEY` (D15). `auth.test.ts` covers the required cases, plus role checks, a missing `JWT_SECRET` and API-key lookup with a mocked db.
- 2026-10-10: M1.1 done. `lib/rate-limit.ts` (in-memory sliding window, prunes stale keys past 10k entries) and `lib/validation.ts` (`parseChatInput`), with `validation.test.ts`. `env`/`http`/`db` were already written in M0.3.
- 2026-10-10: M0.4 done; **M0 exit passed.** `GET /api/health` → `{ ok: true }`. `npm run check` passes (0 lint errors, 11 pre-existing warnings in copied UI). Under `npm run dev`, `/`, `/architecture`, `/security`, `/pricing`, `/docs`, `/login`, `/walkwave`, `/nova`, `/admin/login` and `/admin/dashboard` all return 200.
- 2026-10-10: M0.3 done. The copied UI imports no server module (only `lib/demo-config.ts`), so throwaway stubs weren't needed. Wrote the real `lib/env.ts`, `lib/http.ts` and `lib/db.ts` (lazy firebase-admin, no import-time env reads) instead. `lib/auth.ts` lands in M1.2.
- 2026-10-10: M0.2 done. `vitest.config.ts` (node env, `@` alias, `lib/**/*.test.ts`). Added `passWithNoTests` so `npm run check` passes before the first test file exists.
- 2026-10-10: M0.1 done. Installed `openai`, `firebase-admin`, `vitest`, `tsx`. Bumped `@types/node` to ^22 for vitest's peer range (D13). Fixed 8 lint errors in copied UI with minimal edits (D14). No `.env.local` in the repo, so live checks will be marked "needs live verification".
- 2026-10-10: Repo created. Specs written. UI copied from the old repo (see [UI.md](UI.md)). No server code yet.
