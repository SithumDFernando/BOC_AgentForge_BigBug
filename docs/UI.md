# UI Inventory and Required Changes

The frontend was copied as-is from the old repo (`BOC-2.0/my-app`). Keep the visual design. Make **only** the changes listed here, and keep each change minimal. Styling uses Tailwind 4 with the design tokens in `app/globals.css` (`bg-surface`, `text-on-surface`, `primary`, …) and Material Symbols icons loaded in `app/layout.tsx`. The demo storefronts use plain CSS in `app/components/demo/demo.css`.

Legend: **Keep**: works against [API.md](API.md) with no edits · **Edit**: small listed changes · **Rewrite content**: keep layout and styling, replace the text and data.

## Shell

| File | Status | Changes |
|---|---|---|
| `app/layout.tsx` | Edit | `metadata.description` → "AI customer support companies can trust." |
| `app/globals.css` | Keep | — |
| `app/components/AuthProvider.tsx` | Keep | Reads `GET /api/auth/session` → `{ user }`. You may replace `any` with a `SessionUser` type |
| `app/components/NavHeader.tsx` | Edit | Links: keep `/#problem`, `/architecture`, `/pricing`, `/demo` (redirects to `/walkwave`). Remove `Personas`, `Pillars` and `Tech Stack` if their sections are removed from the home page. "Explore Docs" → `/docs` (the new API reference). Remove anything pointing to `/launch`, `/portal`, `/ops` |
| `app/components/AnimatedShader.tsx` | Keep | Used by the home page |
| `app/(public)/layout.tsx` | Edit | Footer: delete the `v2.4.0-rc` label and the fake "Hybrid Cloud Services: Operational" status pill. Footer links → Architecture, Security, API docs, Walkwave demo |

## Public pages

| File | Status | Changes |
|---|---|---|
| `app/(public)/page.tsx` (home, ~1060 lines) | Rewrite content | Keep the hero and section styling. Remove every forbidden claim (see the checklist below), plus "10,000 tenants", SLO/uptime figures, and model names that aren't in use. The tech-stack section lists only Part A of [ARCHITECTURE.md](ARCHITECTURE.md) (Next.js, Firestore, OpenAI, Gmail SMTP), plus a clearly labeled "Target on Google Cloud" group. CTAs go to `/walkwave` and `/nova` |
| `app/(public)/architecture/page.tsx` | Rewrite content | Two clearly labeled sections: **Prototype (running today)** and **Target on Google Cloud (roadmap)**, taken from [ARCHITECTURE.md](ARCHITECTURE.md). Remove AWS, DynamoDB, CloudWatch, Pinecone, Gemini version strings, Apigee, gVisor, Memorystore, every uptime/SLA percentage, the compliance badge line, and "mathematically impossible". Fake live status (`status: CLOSED | p99_sla`) goes |
| `app/(public)/security/page.tsx` | Rewrite content | Show the real controls from [SECURITY.md](SECURITY.md) (tenant scoping, no model tools, hashed API keys, rules deny all, idempotent actions, recipient allowlist) and a "Known limitations" block. Remove the SOC2/HIPAA/GDPR/ISO badges, "99.98% Intercept Accuracy", "OPERATIONAL", and the "SOC2 penetration harness" text |
| `app/(public)/pricing/page.tsx` | Edit | Label the page "Proposed pricing (illustrative)". Remove every SLA and uptime promise, SOC2/HIPAA lines, "78.7%"-style margin figures, and named infrastructure costs that aren't real. Keep the plan cards |
| `app/(public)/docs/page.tsx` | Rewrite content | Becomes the **API reference** for `POST /api/v1/chat` only: auth header, request/response JSON, error codes, a curl example with `af_YOUR_KEY`. Remove `pip install agentforge-sdk` (no SDK exists), telemetry/BigQuery/gVisor sections, and "99.99%" |
| `app/(public)/demo/page.tsx` | Keep | Redirects to `/walkwave` |
| `app/(public)/login/page.tsx` | Edit | Remove the "End User Portal" and "Platform Ops" cards. Keep "Tenant Admin" (→ `/admin/login`) and add a "Try the demo stores" card (→ `/walkwave`, `/nova`) |

### Forbidden-claims checklist (must pass before M7 is done)
This command must print **nothing** (from the repo root):
```bash
grep -rniE "SOC ?2|HIPAA|ISO ?27001|GDPR|[0-9]{2}\.[0-9]+ ?%|\bSLA\b|\bSLO\b|production[- ]ready|mathematically|v2\.4\.0|pip install|Pinecone|DynamoDB|CloudWatch|AWS|Apigee|gVisor|Memorystore|Gemini [0-9]" app
```
`Vertex AI`, `Cloud Run`, `Cloud Armor`, `BigQuery`, `Pub/Sub`, `Secret Manager` and `Identity Platform` may appear **only** inside sections whose visible heading contains "Target" or "Roadmap". Check this by hand. If F10 (Cloud Run deployment) is done, Cloud Run and Secret Manager may move to the "running today" section.

## Demo storefronts

| File | Status | Changes |
|---|---|---|
| `app/walkwave/page.tsx`, `app/nova/page.tsx` | Keep | — |
| `app/components/demo/DemoStorefront.tsx` | Edit | When `enabled` is false, the account control links to `/portal/login`, which no longer exists. Replace it with the text "Demo selection disabled" |
| `app/components/demo/ChatPanel.tsx` | Edit | Action-tag labels: add `guardrailBlocked` → "Blocked by safety check". Right now any unknown action shows "Manager review requested", which is wrong. Keep everything else, including the SSE parsing, the 5-second ticket polling, and the "Inspect API response" panel |
| `app/components/demo/demo.css` | Keep | — |
| `lib/demo-config.ts` | Keep | Tenant IDs are already updated to `tnt_walkwave` / `tnt_nova` |

## Admin portal

| File | Status | Changes |
|---|---|---|
| `app/admin/layout.tsx` | Keep | — |
| `app/admin/AdminSidebar.tsx` | Edit | Nav items: Dashboard, Knowledge Base, API Keys, Escalations. Remove Users & Access, Agent Settings, Analytics, Agent Activity and Export Reports (those pages don't exist) |
| `app/admin/login/page.tsx` | Keep | — |
| `app/admin/dashboard/page.tsx` | Keep | `/api/admin/stats` makes `tokenUsage` real (the sum of OpenAI tokens) |
| `app/admin/documents/page.tsx` | Keep | Verify that upload shows the `400` error text from the API |
| `app/admin/api-keys/page.tsx` | Keep | The list shows the `key` prefix. On create it shows the full key once (API contract already matches) |
| `app/admin/escalations/page.tsx` | Edit | Remove the `'tnt_sample01'` fallback and the `console.log` lines. Send `status=pending` only, without `tenantId`. Show `amount` when it's present, formatted `LKR 75,000`. Drop `adminId` from the PATCH body (the server ignores it anyway) |

## UI states every interactive screen must have

Loading indicator · empty state · readable error message (from `{ error }`) · disabled buttons while a request is in flight. The demo chat already has all four. Check the admin pages for them.

## Not ported (don't recreate)

`/portal/*`, `/ops/*`, `/shader`, `/studio`, `/launch`, `/replay`, `/incident`, `/escalation` (old), `/admin/{users,settings,analytics,agents,reports}`, `ConditionalShell`, `AdminGuard`, `components/AdminSidebar`, `PageBreadcrumb`, and the static mockups in the old `ui/*.html`.
