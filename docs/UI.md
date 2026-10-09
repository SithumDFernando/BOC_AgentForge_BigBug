# UI Inventory and Required Changes

The frontend was copied from the old repo (`BOC-2.0/my-app`) and re-synced with its commit `c2d0621` on 2026-10-10 ([MIGRATION.md](MIGRATION.md)). Keep the visual design. Make **only** the changes listed here, and keep each change minimal. Styling uses Tailwind 4 with the design tokens in `app/globals.css` (`bg-surface`, `text-on-surface`, `primary`, …) and Material Symbols icons loaded in `app/layout.tsx`. The demo storefronts use plain CSS in `app/components/demo/demo.css`.

Legend: **Keep**: works against [API.md](API.md) with no edits · **Edit**: small listed changes.

The re-sync brought in the old repo's own truth pass: the public pages are now short and free of the forbidden claims, the `/demo` page is gone, and Walkwave opens its chat with an automatic demo customer session. What's left is listed below.

## Shell

| File | Status | Changes |
|---|---|---|
| `app/layout.tsx` | Edit | `metadata.description` → "AI customer support companies can trust." |
| `app/globals.css` | Keep | Re-synced at `9f06ce9`: light theme only. `.integration-code` may be used for the docs page code blocks |
| `app/components/AuthProvider.tsx` | Keep | Reads `GET /api/auth/session` → `{ user }`. Already typed with `SessionUser` (D14) |
| `app/components/NavHeader.tsx` | Keep | Links: Overview (`/`), Integrations (`/#integrations`), Guide (`/docs`), and an "Admin login" button (`/admin/login`). No dead links |
| `app/(public)/layout.tsx` | Keep | Footer: Integration guide, Data & privacy, Company admin, and "Hackathon prototype · Fictional company data". No version label or status pill |

## Public pages

