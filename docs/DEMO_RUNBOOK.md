# Demo Runbook

## The evening before

- [ ] `npm run seed` then `npm run verify` against the presentation laptop's environment: everything passes.
- [ ] Full demo script ([SPEC.md](SPEC.md#demo-script-target-4-minutes)) rehearsed **three times** end to end, with a timer.
- [ ] Test email received in `DEMO_EMAIL_TO`, and not in spam.
- [ ] OpenAI usage page checked; budget left > $2.
- [ ] Backup screen recording of the full script saved locally and on a USB drive. It must be labeled "recording" if it's played.
- [ ] Code frozen: tag `demo-final`. No commits after the freeze except fixes for things that block the demo.

## Stage setup (30 min before)

- [ ] Phone hotspot ready as a network fallback.
- [ ] `npm run build && npm start` (production mode, not `dev`). This is faster and has no dev overlay.
- [ ] Browser profile 1: Walkwave as Jane, bubble closed. Browser profile 2: Walkwave admin, logged in, on Escalations. Browser profile 3: Nova as Alice.
- [ ] Old test tickets rejected or cleared, so the new one is obvious.
- [ ] `Walkwave_Policies.pdf` on the desktop for the upload step. The policy is already indexed, so answers still work if the live upload fails.
- [ ] Zoom the browser to 125% so the audience can read it. Turn notifications off.

## If something breaks live

| Failure | Say | Do |
|---|---|---|
| Upload fails | "We indexed this policy earlier; here's the same flow." | Continue; the seeded policy answers |
| OpenAI slow or down | "The model provider is behind an interface; here's the recorded run." | Play the recording from that step |
| Email delayed | "SMTP accepted it; delivery can take a minute." | Come back to the inbox at the end |
| Wi-Fi down | — | Hotspot; else the recording |

## Q&A answers to prepare

- **How is tenant data isolated?** Every query filters on the tenant from the session or API key, never from user input. Rules deny all direct database access. (It's logical isolation; physical isolation is on the roadmap.)
- **What stops prompt injection?** A pattern block, but the real control is that the model has no tools. Every action is decided by server code.
- **Why OpenAI and not Gemini/Vertex?** Behind a provider interface; the target architecture uses Vertex AI. We chose a paid API for a reliable demo.
- **How does it scale?** See ARCHITECTURE.md Part B. Be clear it's the target, not what's running.
