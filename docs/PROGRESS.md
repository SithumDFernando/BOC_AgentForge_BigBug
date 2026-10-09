# Progress Log

The build agent updates this after every task (see the protocol in [TASKS.md](TASKS.md)). Newest entries at the top.

## Status

| Milestone | State | Live-verified |
|---|---|---|
| M0 Scaffold | in progress | — |
| M1 Auth, data, seed | not started | — |
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

## Log

- 2026-10-10: M0.2 done. `vitest.config.ts` (node env, `@` alias, `lib/**/*.test.ts`). Added `passWithNoTests` so `npm run check` passes before the first test file exists.
- 2026-10-10: M0.1 done. Installed `openai`, `firebase-admin`, `vitest`, `tsx`. Bumped `@types/node` to ^22 for vitest's peer range (D13). Fixed 8 lint errors in copied UI with minimal edits (D14). No `.env.local` in the repo, so live checks will be marked "needs live verification".
- 2026-10-10: Repo created. Specs written. UI copied from the old repo (see [UI.md](UI.md)). No server code yet.
