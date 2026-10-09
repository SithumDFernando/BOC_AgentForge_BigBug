# Third-Party Setup

Four accounts are required. One more is optional. Nothing else: no Pinecone, no Gemini API key, no AWS, no Vercel. (The old repo's demo ran on Vercel, which isn't a platform the competition permits, so this repo doesn't use it. See D17.)

Put every value into `.env.local` (copy it from `.env.example`). Never commit it.

## 1. GitHub (required, ~5 min)

- Create a **private** repository. Add teammates.
- Settings → Code security → turn on **Secret scanning** and **Push protection**.

## 2. Firebase / Google Cloud project (required, ~15 min)

A Firebase project *is* a Google Cloud project, so the optional Cloud Run deployment later uses this same project.

1. https://console.firebase.google.com → **Add project** (e.g. `agentforge-boc`). Google Analytics is not needed.
2. Build → **Firestore Database** → Create database → **Native mode**, location `asia-south1` (Mumbai, closest to Sri Lanka) → start in **production mode**.
3. Firestore → Rules → paste the contents of `firestore.rules` (deny all) → Publish.
4. Project settings → **Service accounts** → Generate new private key → you get a JSON file. Copy three values into `.env.local`, then **delete the JSON file**:
   - `FIREBASE_PROJECT_ID` ← `project_id`
   - `FIREBASE_CLIENT_EMAIL` ← `client_email`
   - `FIREBASE_PRIVATE_KEY` ← `private_key` (keep the `\n` escapes, wrap it in double quotes)
5. The first time a query needs a composite index, the server log prints a link that creates it. Click the link, wait about 1 minute.

Not needed: Firebase Auth, Storage, Hosting, or the web app config (`NEXT_PUBLIC_FIREBASE_*`).

Free Spark plan limits (50k reads and 20k writes per day) are enough for the demo and rehearsals.

## 3. OpenAI (required, ~5 min)

1. https://platform.openai.com → create a **Project** called `agentforge-demo`.
2. Project → API keys → create a key → `OPENAI_API_KEY`.
3. Settings → Limits → set a **monthly budget** of about $3, so a bug in a loop can't drain your $4.
4. Pick the cheapest current "mini" chat model on the pricing page → `OPENAI_MODEL`. Embeddings: `text-embedding-3-small` → `OPENAI_EMBEDDING_MODEL`.

Expected cost: under $1 for setup, the demo, and rehearsals.

## 4. Gmail SMTP for outgoing email (required, ~10 min)

1. Use a dedicated Gmail account (e.g. `walkwave.demo@gmail.com`), not a personal one.
2. Turn on **2-Step Verification** (required before Google allows app passwords).
3. https://myaccount.google.com/apppasswords → create one called `agentforge` → copy the 16-character password → `SMTP_PASS`.
4. `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, `SMTP_USER=<gmail address>`, `SMTP_FROM="Walkwave Support <gmail address>"`.
5. `DEMO_EMAIL_TO` = an inbox you can open on stage. `EMAIL_ALLOWLIST` = comma-separated addresses that customers may name explicitly.
6. Send a test the day before the demo, and check the spam folder.

## 5. Cloud Run deployment (optional, P2, ~2–3 h)

Only after every P0 item works locally.

1. Upgrade the Firebase project to **Blaze**, with a billing account. The $300 free trial credit covers it. Set a **budget alert** at $5.
2. Install the `gcloud` CLI → `gcloud auth login` → `gcloud config set project <id>`.
3. Enable the APIs: Cloud Run, Cloud Build, Artifact Registry, Secret Manager.
4. Store every secret from `.env.local` in Secret Manager. On Cloud Run, Application Default Credentials replace the `FIREBASE_*` service-account variables.
5. `gcloud run deploy agentforge --source . --region asia-south1 --min-instances 1 --set-secrets ...`
6. Set `APP_BASE_URL` to the Cloud Run URL, so the Nova server route calls the deployed API. It has no fallback, so the deployed Nova page fails with a clear server log until it's set. Set `ENABLE_DEMO=true` only on a deployment meant for the demo.

Keep the local version as the fallback for the live demo either way.

## Summary

| Service | Required | Gives us | Secrets |
|---|---|---|---|
| GitHub | Yes | Private repo, secret scanning | — |
| Firebase / Firestore | Yes | Database for everything, including vectors | `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` |
| OpenAI | Yes | Answers + embeddings | `OPENAI_API_KEY` |
| Gmail | Yes | Real outgoing email | `SMTP_USER`, `SMTP_PASS` |
| Google Cloud Run | Optional | Public URL and a real cloud deployment | (Secret Manager) |
