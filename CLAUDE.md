# CLAUDE.md

Context for AI coding assistants (Claude Code, Codex, Copilot, Cursor) and new teammates. Read this before changing code.

## What this is

A hackathon demo for Beauty of Cloud 2.0 (Scenario 5: AI Agent Platform for Business Automation). It is a deliberately small, honest prototype, not a platform. Scope lives in [docs/SPEC.md](docs/SPEC.md). **If it isn't in the spec, don't build it.**

## Current state

The frontend is copied in from the previous repo (re-synced 2026-10-10, see [docs/MIGRATION.md](docs/MIGRATION.md)). The server side is being built by following [docs/TASKS.md](docs/TASKS.md): M0 and M1 (env, db, http, auth, `proxy.ts`, auth and demo-login routes, seed) are done, M2 onward is not. Log progress in [docs/PROGRESS.md](docs/PROGRESS.md). The demo is meant to run on Cloud Run (F10, M5b); until PROGRESS.md says it's live, it runs locally.

## Docs: read in this order

| Doc | Use it for |
|---|---|
| [docs/SPEC.md](docs/SPEC.md) | What to build, with acceptance criteria |
| [docs/DECISIONS.md](docs/DECISIONS.md) | Settled choices. Don't reopen them |
| [docs/TASKS.md](docs/TASKS.md) | Ordered build plan, autonomous working protocol, seed data |
| [docs/API.md](docs/API.md) | Every route: auth, request, response, errors |
| [docs/MODULES.md](docs/MODULES.md) | `lib/` functions, routing rules, the prompt |
| [docs/UI.md](docs/UI.md) | Copied UI files and the exact edits they need |
| [docs/TESTING.md](docs/TESTING.md) | Unit test cases and live verification cases |
| [docs/SECURITY.md](docs/SECURITY.md) | Security rules, threat model, forbidden claims |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System diagram, request flow, data model, target cloud design |
| [docs/THIRD_PARTY_SETUP.md](docs/THIRD_PARTY_SETUP.md) | Google Cloud, Vertex AI, Gmail, Cloud Run setup (humans do this) |
| [docs/PITCH.md](docs/PITCH.md) | Slide plan, Round 1 changes, cost and scope slides |

## Stack

- Next.js 16 (App Router), React 19, TypeScript (strict), Tailwind CSS 4
- Firestore through `firebase-admin`, server only (`lib/db.ts`). Never import the Firebase client SDK.
- Vertex AI (Gemini) through `lib/llm.ts` only (`generate()` with tools, `embed()`), OpenAI as an optional fallback. No other file imports `@google/genai` or `openai`.
- Firestore vector search (`findNearest`) for policy chunks
- Cloud Run (`asia-south1`), Secret Manager, Cloud Logging/Monitoring; structured logs via `lib/log.ts`
- nodemailer → Gmail SMTP (`lib/email.ts`)
- jose (JWT session cookie) and bcryptjs (`lib/auth.ts`)
- Vitest for unit tests, tsx for scripts

## Commands

```bash
npm run dev        # http://localhost:3000
npm run check      # typecheck + lint + unit tests + build: run after every task
npm test           # unit tests only (no secrets needed)
npm run seed       # idempotent demo data (needs .env.local)
npm run verify     # live HTTP tests against a running server (needs .env.local)
```

## Layout

```
app/(public)/            marketing pages + integration guide (no false claims)
app/walkwave, app/nova   demo company sites (widget / custom UI)
app/admin/               company admin portal
app/api/**/route.ts      thin handlers: auth → validate → call lib → respond
app/admin/widget        widget settings (F12)
lib/                     all logic, with *.test.ts next to it
public/widget.js         embeddable widget loader (F12)
scripts/                 seed.ts, verify.ts, widget-site.ts
Dockerfile               Cloud Run image (F10)
data/                    seed policies and website copy
docs/                    specs
```

## Rules you must follow

1. Every route handler starts with `requireAdmin()`, `requireCustomer()`, `requireApiKey()` (`lib/auth.ts`) or `requireWidget()` (`lib/widget.ts`). The only exceptions are listed in SECURITY rule 2 (`/api/health`, `/api/auth/*`, `/api/demo/login`, and the public widget bootstrap routes).
2. `tenantId` and `userId` come from the session, the API key or the widget token, **never** from the request body, the message, or model tool arguments.
3. Every Firestore query on tenant data filters `tenantId`. Reads by document ID check `tenantId` and return 404 on a mismatch.
4. The model can use **only** the four tools in `lib/tools.ts`. The server injects identity, validates arguments, caps calls at 3, builds order facts and email bodies from the database, and runs the refund rule before the model. No tool moves money or decides a ticket.
5. No secret has a fallback value. Read env vars lazily via `lib/env.ts`; never at import time (`next build` runs without secrets).
6. Return generic error messages to the client. Log the details with `lib/log.ts` (structured JSON).
7. Side effects (email, ticket) are idempotent per `requestId`.
8. No fake data in the UI: no `Math.random()` metrics, SLAs, compliance badges, or made-up counts. If it isn't computed from Firestore, don't show it.
9. Don't change the API paths or response fields the UI uses ([docs/API.md](docs/API.md)) without making the matching UI edit.
10. Keep diffs small and match the existing style. Only the dependencies listed in TASKS.md.
11. Never commit `.env*` (except `.env.example`), service-account JSON, or credentials.

## Definition of done for a task

`npm run check` passes · the relevant acceptance boxes in SPEC.md are met · PROGRESS.md updated · committed.
