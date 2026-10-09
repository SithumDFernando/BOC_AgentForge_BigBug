# Relationship to the old repo

The old repo (`BOC-2.0/my-app`) is public and contains leaked credentials. **Never copy `.env*`, `credentials.txt`, or git history from it.** Every secret here is new.

## Already copied into this repo (2026-10-10)

The frontend, configs, policy files and demo data, unchanged except for the tenant IDs in `lib/demo-config.ts` (`tnt_walkwave`, `tnt_nova`). The file-by-file list and required edits are in [UI.md](UI.md).

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
| `my-app/lib/knowledge.ts` | pdf-parse v2 usage (`new PDFParse({ data }).getText()` + `destroy()`), chunk sizes |
| `my-app/app/api/escalation/route.ts` | Tenant-scoped ticket decisions |
| `my-app/app/api/v1/chat/route.ts` | Customer-belongs-to-key's-tenant check |

## Not carried over

AWS libraries and scripts, Gemini/Pinecone code, `trace-logger`, the ops and portal areas, legacy routes, `fix-*.js` scripts, the seed/dev-seed routes, the old proposal and report markdown, `ui/*.html` mockups, and the images and video in `public/` (no page uses them; take them from the old repo for the pitch deck if you need them).
