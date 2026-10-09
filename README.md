# AgentForge

AI customer support that companies plug in two ways: a ready-made chat widget, or their own interface calling our API. The assistant answers from the company's uploaded policies, looks up only the signed-in customer's orders, emails updates on request, and sends risky requests (large refunds) to a human manager.

Built for the **Beauty of Cloud 2.0** final. It is a working prototype with fictional companies (Walkwave, Nova Electronics) and sample data. Database reads, document indexing, AI answers, emails and manager tickets are real; payments are simulated.

## Quick start

```bash
cp .env.example .env.local   # fill in values, see docs/THIRD_PARTY_SETUP.md
gcloud auth application-default login   # Firestore and Vertex AI credentials
npm install
npm run seed
npm run dev                  # http://localhost:3000
```

- Walkwave (chat widget; opening it signs in the demo customer Jane): http://localhost:3000/walkwave
- Nova (custom UI via API): http://localhost:3000/nova
- Admin portal: http://localhost:3000/admin/login

## Docs

| Doc | What's in it |
|---|---|
| [CLAUDE.md](CLAUDE.md) | Start here: rules for AI assistants and contributors, doc reading order |
| [docs/SPEC.md](docs/SPEC.md) | Scope, features, acceptance criteria, demo script |
| [docs/TASKS.md](docs/TASKS.md) | Build plan and autonomous working protocol |
| [docs/PROGRESS.md](docs/PROGRESS.md) | Build status and blockers |
| [docs/API.md](docs/API.md) | Every API route and its contract |
| [docs/MODULES.md](docs/MODULES.md) | Server module design, chat routing rules, prompt |
| [docs/UI.md](docs/UI.md) | Frontend inventory and required edits |
| [docs/TESTING.md](docs/TESTING.md) | Unit and live verification cases |
| [docs/DECISIONS.md](docs/DECISIONS.md) | Settled design decisions |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | What runs today vs. the target Google Cloud design |
| [docs/SECURITY.md](docs/SECURITY.md) | Security rules, threat model, known limitations, forbidden claims |
| [docs/THIRD_PARTY_SETUP.md](docs/THIRD_PARTY_SETUP.md) | Google Cloud, Vertex AI, Gmail, Cloud Run setup |
| [docs/PITCH.md](docs/PITCH.md) | Slide plan, Round 1 changes, cost and scope |
| [docs/DEMO_RUNBOOK.md](docs/DEMO_RUNBOOK.md) | Stage checklist and backup plan |
| [docs/MIGRATION.md](docs/MIGRATION.md) | What came from the previous repo |
