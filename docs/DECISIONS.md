# Decision Log

These decisions are settled. Don't reopen them while building. A new decision goes at the bottom using the same format (an agent may add one only for something these docs don't cover, and must say so in [PROGRESS.md](PROGRESS.md)).

### D1. Fresh repo, curated port
The old repo is public, contains credentials, and has a lot of dead code. We copy only the UI and specs. Every secret is regenerated and the Firebase project is new.

### D2. OpenAI instead of Gemini free tier (superseded by D21)
The free tier is rate limited and sometimes returns "model overloaded" errors, which is too risky live. A paid OpenAI key ($4 budget, capped at $3) is reliable. All calls go through `lib/llm.ts`, so the target architecture can swap in Vertex AI.

### D3. No vector database; embeddings live in Firestore (revised by D23)
A tenant has fewer than ~200 chunks, so cosine similarity in memory is instant. This removes Pinecone (one fewer key and failure point) and keeps tenant filtering inside the same query. Target: Firestore `findNearest` or Vertex AI Vector Search.

### D4. firebase-admin on the server; Firestore rules deny all
The old app used the browser SDK on the server, which forced the database open to anyone with the public config. With the Admin SDK plus deny-all rules, only our server can access data.

### D5. The model has no tools; server code decides every action (superseded by D22)
Order lookups, emails and escalations are triggered by deterministic rules in `lib/chat.ts`. The model only writes policy answers from the provided text. This makes prompt injection low-impact and the demo predictable.

### D6. Keep the copied UI's API contract
`ChatPanel` parses Server-Sent Events from `/api/chat`, and Nova calls `/api/demo/enterprise-chat`. We keep both, so the UI files stay unchanged. Streaming is one-shot (actions, then the final text). No token streaming.

### D7. Two fixed demo companies, demo customer picker (refined by D18)
Walkwave (widget) and Nova (API). Customers sign in through a picker gated by `ENABLE_DEMO`. Real customer authentication is on the roadmap (Identity Platform).

### D8. LKR and a 50,000 refund limit
This matches the seeded policies. A refund above the limit, or an explicit request for a human, always creates a manager ticket. No money ever moves.

### D9. Email via Gmail SMTP with an allowlist
Real email is a strong demo moment. The allowlist and once-per-`requestId` rule stop it from becoming a spam relay.

### D10. API keys hashed (SHA-256), shown once
Keys are high-entropy random values, so an unsalted SHA-256 is enough. The stored prefix supports display.

### D11. Cut scope
No ops portal, self-registration, user management, analytics charts, reports, PDF generation, OCR, or multi-database connectors. Every cut screen was showing fake data or adding attack surface.

### D12. Cloud Run is a stretch goal (F10) (superseded by D20)
Local `npm start` is the primary demo environment. Cloud Run in the same Firebase/GCP project comes only after all P0 items pass.

