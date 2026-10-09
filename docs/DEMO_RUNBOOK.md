# Demo Runbook

The order of fallbacks: **Cloud Run URL** → local `npm start` on the laptop (same Firestore) → the recording. Slides and talking points are in [PITCH.md](PITCH.md).

## Security housekeeping (once, before any public demo)

- [ ] The old Vercel deployment (`agentforgev2.vercel.app`) is taken down. It still accepts the old passwords and runs public demo logins.
- [ ] The old Firebase project is locked (deny-all rules) or deleted. Its database was readable with the public config (D4) and holds a plain-text Nova key.
- [ ] The old public GitHub repo no longer tracks `credentials.txt`, and every credential in it is rotated. Deleting the file doesn't remove it from history, so rotating is what matters.
- [ ] The new seed uses new passwords, and they live only in `.env.local` and Secret Manager.

## The evening before

- [ ] `npm run seed`, then `BASE_URL=<cloud run url> npm run verify` and a local `npm run verify`: everything passes.
- [ ] Full demo script ([SPEC.md](SPEC.md#demo-script-target-5-minutes)) rehearsed **three times** end to end, with a timer, once with `AGENT_TOOLS=off`.
- [ ] Test email received in `DEMO_EMAIL_TO`, and not in spam. For an email to a named address, that address is on `EMAIL_ALLOWLIST`; otherwise say "Email me that shipping update".
- [ ] Billing report and Vertex AI usage checked; budget alert active. If the OpenAI fallback is configured, its budget has > $2 left.
- [ ] Uptime check green; Cloud Logging filter for `jsonPayload.requestId` saved for step 9.
- [ ] Backup screen recording of the full script saved locally and on a USB drive. It must be labeled "recording" if it's played.
- [ ] Code frozen: tag `demo-final`. No commits after the freeze except fixes for things that block the demo.

## Morning of the demo

- [ ] `gcloud run services update agentforge --region asia-south1 --min-instances 1` (no cold start). `ENABLE_DEMO=true` is set. Afterwards: back to `--min-instances 0` and `ENABLE_DEMO` off.

## Stage setup (30 min before)

- [ ] Phone hotspot ready as a network fallback.
- [ ] Laptop fallback ready: `npm run build && npm start` (production mode, not `dev`).
- [ ] Browser profile 1: Walkwave on the Cloud Run URL, bubble closed (opening it signs in Jane automatically; open it once beforehand to check). Browser profile 2: Walkwave admin, logged in, on Escalations. Browser profile 3: Nova with Alice picked. Browser profile 4: Cloud Console on Logging and the uptime check. Walkwave and Nova share one session cookie per profile, so never open the Walkwave bubble in the Nova profile.
- [ ] (F12) Widget test page running on `localhost:4000` (`npm run widget-site`), if the widget is in the demo.
- [ ] Old test tickets rejected or cleared, so the new one is obvious.
- [ ] `Walkwave_Policies.pdf` on the desktop for the upload step. The policy is already indexed, so answers still work if the live upload fails.
- [ ] Zoom the browser to 125% so the audience can read it. Turn notifications off.
- [ ] Don't show pages that were cut: Platform Ops, Users & Access, Agents/"Website Agent", Analytics, Reports.

## If something breaks live

| Failure | Say | Do |
|---|---|---|
| Upload fails | "We indexed this policy earlier; here's the same flow." | Continue; the seeded policy answers |
| The model is slow, down, or picks the wrong tool | "If the model fails, the platform drops to deterministic rules. Watch." | It falls back by itself on errors. For wrong tool choices: `--update-env-vars AGENT_TOOLS=off` (≈1 min), or the recording |
| Cloud Run unreachable | "Same build, same database, running locally." | Switch to the laptop on `localhost:3000` |
| Email delayed | "SMTP accepted it; delivery can take a minute." | Come back to the inbox at the end |
| Wi-Fi down | — | Hotspot; else the recording |

## Q&A answers to prepare

- **How is tenant data isolated?** Every query, including vector search, filters on the tenant from the session, API key or widget token, never from user input. Rules deny all direct database access. (It's logical isolation; physical isolation is on the roadmap.)
- **The model calls tools. What stops it doing damage?** It only has four tools. The server injects who the customer is, checks every argument, caps calls at 3, builds email content from the database, and checks order facts after the model answers. The refund rule runs before the model, and no tool moves money or decides a ticket.
- **What if Gemini is down?** Fallback to OpenAI if configured, then deterministic rules. Show the `trace`.
- **Why did the design change from Round 1?** See the table in [PITCH.md](PITCH.md): we kept the GCP core and cut what the pilot doesn't need yet (Apigee, Memorystore, per-tenant indexes), and we corrected our own cost figures.
- **How does it scale?** Cloud Run autoscaling today (capped at 2 for cost); Part B of ARCHITECTURE.md for production. Be clear which is which.
- **Are you PDPA compliant?** No claim. We map controls to the Act and list the gaps, including cross-border processing ([SECURITY.md](SECURITY.md#pdpa-mapping-target-not-a-claim)).
- **What does it cost?** The cost slide: a labelled estimate from the GCP pricing calculator, plus our real billing to date.
- **What happens if data is lost?** Point-in-time recovery (7 days) and daily backups are switched on. Multi-region is Target.
