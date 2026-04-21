# Vercel + Supabase environment variables and deployment notes

This file lists environment variables the project expects and guidance for setting them in Vercel (Project Settings → Environment Variables).

## Client (exposed to browser)
- `VITE_SUPABASE_URL` — your Supabase project URL (e.g. `https://xxx.supabase.co`)
- `VITE_SUPABASE_ANON_KEY` — Supabase anon/public key

These are safe to add as Vercel environment variables but must use the `VITE_` prefix so Vite exposes them as `import.meta.env.VITE_*` in the client bundle.

## Server / Serverless (server-only, PROTECTED)
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service_role key (DO NOT expose to client)
- `DATABASE_URL` — Postgres connection string (if any server-side code connects directly)
- `JWT_SECRET` (or other app-specific secrets)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` or `SENDGRID_API_KEY` — mail settings used by server code

Set these environment variables in Vercel and mark them as "Environment Variable (Secret)" (do not print them in logs).

## Deployment summary
1. Connect repository to Vercel.
2. Ensure the project root has `package.json` with build scripts (`npm run build` will call `vite build`).
3. In Vercel project settings, add the variables above. For client keys use the `VITE_` prefix.
4. Deploy. Vercel will run the static build and expose `api/*` files as serverless functions.

## Notes & troubleshooting
- The serverless `api/` functions use `api/_supabase.js` which expects `SUPABASE_SERVICE_ROLE_KEY` for privileged operations. Ensure that key is set server-side only.
- If you need the legacy `server/` folder to run as a single Node process, you must deploy it separately (e.g., Render/Fly/DigitalOcean) and update the client `vite.config.js` proxy/production endpoints.
- Large client bundles: the build emitted a >500KB chunk; consider code-splitting or lazy-loading heavy modules (e.g., pdf/html2canvas, charting libs).