| File | Status | Changes |
|---|---|---|
| `app/(public)/page.tsx` (home) | Edit | Feature "Email when requested": the text says the email goes to "the address the customer supplies", which is false. Use "Send an order update to the customer's verified address, or to an approved inbox they name." In the "simple workspace" steps, replace `02 Manage customer access` (there's no user-management screen, D11) with `02 Connect your website`: "Use the chat bubble, or create an API key for your own interface." Remove "and monitor agent activity" from step 03 |
| `app/(public)/architecture/page.tsx` ("How support works") | Edit | Step 3 says "Policy questions use indexed company documents"; add that the assistant chooses from four server-checked tools. Once PROGRESS.md records Cloud Run as live (M5b), add a short "Where it runs" list: Cloud Run (asia-south1), Firestore with vector search, Vertex AI, Secret Manager, Cloud Logging and Monitoring. Until then name no cloud service |
| `app/(public)/security/page.tsx` ("Data & privacy") | Edit | "Email updates": an address typed in the message is used only when it's on the approved list; otherwise the verified or demo address is used. "Demo accounts": "Walkwave signs in a prepared fictional customer automatically; Nova offers a picker. This is a demo shortcut, not real customer authentication." Add a short "Known limitations" section taken from [SECURITY.md](SECURITY.md) (demo identity, pattern-based injection check, in-memory rate limit, logical tenant isolation) |
| `app/(public)/pricing/page.tsx` ("Plans") | Keep | Says pricing isn't part of the prototype. No figures |
| `app/(public)/docs/page.tsx` ("Integration guide") | Edit | Add a short "Install the website widget" section with `id="widget"` (the admin widget page links to `/docs#widget`): enable it in Website widget, list the origins, paste the snippet, and for personal orders, build a server endpoint that calls `POST /api/widget/session` with the API key. Remove the bullets "Manage the prepared customer accounts in Users & Access" and "Check actual database and email actions in Website Agent" (both pages were cut, D11). Under the Enterprise API example, add one line with the error codes from [API.md](API.md#post-apiv1chat-api-key): `400` invalid input, `401` bad or inactive key, `403` customer not in this company, `429` rate limited |
| `app/(public)/login/page.tsx` ("Team access") | Edit | Replace the "Platform operations" card (links to `/ops/login`, which doesn't exist) with a "Try the demo stores" card linking to `/walkwave` and `/nova`. In the Company admin card, "customer access" → "API keys" |

### Forbidden-claims checklist (must pass before M7 is done)
This command must print **nothing** (from the repo root). It passed right after the 2026-10-10 re-sync:
```bash
grep -rniE "SOC ?2|HIPAA|ISO ?27001|GDPR|[0-9]{2}\.[0-9]+ ?%|\bSLA\b|\bSLO\b|production[- ]ready|mathematically|v2\.4\.0|pip install|Pinecone|DynamoDB|CloudWatch|AWS|Apigee|gVisor|Memorystore|Gemini [0-9]" app
```
`Vertex AI`, `Cloud Run`, `Cloud Armor`, `BigQuery`, `Pub/Sub`, `Secret Manager` and `Identity Platform` may appear **only** inside sections whose visible heading contains "Target" or "Roadmap". No page names any of them today. If F10 (Cloud Run deployment) is done, Cloud Run and Secret Manager may be described as running.

## Demo storefronts

| File | Status | Changes |
|---|---|---|
| `app/walkwave/page.tsx`, `app/nova/page.tsx` | Keep | Pass `enabled={demoEnabled()}` |
| `app/components/demo/DemoStorefront.tsx` | Keep | See "Demo customer sessions" below. Product photos load from `images.unsplash.com` (`next/image` with `unoptimized`, so no `images` config is needed). They're sample photography, not data |
| `app/components/demo/ChatPanel.tsx` | Edit | 1. Action-tag labels: add `guardrailBlocked` → "Blocked by safety check". Right now any unknown action shows "Manager review requested", which is wrong. 2. Walkwave no longer shows the customer anywhere, but F2 requires the signed-in name to be visible: in the heading, replace "Here to help you" with "Signed in as {name} (demo)", where `name` comes from `demoCompanies[company].customers` by `customerId`. Keep everything else, including the SSE parsing, the 5-second ticket polling, and the "Inspect API response" panel |
| `app/components/demo/demo.css` | Keep | — |
| `lib/demo-config.ts` | Keep | **Not** re-synced. The old repo changed `demoEnabled()` to always return `true`; ours still reads `ENABLE_DEMO` (SECURITY rule 10, D18). Tenant IDs stay `tnt_walkwave` / `tnt_nova` |

### Demo customer sessions
- **Walkwave** has no customer picker. Opening the assistant (the bubble, "Track my order →", "Say hello to our assistant", or "Ask our assistant" in a product dialog) calls `POST /api/demo/login` with `{ company: 'walkwave', customerId: customers[0].id }`, i.e. `walkwave_jane`, unless the browser already has a Walkwave customer session. The panel shows "Opening your assistant…", then the chat, or the API error with a "Try again" button. Bob can't be selected in the UI; `npm run verify` signs him in through the API.
- **Nova** keeps a picker (Alice / Sam) in the header and inside the panel. Both call the same route.
- With `ENABLE_DEMO` off, Nova shows "Support unavailable" and Walkwave shows the route's `403` message.
- Walkwave and Nova share one session cookie per browser profile, so opening the Walkwave bubble while signed in as Alice switches the profile to Jane. Use separate profiles ([DEMO_RUNBOOK.md](DEMO_RUNBOOK.md)).

## Admin portal

| File | Status | Changes |
|---|---|---|
| `app/admin/layout.tsx` | Keep | — |
| `app/admin/AdminSidebar.tsx` | Edit | Nav items: Dashboard, Knowledge Base, API Keys, Escalations, and (once F12 exists) Website widget → `/admin/widget`. Remove Users & Access, Agent Settings, Analytics, Agent Activity and Export Reports (those pages don't exist). Not re-synced: the old repo only renamed "Agent Activity" to "Website Agent" |
| `app/admin/login/page.tsx` | Keep | — |
| `app/admin/dashboard/page.tsx` | Keep | `/api/admin/stats` makes `tokenUsage` real (the sum of model tokens). Not re-synced: the old repo relabeled this tile "Recorded Chats" because its `tokenUsage` became a chat count. Ours stays "Token Usage" |
| `app/admin/documents/page.tsx` | Keep | Verify that upload shows the `400` error text from the API |
| `app/admin/api-keys/page.tsx` | Keep | The list shows the `key` prefix. On create it shows the full key once (API contract already matches) |
| `app/admin/widget/page.tsx` | Keep (new, F12) | Widget settings and the copyable snippet, adapted from the old repo's `WidgetSettings.tsx` (`122bfa4`). Reads and saves `/api/admin/widget` |
| `app/admin/escalations/page.tsx` | Edit | Re-synced: it now filters by `status` (pending / approved / rejected), sends no `tenantId` or `adminId`, takes an optional decision note, shows the customer's name, email, request and review rule, and has loading, empty and error states. Remaining edits: 1. The "How manager review works" text lists "a foreign-currency refund request", which isn't one of our rules (D8). Use "A refund request above LKR 50,000, or a refund request that asks for a manager, creates a pending ticket." 2. Show `amount` when it's present, formatted `LKR 75,000` (add `amount?: number \| null` to `Ticket`) |

## Embeddable widget files (F12)

| File | Status | Notes |
|---|---|---|
| `public/widget.js` | Keep | The old repo's loader, unchanged: it derives the AgentForge host from its own `src`, so nothing is hard-coded |
| `public/widget/frame.js` | Keep | The old repo's frame script, with `adminNote` (our field) instead of `decisionNote`, and the `guardrailBlocked` label |
| `public/widget/frame.css` | Keep | Unchanged |

## UI states every interactive screen must have

Loading indicator · empty state · readable error message (from `{ error }`) · disabled buttons while a request is in flight. The demo chat and the escalations page already have all four. Check the other admin pages for them.

## Not ported (don't recreate)

`/demo` (removed in the old repo too), `/portal/*`, `/ops/*`, `/shader`, `/studio`, `/launch`, `/replay`, `/incident`, `/escalation` (old), `/admin/{users,settings,analytics,agents,reports}`, `ConditionalShell`, `AdminGuard`, `AnimatedShader` (unused since the re-sync), `components/AdminSidebar`, `PageBreadcrumb`, and the static mockups in the old `ui/*.html`.
