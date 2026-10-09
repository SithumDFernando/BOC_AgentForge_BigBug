# Progress Log

The build agent updates this after every task (see the protocol in [TASKS.md](TASKS.md)). Newest entries at the top.

## Status

| Milestone | State | Live-verified |
|---|---|---|
| M0 Scaffold | done | n/a (no secrets needed) |
| M1 Auth, data, seed | in progress | — |
| M2 Knowledge | not started | — |
| M3 Chat core | not started | — |
| M4 Enterprise API | not started | — |
| M5 Admin features | not started | — |
| M6 UI edits | not started | — |
| M7 Public pages truth pass | not started | — |
| M8 Verification | not started | — |

## Blockers

_None yet._

## Needs live verification

_Items built and unit-tested but not yet run against real Firebase/OpenAI/SMTP._

- M1.5: `npm run seed` twice against real Firestore (the second run should report only `updated`).
- M1.4: successful admin login, the session route with a real account, and demo login against seeded users (needs Firestore).

## Log

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
