# Porting from the old BOC-2.0 repo

The old repo (`BOC-2.0/my-app`) is public and contains leaked credentials. **Copy files by hand. Never copy `.env*`, `credentials.txt`, or git history.** Every secret is regenerated for this repo.

## Bring over (then modify as noted)

| Old path | New path | Changes |
|---|---|---|
| `app/(public)/page.tsx`, `architecture`, `security`, `pricing` | same | Remove forbidden claims ([SECURITY.md](SECURITY.md)); architecture page follows [ARCHITECTURE.md](ARCHITECTURE.md) Part A vs. B |
| `app/(public)/layout.tsx`, `app/layout.tsx`, `app/globals.css`, `app/components/{NavHeader,ConditionalShell,AnimatedShader,PageBreadcrumb,AuthProvider}.tsx` | same | Remove links to deleted routes |
| `app/walkwave`, `app/nova`, `app/components/demo/*` | same | Nova calls `/api/nova/chat` |
| `app/admin/{layout,login,dashboard,documents,escalations,api-keys}` + `AdminSidebar.tsx` | same | Hide sidebar entries for pages not ported |
| `app/api/auth/{admin-login,logout,session}`, `app/api/demo/login` | same | Use `lib/auth` helpers |
| `app/api/chat`, `app/api/escalation`, `app/api/escalation/[id]`, `app/api/v1/chat` | same | firebase-admin; return JSON instead of an event stream (no streaming) |
| `app/api/demo/enterprise-chat` | `app/api/nova/chat` | `APP_BASE_URL` |
| `app/api/admin/{documents,api-keys,stats}` | same | Hash API keys; stats must be real counts |
| `lib/chat-service.ts` | `lib/chat.ts` | Add guardrails; recipient allowlist; model has no tools |
| `lib/knowledge.ts` | `lib/knowledge.ts` | Pinecone → `knowledge_chunks` + cosine search |
| `lib/rag.ts` | `lib/llm.ts` | Rewrite: `generate()` / `embed()` on OpenAI; delete the Gemini function declarations |
| `lib/tools.ts` | `lib/orders.ts`, `lib/email.ts`, `lib/escalations.ts` | Split; drop `generateReport`, `queryDatabase`, `companyDatabase` |
| `lib/guardrails.ts` | `lib/guardrails.ts` | Keep the input part (injection + PII); drop the output/tool-detect part |
| `lib/session.ts`, `middleware.ts` | `lib/auth.ts`, `middleware.ts` | No fallback secret; throw if `JWT_SECRET` is missing |
| `lib/firebase.ts` | `lib/db.ts` | firebase-admin |
| `lib/demo-config.ts` | same | New tenant IDs |
| `scripts/setup-demo.cjs`, `verify-demo.cjs` | `scripts/seed.ts`, `scripts/verify.ts` | firebase-admin + OpenAI; don't write secrets into `.env.local` |
| `public/demo/*`, `public/images/*`, `public/videos/*` | same | — |
| `../walkwave/policies.md`, `website-content.md` | `data/walkwave/` | Seed source |

## Do not bring over

`_legacy_routes/`, `app/ops/**`, `app/portal/**`, `app/shader`, `app/(public)/demo`, `app/(public)/docs`, `app/admin/{agents,analytics,reports,settings,users}`, `app/api/{agent,architecture,dev-seed,seed,fleet,kb,traces,report,ops/**,auth/ops-login,auth/user-*,admin/{agents,analytics,reports,settings,users}}`, `lib/{bigquery,pubsub,cloud-logging,secret-manager,trace-logger,request-validation}.ts`, `scripts/setup-{cloudwatch,dynamodb,sqs}.js`, `fix-*.js`, `migrate.js`, `add-fonts.js`, `extract-layout.js`, `seed_external.mjs`, `test_embed.js`, the root-level proposal and report markdown, `ui/*.html`, `credentials.txt`.

Dependencies to drop: `@aws-sdk/*`, `@google/generative-ai`, `@pinecone-database/pinecone`, `firebase` (client), `recharts` (unless the P1 dashboard needs it).
Dependencies to add: `openai`, `firebase-admin`.

## Port order

1. Scaffold the repo, `lib/db.ts`, `lib/auth.ts`, `middleware.ts`, then the seed script. Verify login works.
2. `lib/llm.ts`, `lib/knowledge.ts`, document upload (F1).
3. `lib/chat.ts` + `/api/chat` + Walkwave widget (F2–F5, F7).
4. `/api/v1/chat` + Nova (F6).
5. Admin escalations and API keys (F5, F8).
6. Public pages cleanup (F9).
