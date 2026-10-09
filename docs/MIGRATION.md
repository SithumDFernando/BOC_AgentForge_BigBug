# Relationship to the old repo

The old repo (`BOC-2.0/my-app`) is public and contains leaked credentials. **Never copy `.env*`, `credentials.txt`, or git history from it.** Every secret here is new.

## Already copied into this repo (2026-10-10)

The frontend, configs, policy files and demo data, unchanged except for the tenant IDs in `lib/demo-config.ts` (`tnt_walkwave`, `tnt_nova`) and the lint fixes in D14. The file-by-file list and required edits are in [UI.md](UI.md).

**Re-synced on 2026-10-10** with the old repo's commit `c2d0621` (11 commits after the first copy at `dcd24ec`). Re-copied: the seven `app/(public)` pages and layout, `NavHeader`, `DemoStorefront`, `ChatPanel`, `demo.css`, `app/admin/escalations/page.tsx` and `next.config.ts`. Deleted: `app/(public)/demo` (removed upstream) and `AnimatedShader` (no longer used). Deliberately **not** re-synced:

| Old-repo change | Why not |
|---|---|
| `lib/demo-config.ts`: `demoEnabled()` always `true` | SECURITY rule 10 keeps the `ENABLE_DEMO` gate (D18). Our tenant IDs stay |
| Admin dashboard tile relabeled "Recorded Chats" | Our `tokenUsage` is real token usage, so "Token Usage" is correct |
| `app/admin/AdminSidebar.tsx`: "Agent Activity" → "Website Agent" | We remove that item anyway (D11) |
| `/api/demo/enterprise-chat` reading a plain key from Firestore; `VERCEL_PROJECT_PRODUCTION_URL` fallback | Server code is rebuilt, not copied; both conflict with D10 and D17 (D19) |
| `/admin/users` customer-access changes, `/admin/agents`, analytics, reports, settings | Cut pages (D11) |
| `walkwave/demo-runbook.md` | Its behavior notes are folded into UI.md and DEMO_RUNBOOK.md |

| Copied | From |
|---|---|
| `app/` pages and components | `my-app/app/` |
| `lib/demo-config.ts` | `my-app/lib/demo-config.ts` |
| `public/demo/*` (policy PDF/TXT) | `my-app/public/demo/` |
| `data/walkwave/*` | `BOC-2.0/walkwave/` |
| `data/nova/policies.md` | `my-app/public/demo/Nova_Electronics_Policies.txt` |
| `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs` | `my-app/` |

## Server code: rebuild, don't copy

All of `lib/` (except `demo-config.ts`), every `app/api/**` route, `middleware.ts` and `scripts/` are built new from [API.md](API.md) and [MODULES.md](MODULES.md), following [TASKS.md](TASKS.md). The old code used the Firebase browser SDK, Gemini and Pinecone, so it can't be reused directly.

If you have access to the old repo, these files are useful **reference only** (behavior they got right):

| Old file | Useful for |
|---|---|
| `my-app/lib/chat-service.ts` | Intent regexes, order reply wording, email idempotency with a transaction |
| `my-app/lib/knowledge.ts` | pdf-parse v2 usage with the lazily loaded worker (`pdf-parse/worker`, `setWorker`, `CanvasFactory`, `destroy()`), chunk sizes |
| `my-app/app/api/escalation/route.ts` | Tenant-scoped ticket decisions, the status filter, the same-tenant customer name lookup |
| `my-app/app/api/v1/chat/route.ts` | Customer-belongs-to-key's-tenant check |

## Not carried over

AWS libraries and scripts, Gemini/Pinecone code, `trace-logger`, the ops and portal areas, legacy routes, `fix-*.js` scripts, the seed/dev-seed routes, the old proposal and report markdown, `ui/*.html` mockups, and the images and video in `public/` (no page uses them; take them from the old repo for the pitch deck if you need them).
