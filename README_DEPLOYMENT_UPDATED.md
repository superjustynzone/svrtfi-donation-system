# Deployment guide — Vercel + Supabase

This guide walks through deploying this project to Vercel with Supabase providing Postgres and Storage. It covers creating a Supabase project and importing the database, creating storage buckets, configuring Vercel environment variables, local testing, and a few production considerations.

Prerequisites

- Node.js 18+
- A Git repository (GitHub/GitLab/Bitbucket) connected to Vercel
- Supabase account (free tier is sufficient for testing)

1. Create a Supabase project and import the schema

- Create a new project at https://app.supabase.com.
- Open the project and go to SQL Editor → New query.
- Copy & paste the contents of `databasetables LATEST.sql` (in this repo) into the editor and run it, or upload the file and execute it to create the schema.

Alternative (psql):

```powershell
# Replace <CONNECTION_STRING> with your Supabase DATABASE_URL
psql "<CONNECTION_STRING>" -f "databasetables LATEST.sql"
```

Notes:

- If the SQL references extensions (e.g., `pgcrypto`) enable those from Supabase SQL editor.
- If import errors occur, inspect the SQL output and fix missing dependencies before proceeding.

2. Create Storage buckets

In Supabase Console → Storage → New Bucket create the buckets the app expects (names used throughout the code):

- `profiles` — profile images (public or private depending on your needs)
- `campaigns` — campaign media
- `receipts` — receipts and proof images
- `imports` — raw CSV uploads and generated export files
- `receipt_sequences` — optional bucket for sequences (the app primarily stores sequences in the DB)

Choose public/private per bucket depending on whether files should be directly accessible. For private buckets, the app must generate signed URLs for access.

3. Get Supabase keys and database connection

- From Supabase → Settings → API:
  - Project URL → set as `SUPABASE_URL` (and `VITE_SUPABASE_URL` for client)
  - anon public key → set as `VITE_SUPABASE_ANON_KEY`
  - service_role key → set as `SUPABASE_SERVICE_ROLE_KEY` (server-only, keep secret)
- From Supabase → Settings → Database → Connection string: copy the Postgres connection string and set it as `DATABASE_URL`.

Security: Keep `SUPABASE_SERVICE_ROLE_KEY` and `DATABASE_URL` server-only and protected in Vercel.

4. Configure environment variables in Vercel

- In Vercel, open your Project → Settings → Environment Variables and add:
  - `VITE_SUPABASE_URL` = <project url>
  - `VITE_SUPABASE_ANON_KEY` = <anon key>
  - `SUPABASE_URL` = <project url>
  - `SUPABASE_SERVICE_ROLE_KEY` = <service_role key> (PROTECTED)
  - `DATABASE_URL` = <postgres connection string> (PROTECTED)
  - `JWT_SECRET` = <random strong secret> (PROTECTED)
  - Optional SMTP vars (PROTECTED): `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SENDER`, `SMTP_ENCRYPTION`

Vercel Build settings (defaults usually suffice):

- Build Command: `npm run build`
- Output Directory: leave blank (Vite will be detected automatically)

Important: mark any server-only secrets as "Environment Variable - Protected" so they are not exposed to the frontend.

5. Deploy on Vercel

- Connect your Git repository to Vercel and deploy. Vercel will detect the app and deploy the frontend. All files under `api/` will be deployed as serverless functions automatically.

6. Local development & testing

- Install dependencies and Vercel CLI:

```powershell
npm install
npm i -g vercel
```

- Create a local `.env` file (DO NOT commit) with the same env variables as above.
- Run locally:

```powershell
vercel dev
```

- This serves the frontend and `api/` endpoints locally. The frontend uses relative `/api/*` calls so it will invoke the local functions.

7. CSV uploads & backward compatibility

- The serverless settings endpoint accepts both:
  - JSON payloads `{ fileName, contentBase64 }` (new flow used by updated frontend), and
  - multipart/form-data `file` field (legacy FormData) parsed by a small parser for small CSVs.

If you prefer full streaming/form-data handling for very large files, we can add `busboy`/`formidable` to the server package.

8. Reports CSV export & async option

- Large exports may exceed Vercel's execution time. The reports `/download` endpoint supports:
  - `maxRows` query param (defaults to a safe limit), and
  - `async=true` to request the serverless function to generate the CSV and upload it to the Supabase `imports` bucket, returning a public URL.

Use `async=true` for large date ranges to avoid timeouts.

9. Post-deploy checks and smoke tests

- Verify environment variables are present in Vercel and the database import succeeded.
- Run the added smoke test script (it expects a running instance of the site or `vercel dev`):

```powershell
npm run test:reports
```

The script calls `/api/admin/reports/summary` and `/api/admin/reports/download` to verify responses.

10. Production considerations

- Supabase free-tier has connection limits — this repo uses a cached global Pool in `api/_db.js` to help. Monitor connections in the Supabase dashboard.
- Consider using Supabase connection pooling (PgBouncer) or reduce concurrency if you hit connection limits.
- Implement background export jobs for extremely large reports rather than trying to run them synchronously in serverless functions.

11. Troubleshooting

- 500 / DB errors: verify `DATABASE_URL` and that the SQL schema imported successfully.
- Supabase storage errors: ensure the bucket exists, the service role key is correct, and the bucket policy matches your public/private requirements.
- JWT auth errors: admin endpoints require a JWT signed with `JWT_SECRET` and a `role` claim (one of `admin|finance|encoder|auditor`). For quick testing you can sign a token locally.

Need help automating these steps?

- I can generate a small script to create Supabase buckets and upload an initial SQL file via the Supabase CLI, or produce a Vercel project config for one-click deploy. Tell me which automation you prefer and I will add it.