### D13. `@types/node` bumped from ^20 to ^22 (agent decision, M0.1)
`vitest@5` declares a peer range of `@types/node` `^22 || >=24`, so `npm install -D vitest` fails with ERESOLVE on `^20`. Bumping a type-only dev package is smaller and safer than pinning an older vitest or using `--legacy-peer-deps`. Runtime is unaffected (local Node is 24; the stretch Dockerfile's Node 20 does not read these types).

### D14. Minimal lint fixes in copied UI files (agent decision, M0.1)
`npm run check` must pass, but the copied UI had 8 ESLint errors. Fixed with the smallest possible edits and no behavior change: escaped two apostrophes on `/login`, replaced `any` with a `SessionUser` type in `AuthProvider` (UI.md allows this) and an `Escalation` type on the escalations page, moved two `useEffect` calls below the functions they call, and suppressed `react-hooks/set-state-in-effect` on three effects with a reason (each fetch function awaits before setting state, so the rule's warning is a false positive).

### D15. API-key auth accepts any bearer token shape (agent decision, M1.2)
Generated keys are always `af_` + 48 hex, but `NOVA_DEMO_API_KEY` is created by a human from `.env.example`, which only says "long random value". `requireApiKey` therefore accepts any 8–200 character bearer token and authorizes only on an exact sha256 hash match with `isActive: true`. Rejecting by format would add no security (an unknown hash already fails) and would break the demo for a key in another format.

### D16. The seed preserves counters and creation times (agent decision, M1.5)
TASKS.md lists `usageCount: 0, lastUsed: null, createdAt` for the Nova key and also requires a safe, repeatable seed. A plain merge would reset the key's usage (and the dashboard's real numbers) on every run. Those fields, and `createdAt` on every seeded doc, are written only when the document doesn't exist. Every other field is merged each run, so rotating a password or `NOVA_DEMO_API_KEY` in `.env.local` and re-seeding updates the hash.

### D17. No Vercel hosting; D12 unchanged (agent decision, frontend re-sync)
The old repo's last commits hosted its demo on Vercel (a `VERCEL_PROJECT_PRODUCTION_URL` fallback for the API address, and PDF-worker packaging for Vercel functions). This repo doesn't adopt Vercel. It isn't one of the cloud platforms the finalist rules permit (AWS, GCP, Azure), and nothing in this repo has been deployed there, so naming it would be a false claim. We keep only the platform-neutral part of that work, the PDF runtime isolation ([MODULES.md](MODULES.md#libknowledgets)), which a Cloud Run standalone build also needs. Hosting stays as D12 says (local first, Cloud Run as F10). Whether Cloud Run should be promoted to P0 is a separate decision for the team.

### D18. Walkwave opens with an automatic demo customer session (refines D7, re-sync)
The old repo removed Walkwave's customer picker: opening the assistant signs in `walkwave_jane` through `POST /api/demo/login`. Nova keeps its picker. We keep this, because it removes a step from the stage demo. We did **not** keep the old repo's other change, which made `demoEnabled()` always return `true`. Demo sessions still need `ENABLE_DEMO=true` (SECURITY rule 10), and the route still accepts only the seeded `isDemo` customers of `lib/demo-config.ts`. D7 otherwise stands: demo identity is not real customer authentication.

### D19. The Nova key stays in the environment, never in Firestore in plain text (re-sync)
The old repo's `/api/demo/enterprise-chat` fell back to reading a plain-text key from `api_keys/nova_demo_key` when `NOVA_DEMO_API_KEY` was unset. That breaks D10 (only the SHA-256 hash is stored), so it isn't ported. The seed stores only `keyHash` and `prefix`. The route reads the key from `env('NOVA_DEMO_API_KEY')` and calls `APP_BASE_URL` with no platform-specific fallback.

### D20. Cloud Run is P0 (reverses D12; approved by the team 2026-10-10)
The finalist rules require "a meaningful portion of the cloud architecture" demonstrated live, and Architecture, Reliability and Cost are 50% of the marks. The app runs on Cloud Run in `asia-south1`, in the Firebase project, with Secret Manager and Cloud Logging (F10). It's built in M5b, right after M5, so M6–M8 are verified in the cloud. Local `npm start` is the fallback. GCP over the team's AWS credits: Round 1 was GCP, the data is already in Firestore, and demo-scale usage should fit GCP's free usage allowances.

### D21. Vertex AI Gemini is the model; OpenAI is an optional fallback (revises D2; approved)
D2's concern was the free Gemini API tier. Paid Vertex AI doesn't share it, matches Round 1, and authenticates with the service identity, so there's no model key. `LLM_PROVIDER=vertex|openai` picks the primary for both `generate` and `embed`. If `LLM_FALLBACK=openai` and `OPENAI_API_KEY` are set, `generate` retries on OpenAI when Vertex fails. Embeddings never fall back: vectors from two models aren't comparable, so they always come from the primary, at 768 dimensions. Switching the primary means re-indexing (`npm run seed` re-indexes the seeded policies).

### D22. The model gets four scoped tools (reverses D5; approved)
Round 1's first focus was safe tool-calling. The model may call `searchPolicies`, `getMyOrders`, `sendEmailUpdate` and `requestManagerReview` ([MODULES.md](MODULES.md#libtoolsts)). Safety lives in the server, not the prompt:
- identity is injected, never an argument;
- arguments are schema-checked;
- at most 3 calls per message;
- the refund rule runs before the model and can't be skipped;
- email recipients and email bodies come from server code;
- order facts are checked after the model answers;
- no tool moves money, edits data outside the request, or decides a ticket.

The deterministic router stays as degraded mode, used when the model fails, and as the `AGENT_TOOLS=off` switch for the stage.

### D23. Firestore vector search instead of in-memory cosine (revises D3; approved)
Chunks store `embedding` as a Firestore vector. Search uses `where('tenantId','==',t).findNearest(...)` (cosine, top 5), which needs one composite vector index ([THIRD_PARTY_SETUP.md](THIRD_PARTY_SETUP.md)). Tenant filtering stays in the same query, and Pinecone stays out. Vertex AI Vector Search remains the Target for large tenants.

### D24. Structured logs to stdout, no logging library
`lib/log.ts` prints one JSON object per event (`severity`, `message`, `tenantId`, `requestId`, `action`, `status`, `latencyMs`, `tokens`). Cloud Run ships stdout to Cloud Logging, which parses JSON into fields, so log-based metrics and the decision-trace filter need no extra dependency. Logs never contain secrets, raw messages (scrubbed only), or email bodies.

### D25. Point-in-time recovery and daily backups are on for real (approved)
Both are cheap Firestore features, so they're switched on rather than shown as Target. Multi-region disaster recovery stays Target. Firestore has no Asia multi-region location, so it means choosing between data residency and multi-region ([ARCHITECTURE.md](ARCHITECTURE.md)).

### D26. Sri Lanka's PDPA is a named target, never a claim
We map our controls to the Personal Data Protection Act, No. 9 of 2022 ([SECURITY.md](SECURITY.md#pdpa-mapping-target-not-a-claim)) and say openly what isn't done, including cross-border processing.

### D27. The embeddable website widget is P1 (F12), rebuilt to our rules (approved)
Taken from the idea in the old repo's commit `122bfa4`, not its code: that code had a hard-coded fallback signing secret, looked up API keys by plain value, and hard-coded a Vercel origin. It's built in M5c after Cloud Run.

### D28. Round 1 divergences are explained, not rebuilt
Apigee, Memorystore, Pub/Sub approvals, BigQuery, Cloud Trace, six separate services and per-tenant indexes stay in the Target architecture. [PITCH.md](PITCH.md) has the table of each change and its reason, and the list of Round 1 estimates we corrected.
