# Pitch Plan

For the final: 15 minutes of presentation, then 5 minutes of Q&A. Rules and weights are in [reference/Beauty_of_Cloud_2.0_Finalists_Guidelines.md](reference/Beauty_of_Cloud_2.0_Finalists_Guidelines.md). Every claim on a slide must pass [SECURITY.md](SECURITY.md#forbidden-claims-ui-slides-docs): label Target items, label estimates, and show only measured numbers.

## Slide outline

The order follows the guidelines' recommended structure. Minutes are a budget; the demo gets the most.

| # | Slide | Judged under (weight) | Content | Min |
|---|---|---|---|---|
| 1 | Title | — | Team, Scenario 5 | 0.5 |
| 2 | Problem | Problem solving (20%) | SMEs can't safely let an AI act: wrong actions, no audit, cost, tenant leaks | 1 |
| 3 | Solution | Problem solving | One platform, two ways in (widget, API), four safe tools, a human for risky requests | 1 |
| 4 | Architecture: running today | Architecture (25%) | Part A diagram: Cloud Run, Firestore + vector search, Vertex AI, Secret Manager, Logging/Monitoring. Why each service | 2 |
| 5 | Architecture: target, and what changed since Round 1 | Architecture | Part B diagram + the table below (3–4 rows on the slide, the rest in Q&A) | 1.5 |
| 6 | Security and compliance | Security (15%) | Tool scoping, identity injection, output checks, deny-all rules, hashed keys, Secret Manager, the PDPA mapping (target, not a claim) | 1.5 |
| 7 | Reliability, monitoring, cost | Availability (15%), Cost (10%) | Degraded mode, uptime check, decision trace in Logging, PITR + backups, recovery goals (Target); the cost estimate | 1.5 |
| 8 | Live demo | MVP (5%) and evidence for everything above | [SPEC.md demo script](SPEC.md#demo-script-target-5-minutes) | 5 |
| 9 | Challenges and learnings | Presentation (10%) | Why tools needed server-side checks; correcting our own Round 1 costs; Vercel → GCP | 0.5 |
| 10 | Scope and roadmap | Presentation | The working / simulated / deferred lists below; the next steps | 0.5 |

## Round 1 → Final: what changed and why (D28)

| Round 1 | Final MVP | Why |
|---|---|---|
| Apigee gateway | Auth and rate limits in the app; Target: load balancer + Cloud Armor | Apigee's cost doesn't fit a pilot; the same tenant checks run in code |
| Six Cloud Run services | One Cloud Run service with the same module boundaries | One deployable for a 2-tenant pilot; split when load differs |
| Vertex AI Vector Search, one index per tenant | Firestore vector search, tenant-filtered | Under 200 chunks per tenant; one database, the same tenant filter |
| Gemini Flash/Pro routing, Claude fallback | Gemini on Vertex AI, OpenAI fallback, deterministic degraded mode | Same idea, fewer moving parts; the rules fallback works with no model at all |
| The model calls tools; output schema check | The model calls 4 scoped tools; the server injects identity, checks arguments, caps calls and checks order facts | Tightened: the riskiest parts never depend on the model |
| Memorystore semantic cache | None; Target | Not needed at demo scale |
| Pub/Sub approval queue | Firestore ticket that the chat polls; Pub/Sub is Target | Same flow, no extra service |
| Cloud Logging + BigQuery + Cloud Trace | Structured logs in Cloud Logging, `agent_actions`, `trace` in responses; BigQuery and Trace are Target | The decision trace exists today |
| Google sign-in/SSO with MFA | Email + bcrypt for admins; demo customer sessions; Target: Identity Platform | Time |
| `us-central1` | `asia-south1` | Closer to Sri Lankan users |
| Per-tenant document paths | Flat collections filtered by `tenantId` | Simpler queries; isolation is logical (stated as a limitation) |

### Round 1 figures we corrected (say this; it shows rigor)

- Vertex AI Vector Search isn't $0.16/month: deployed index endpoints are billed per node-hour, and one index per tenant multiplies that.
- Apigee isn't $0.45/month: it has no near-free tier.
- Memorystore was priced as one node but described as running with a high-availability replica.
- The cost table assumed a 5% cache hit rate while the text claimed 25–40%. The "routing saves ~$110" figure didn't follow from the table (it's about $250 against 95% Pro).
- The Gemini 1.5 model names and prices are out of date.
- "Automatic mTLS via the Cloud Run service mesh" and "multi-region replication within the region" were inaccurate. "Structurally impossible" leakage and the P50 latency figure were claims we can't back up.

Check current prices in the GCP pricing calculator before quoting any figure.

## Cost slide

1. **Estimate** (label it "Estimate, GCP pricing calculator, <date>"). Assumptions: 10 tenants, 15,000 conversations/month, 5 turns each, average tokens per turn from our own `tokenUsage` ÷ chat count. Lines: Cloud Run (requests, vCPU-seconds, min instances 0), Firestore (reads, writes, storage, PITR, backups), Vertex AI (Gemini input/output tokens, embeddings), Secret Manager, Logging (inside the free allowance), Monitoring. Show the per-conversation cost.
2. **Actual**: the billing report for the project to date, and the Vertex AI and OpenAI usage pages. Real numbers, no label needed.
3. **Controls**: scale to zero, max 2 instances, a budget alert, 3 tool calls per message, a 400-token reply cap, a rate limit per customer, and embeddings computed once at upload.

## Scope transparency (the guidelines require this)

- **Working:** policy upload and vector search; the Walkwave widget; the Nova API with a hashed key; order lookup for the signed-in customer only; real email through SMTP; guardrails; four scoped tools with a decision trace; manager review with live status; degraded mode; Cloud Run with Secret Manager, Logging, an uptime check, PITR and backups; the embeddable widget (if F12 is done).
- **Simulated or demo-only:** payments and refunds (a ticket only); customer identity (seeded demo customers); fictional companies, orders and products.
- **Deferred (Target):** Identity Platform, Cloud Armor, a second region, Pub/Sub, BigQuery audit, Memorystore, per-tenant indexes, Cloud DLP, data-subject tooling, and multi-model routing.
