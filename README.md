# AgentForge

AI customer support that companies plug in two ways: a ready-made chat widget, or their own interface calling our API. The assistant answers from the company's uploaded policies, looks up only the signed-in customer's orders, emails updates on request, and sends risky requests (large refunds) to a human manager.

Built for the **Beauty of Cloud 2.0** final. It is a working prototype with fictional companies (Walkwave, Nova Electronics) and sample data. Database reads, document indexing, AI answers, emails and manager tickets are real; payments are simulated.

## Quick start

```bash
cp .env.example .env.local   # fill in values, see docs/THIRD_PARTY_SETUP.md
npm install
npm run seed
npm run dev                  # http://localhost:3000
```

- Walkwave (chat widget): http://localhost:3000/walkwave
- Nova (custom UI via API): http://localhost:3000/nova
- Admin portal: http://localhost:3000/admin/login

## Docs

| Doc | What's in it |
|---|---|
| [docs/SPEC.md](docs/SPEC.md) | Scope, features, acceptance criteria, demo script |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | What runs today vs. the target Google Cloud design |
| [docs/SECURITY.md](docs/SECURITY.md) | Security rules, threat model, known limitations, forbidden claims |
| [docs/THIRD_PARTY_SETUP.md](docs/THIRD_PARTY_SETUP.md) | Firebase, OpenAI, Gmail, optional Cloud Run setup |
| [docs/DEMO_RUNBOOK.md](docs/DEMO_RUNBOOK.md) | Stage checklist and backup plan |
| [docs/MIGRATION.md](docs/MIGRATION.md) | What was ported from the previous repo |
| [CLAUDE.md](CLAUDE.md) | Rules for AI assistants and contributors |
