# Third-Party Setup

Humans do this; it needs accounts and a billing card. Three accounts are required and one is optional. Nothing else: no Pinecone, no AWS, no Vercel. (The old repo's demo ran on Vercel, which isn't a platform the competition permits, so this repo doesn't use it. See D17.)

Put every local value into `.env.local` (copy it from `.env.example`). Never commit it. In the cloud, the same values live in Secret Manager (§5).

## 1. GitHub (required, ~5 min)

- Create a **private** repository. Add teammates.
- Settings → Code security → turn on **Secret scanning** and **Push protection**.

## 2. Google Cloud / Firebase project (required, ~30 min)

A Firebase project *is* a Google Cloud project. Firestore, Vertex AI, Cloud Run, Secret Manager and Cloud Logging all live in this one project.

1. https://console.firebase.google.com → **Add project** (e.g. `agentforge-boc`). Google Analytics is not needed.
2. Upgrade the project to the **Blaze** plan with a billing account (new Google Cloud accounts usually get trial credit; check the current terms). Billing → **Budgets & alerts** → a budget of $10 with email alerts at 50% and 90%.
3. Build → **Firestore Database** → Create database → **Native mode**, location `asia-south1` (Mumbai, closest to Sri Lanka) → start in **production mode**.
4. Firestore → Rules → paste the contents of `firestore.rules` (deny all) → Publish.
5. Install the `gcloud` CLI → `gcloud auth login` → `gcloud config set project <id>`.
6. Enable the APIs:
   ```bash
   gcloud services enable firestore.googleapis.com aiplatform.googleapis.com run.googleapis.com \
     cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com \
     logging.googleapis.com monitoring.googleapis.com
   ```
7. **Vector index** for knowledge search (D23). Takes a few minutes to build:
   ```bash
   gcloud firestore indexes composite create --database='(default)' \
     --collection-group=knowledge_chunks --query-scope=COLLECTION \
     --field-config=order=ASCENDING,field-path=tenantId \
     --field-config=field-path=embedding,vector-config='{"dimension":"768","flat":"{}"}'
   ```
8. **Recovery** (D25):
   ```bash
   gcloud firestore databases update --database='(default)' --enable-pitr
   gcloud firestore backups schedules create --database='(default)' --recurrence=daily --retention=7d
   ```
9. **Local credentials.** Run `gcloud auth application-default login`. With `FIREBASE_PRIVATE_KEY` unset, `lib/db.ts` and Vertex AI both use these Application Default Credentials, so no key file is needed. Set `GOOGLE_CLOUD_PROJECT` and `FIREBASE_PROJECT_ID` to the project ID. (A service-account key in `FIREBASE_*` still works, but avoid it: if you create one, copy the three values and delete the JSON file.)

Free Firestore quotas (50k reads and 20k writes per day) cover the demo and rehearsals.

## 3. Vertex AI models (required, ~5 min)

1. Console → Vertex AI → Model Garden. Pick the current **Gemini Flash** model → `VERTEX_MODEL`, and the current text-embedding model that supports 768-dimension output → `VERTEX_EMBEDDING_MODEL`.
2. `VERTEX_LOCATION`: use `asia-south1` if both models are offered there; otherwise the nearest listed region or `global`. Record the choice: it's part of the cross-border disclosure in [SECURITY.md](SECURITY.md).
3. `LLM_PROVIDER=vertex`.

## 4. Gmail SMTP for outgoing email (required, ~10 min)

1. Use a dedicated Gmail account (e.g. `walkwave.demo@gmail.com`), not a personal one.
2. Turn on **2-Step Verification** (required before Google allows app passwords).
3. https://myaccount.google.com/apppasswords → create one called `agentforge` → copy the 16-character password → `SMTP_PASS`.
4. `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, `SMTP_USER=<gmail address>`, `SMTP_FROM="Walkwave Support <gmail address>"`.
5. `DEMO_EMAIL_TO` = an inbox you can open on stage. `EMAIL_ALLOWLIST` = comma-separated addresses that customers may name explicitly.
6. Send a test the day before the demo, and check the spam folder.

## OpenAI (optional fallback, ~5 min)

Only if you want `LLM_FALLBACK=openai` (D21). Create a project and key → `OPENAI_API_KEY`, set a monthly budget of about $3, pick the cheapest current "mini" model → `OPENAI_MODEL`, and set `OPENAI_EMBEDDING_MODEL=text-embedding-3-small` (only used if `LLM_PROVIDER=openai`).

## 5. Cloud Run deployment (required, F10, ~1–2 h the first time)

The repo provides the `Dockerfile` (M5b). Run these from the repo root.

1. **Service account** with only what the app needs:
   ```bash
   PROJECT=$(gcloud config get-value project)
   gcloud iam service-accounts create agentforge-run
   SA=agentforge-run@$PROJECT.iam.gserviceaccount.com
   for ROLE in roles/datastore.user roles/aiplatform.user roles/secretmanager.secretAccessor roles/logging.logWriter roles/monitoring.metricWriter; do
     gcloud projects add-iam-policy-binding $PROJECT --member=serviceAccount:$SA --role=$ROLE
   done
   ```
2. **Secrets.** One per value, typed in from your terminal and never committed:
   ```bash
   for NAME in JWT_SECRET SMTP_PASS NOVA_DEMO_API_KEY WALKWAVE_ADMIN_PASSWORD NOVA_ADMIN_PASSWORD; do
     read -rs -p "$NAME: " VALUE; echo; printf '%s' "$VALUE" | gcloud secrets create $NAME --data-file=-
   done
   ```
   (Add `OPENAI_API_KEY` the same way if you use the fallback.)
3. **Deploy:**
   ```bash
   gcloud run deploy agentforge --source . --region asia-south1 --service-account $SA \
     --min-instances 0 --max-instances 2 --allow-unauthenticated \
     --set-env-vars LLM_PROVIDER=vertex,GOOGLE_CLOUD_PROJECT=$PROJECT,FIREBASE_PROJECT_ID=$PROJECT,VERTEX_LOCATION=<loc>,VERTEX_MODEL=<model>,VERTEX_EMBEDDING_MODEL=<model>,SMTP_HOST=smtp.gmail.com,SMTP_PORT=587,SMTP_USER=<addr>,SMTP_FROM=<from>,DEMO_EMAIL_TO=<inbox>,EMAIL_ALLOWLIST=<list>,ENABLE_DEMO=true \
     --set-secrets JWT_SECRET=JWT_SECRET:latest,SMTP_PASS=SMTP_PASS:latest,NOVA_DEMO_API_KEY=NOVA_DEMO_API_KEY:latest
   ```
   The admin passwords are needed only by `npm run seed`, which runs from a laptop.
4. Set `APP_BASE_URL` to the service URL that the deploy prints: `gcloud run services update agentforge --region asia-south1 --update-env-vars APP_BASE_URL=<url>`. It has no fallback, so the deployed Nova page fails with a clear server log until it's set.
5. **Uptime check:** Console → Monitoring → Uptime checks → Create → HTTPS, host = the service host, path `/api/health`, check every 5 minutes → alert policy that emails the team.
6. **(P1) Log-based metrics:** Logging → Log-based metrics → counter metrics on `jsonPayload.action="guardrail"`, `jsonPayload.action="escalation"`, `jsonPayload.status="error"`, and `httpRequest.status>=500` → one Monitoring dashboard.
7. Run `BASE_URL=<url> npm run verify`.
8. Demo day: `--min-instances 1` in the morning (avoids a cold start), back to 0 afterwards. Turn `ENABLE_DEMO` off when you aren't demoing. `--update-env-vars AGENT_TOOLS=off` switches to the deterministic rules in about a minute.

Keep the local version working as the fallback either way.

## Summary

| Service | Required | Gives us | Secrets |
|---|---|---|---|
| GitHub | Yes | Private repo, secret scanning | — |
| Google Cloud / Firebase | Yes | Firestore (data + vectors), Vertex AI, Cloud Run, Secret Manager, Logging, Monitoring | none locally (ADC); Secret Manager in the cloud |
| Gmail | Yes | Real outgoing email | `SMTP_USER`, `SMTP_PASS` |
| OpenAI | Optional | Fallback model | `OPENAI_API_KEY` |
