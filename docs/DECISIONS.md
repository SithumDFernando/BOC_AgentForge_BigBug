# Decision Log

These decisions are settled. Don't reopen them while building. A new decision goes at the bottom using the same format (an agent may add one only for something these docs don't cover, and must say so in [PROGRESS.md](PROGRESS.md)).

### D1. Fresh repo, curated port
The old repo is public, contains credentials, and has a lot of dead code. We copy only the UI and specs. Every secret is regenerated and the Firebase project is new.

### D2. OpenAI instead of Gemini free tier
The free tier is rate limited and sometimes returns "model overloaded" errors, which is too risky live. A paid OpenAI key ($4 budget, capped at $3) is reliable. All calls go through `lib/llm.ts`, so the target architecture can swap in Vertex AI.

### D3. No vector database; embeddings live in Firestore
A tenant has fewer than ~200 chunks, so cosine similarity in memory is instant. This removes Pinecone (one fewer key and failure point) and keeps tenant filtering inside the same query. Target: Firestore `findNearest` or Vertex AI Vector Search.

### D4. firebase-admin on the server; Firestore rules deny all
The old app used the browser SDK on the server, which forced the database open to anyone with the public config. With the Admin SDK plus deny-all rules, only our server can access data.

### D5. The model has no tools; server code decides every action
Order lookups, emails and escalations are triggered by deterministic rules in `lib/chat.ts`. The model only writes policy answers from the provided text. This makes prompt injection low-impact and the demo predictable.

### D6. Keep the copied UI's API contract
`ChatPanel` parses Server-Sent Events from `/api/chat`, and Nova calls `/api/demo/enterprise-chat`. We keep both, so the UI files stay unchanged. Streaming is one-shot (actions, then the final text). No token streaming.

### D7. Two fixed demo companies, demo customer picker
Walkwave (widget) and Nova (API). Customers sign in through a picker gated by `ENABLE_DEMO`. Real customer authentication is on the roadmap (Identity Platform).

### D8. LKR and a 50,000 refund limit
This matches the seeded policies. A refund above the limit, or an explicit request for a human, always creates a manager ticket. No money ever moves.

### D9. Email via Gmail SMTP with an allowlist
Real email is a strong demo moment. The allowlist and once-per-`requestId` rule stop it from becoming a spam relay.

### D10. API keys hashed (SHA-256), shown once
Keys are high-entropy random values, so an unsalted SHA-256 is enough. The stored prefix supports display.

### D11. Cut scope
No ops portal, self-registration, user management, analytics charts, reports, PDF generation, OCR, or multi-database connectors. Every cut screen was showing fake data or adding attack surface.

### D12. Cloud Run is a stretch goal (F10)
Local `npm start` is the primary demo environment. Cloud Run in the same Firebase/GCP project comes only after all P0 items pass.

### D13. `@types/node` bumped from ^20 to ^22 (agent decision, M0.1)
`vitest@5` declares a peer range of `@types/node` `^22 || >=24`, so `npm install -D vitest` fails with ERESOLVE on `^20`. Bumping a type-only dev package is smaller and safer than pinning an older vitest or using `--legacy-peer-deps`. Runtime is unaffected (local Node is 24; the stretch Dockerfile's Node 20 does not read these types).

### D14. Minimal lint fixes in copied UI files (agent decision, M0.1)
`npm run check` must pass, but the copied UI had 8 ESLint errors. Fixed with the smallest possible edits and no behavior change: escaped two apostrophes on `/login`, replaced `any` with a `SessionUser` type in `AuthProvider` (UI.md allows this) and an `Escalation` type on the escalations page, moved two `useEffect` calls below the functions they call, and suppressed `react-hooks/set-state-in-effect` on three effects with a reason (each fetch function awaits before setting state, so the rule's warning is a false positive).

### D15. API-key auth accepts any bearer token shape (agent decision, M1.2)
Generated keys are always `af_` + 48 hex, but `NOVA_DEMO_API_KEY` is created by a human from `.env.example`, which only says "long random value". `requireApiKey` therefore accepts any 8–200 character bearer token and authorizes only on an exact sha256 hash match with `isActive: true`. Rejecting by format would add no security (an unknown hash already fails) and would break the demo for a key in another format.

### D16. The seed preserves counters and creation times (agent decision, M1.5)
TASKS.md lists `usageCount: 0, lastUsed: null, createdAt` for the Nova key and also requires a safe, repeatable seed. A plain merge would reset the key's usage (and the dashboard's real numbers) on every run. Those fields, and `createdAt` on every seeded doc, are written only when the document doesn't exist. Every other field is merged each run, so rotating a password or `NOVA_DEMO_API_KEY` in `.env.local` and re-seeding updates the hash.
