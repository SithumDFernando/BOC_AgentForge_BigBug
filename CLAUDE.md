# CLAUDE.md

Context for AI coding assistants (Claude Code, Copilot, Cursor) and new teammates. Read this before changing code.

## What this is

A hackathon demo for Beauty of Cloud 2.0 (Scenario 5: AI Agent Platform for Business Automation). It is a deliberately small, honest prototype, not a platform. Scope lives in [docs/SPEC.md](docs/SPEC.md). **If it isn't in the spec, don't build it.**

## Stack

- Next.js 16 (App Router), React 19, TypeScript (strict), Tailwind CSS 4
- Firestore through `firebase-admin`, server only (`lib/db.ts`). Never import the Firebase client SDK.
- OpenAI through `lib/llm.ts` only (`generate()`, `embed()`). No other file imports `openai`.
- nodemailer → Gmail SMTP (`lib/email.ts`)
- jose (JWT session cookie) and bcryptjs (`lib/auth.ts`)

## Commands

```bash
npm run dev        # http://localhost:3000
npm run build      # must pass before every commit to main
npm run lint
npm run seed       # idempotent: tenants, admins, customers, orders, policies, Nova API key
npm run verify     # HTTP tests of the P0 flows against a running dev server
```

## Layout

```
app/(public)/        marketing pages (no false claims, see docs/SECURITY.md)
app/walkwave, app/nova   demo company sites
app/admin/           company admin portal
app/api/**/route.ts  thin handlers: auth → validate → call lib → JSON
lib/                 all logic; handlers stay thin
scripts/             seed and verify
data/                seed policies and website copy
docs/                spec, architecture, security, setup, runbook
```

## Rules you must follow

1. Every route handler starts with `requireAdmin()`, `requireCustomer()` or `requireApiKey()` from `lib/auth.ts`. The only exceptions are `/api/health` and the login routes.
2. `tenantId` and `userId` come from the session or the API key, **never** from the request body or the message.
3. Every Firestore query on tenant data includes `where('tenantId', '==', tenantId)`.
4. The model gets **no tools**. Order lookups, emails and escalations are decided in `lib/chat.ts` with plain code.
5. No secret has a fallback value. A missing env var throws at startup (`lib/env.ts`).
6. Return generic error messages to the client. Log the details with `console.error`.
7. Side effects (email, ticket) are idempotent per `requestId`.
8. No fake data in the UI: no `Math.random()` metrics, SLAs, compliance badges, or made-up counts. If it isn't computed from Firestore, don't show it.
9. Keep diffs small and match the existing style. Don't add dependencies without a reason in the PR description.
10. Never commit `.env*` (except `.env.example`), service-account JSON, or credentials.

Full rules and reasons: [docs/SECURITY.md](docs/SECURITY.md).

## Definition of done for a change

`npm run build` passes · `npm run verify` passes · the acceptance checkboxes in `docs/SPEC.md` for the feature are met and ticked · no new forbidden claims.
