# Deployment

How the site is built, deployed and configured. This replaces the earlier
`REMAINING_WORK.md`, `DEPLOYMENT_OPTIONS.md` and `docs/MIGRATION_TO_GITHUB_PAGES.md`
(see git history for those).

## Architecture

```
GitHub (main) ──push──▶ Vercel Git integration ──▶ Next.js site
                                                    ├─ pages: static, content from frontend/src/content
                                                    └─ POST /api/contact: route handler → SMTP email
```

- **Content** (profile, projects, experience, skills) lives in
  [`frontend/src/content/index.ts`](../frontend/src/content/index.ts). Edit, push, done.
- **Contact form** posts to the app's own `/api/contact` route handler
  ([`frontend/src/app/api/contact/route.ts`](../frontend/src/app/api/contact/route.ts)),
  which validates, rate-limits and sends an email over SMTP.
- **No backend host and no database are needed at runtime.** Railway is gone and
  nothing in the deployed site depends on Supabase.
- The **Spring Boot API** in `backend/` is kept, tested in CI and published as a
  container image, but it is not deployed. See [Optional: full stack](#optional-full-stack).

## One-time Vercel setup

Three Vercel projects (`frontend`, `personal-web-app`, `backend`) are connected to this
repository, and every push currently produces three failed deployments because none
of them builds from `frontend/`. To fix:

1. **Project `frontend` → Settings → Build and Deployment → Root Directory:** `frontend`.
2. **Project `frontend` → Settings → Environment Variables:**
   - remove `BACKEND_URL` and `NEXT_PUBLIC_API_URL` (they point at the dead Railway
     backend; while `BACKEND_URL` is set the pages try to fetch from it and render empty);
   - add the contact form variables below.
3. **Projects `personal-web-app` and `backend`:** disconnect from Git or delete — they
   have never had a working deployment.
4. Confirm which project owns the public domain (`frontend-liard-theta-28.vercel.app`)
   and keep it on `frontend`.

After that, every push to `main` deploys production and every PR gets a preview.
CI (`.github/workflows/ci.yml`) only verifies; it no longer deploys anything.

## Environment variables (Vercel)

| Variable | Required | Purpose |
|---|---|---|
| `MAIL_USER` | for contact form | SMTP username; also the sender and default recipient |
| `MAIL_PASS` | for contact form | SMTP password (for Gmail, an app password) |
| `MAIL_HOST` | no (default `smtp.gmail.com`) | SMTP host |
| `MAIL_PORT` | no (default `587`) | SMTP port; `465` switches to implicit TLS |
| `CONTACT_NOTIFY_TO` | no | Recipient, if different from `MAIL_USER` |
| `CONTACT_RATE_LIMIT_MAX` | no (default `3`) | Submissions allowed per address per window |
| `CONTACT_RATE_LIMIT_WINDOW` | no (default `3600`) | Window in seconds |
| `NEXT_PUBLIC_SITE_NAME` | no | Site title |
| `NEXT_PUBLIC_SITE_URL` | no | Canonical URL for metadata / Open Graph |
| `BACKEND_URL` | no — leave unset | Read content from an HTTP API instead of `src/content` |

Without `MAIL_USER` / `MAIL_PASS` the form answers `503` with a "channel offline"
message; the rest of the site is unaffected.

The rate limiter keeps its counters in memory per server instance, so on Vercel it
slows casual abuse rather than enforcing a hard cap.

## Local development

```bash
cd frontend
pnpm install
pnpm dev          # http://localhost:3000
pnpm test && pnpm lint && pnpm exec tsc --noEmit && pnpm build
```

No backend is needed. To try the contact form locally, put `MAIL_USER` / `MAIL_PASS`
in `frontend/.env.local`.

## Optional: full stack

The Spring Boot API still works as an alternative content source.

- **Local:** `docker compose up --build` starts Postgres, the API and the frontend,
  with the frontend reading from the API (`BACKEND_URL=http://backend:8080`).
- **Images:** `.github/workflows/docker-build.yml` publishes
  `ghcr.io/justcallmepratt/personal-web-app-backend` and `-frontend` on every push to
  `main`; `release.yml` does the same for `v*.*.*` tags.
- **Hosting it:** run the backend image on any container host with the variables in
  [`.env.example`](../.env.example) and a Postgres database, then set `BACKEND_URL`
  on the frontend. The frontend only needs `GET /api/profile`, `/api/projects`
  (`?featured=true`) and `/api/experience`.
- **Running the API outside Docker on an Apple Silicon Mac** needs an arm64 JDK 21.
  The Corretto 21 currently referenced by `backend/run-dev.sh` is an x86_64 build and
  fails with "Bad CPU type in executable".

`frontend/src/lib/api.ts` is the single place that decides where content comes from;
a future data store only has to be wired in there.

## Cleanup still to do by hand

These need account access and were left untouched:

- **GitHub secrets no longer used by any workflow:** `RAILWAY_DEPLOY_HOOK_URL`,
  `RAILWAY_TOKEN`, `RAILWAY_SERVICE_ID`, `VERCEL_TOKEN`, `VERCEL_ORG_ID`,
  `VERCEL_PROJECT_ID`, `BACKEND_URL`, `AMPLITUDE_API_KEY`.
- **GitHub variable** `NEXT_PUBLIC_API_URL` (points at Railway; unused).
- **Supabase project:** not used by the deployed site. Free projects pause after about
  a week without activity; pause or delete it deliberately, or keep it for the
  full-stack setup.
- **Dependabot PRs:** ten are open. The Spring Boot 4 and springdoc 3 bumps are major
  upgrades (the springdoc one fails the backend tests on Spring Boot 3.5).
