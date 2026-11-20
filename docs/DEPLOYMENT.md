# Deployment

How the site is built, deployed and configured. This replaces the earlier
`REMAINING_WORK.md`, `DEPLOYMENT_OPTIONS.md` and `docs/MIGRATION_TO_GITHUB_PAGES.md`
(see git history for those).

## Architecture

```
                       justcallmepratt.dev (Vercel)
  browser ───────────▶ ┌──────────────────────────────────────────┐
                       │ web   (frontend/)  public pages, static   │
                       │ admin (planned)    /admin/* micro-frontend│
                       └───────────────┬──────────────────────────┘
                                       │ server-side only (BACKEND_URL)
                                       ▼
                       api.justcallmepratt.dev (Railway)  — not live yet
                       Spring Boot API (backend/) ──▶ Supabase Postgres
```

- **Micro-frontends on Vercel.** `web` is the public site and the default app. `admin`
  (login, inbox, job tracker) is planned as a second Next.js app routed under
  `/admin/*` with Vercel Microfrontends. See [Roadmap](#roadmap).
- **Services on Railway (not live yet).** The Spring Boot API owns content, contact messages and
  admin auth, backed by Postgres. Until it is deployed, the live site serves the repo content.
- **The browser only talks to Vercel.** Pages fetch content from the API on the server;
  the contact form posts to `web`'s own `/api/contact`, which relays to the API. No CORS
  and no API URL in the client bundle.
- **The site survives a backend outage.** If the API is unreachable, slow (5 s limit)
  or erroring, pages render from the snapshot in
  [`frontend/src/content/index.ts`](../frontend/src/content/index.ts). Keep that file
  roughly in step with the real content. Without `BACKEND_URL` the site runs entirely
  from that file and emails contact messages itself over SMTP.

## Keeping the Vercel footprint small

- **Two projects at most:** `web` now, `admin` later. No Vercel projects for services.
- **Pages are static** and re-rendered at most once an hour (`REVALIDATE_SECONDS` in
  `frontend/src/lib/api.ts`), so visitors are served from the CDN and the API sees
  about one request per page per hour, not one per visit.
- **One function:** `POST /api/contact`. It rejects bodies over 16 KB before reading
  them, validates before doing any network call, and stops waiting for the backend
  after 10 s.
- **CI does not deploy.** Vercel's Git integration builds once per push.
- **Settings worth turning on** (dashboard, not in the repo): skip builds when nothing
  under the project's root directory changed, so backend-only and Dependabot Maven
  pushes cost no build; and a spend limit under Billing → Spend Management.

## Vercel setup

State as of 2026-11-20. Every push to `main` deploys production and every PR gets a
preview.

- **Project `frontend`** is `web`. Root directory is `frontend`; `justcallmepratt.dev`
  is attached and `www.justcallmepratt.dev` redirects to it. The original
  `frontend-liard-theta-28.vercel.app` address still works.
- **Still to do on `frontend` → Environment Variables:** remove `NEXT_PUBLIC_API_URL`;
  set `NEXT_PUBLIC_SITE_URL` to `https://justcallmepratt.dev`; set `BACKEND_URL` to the
  Railway URL once the backend is up. Until then it points at a dead host, so every
  build waits 5 s per page before falling back to the repo content.
- **Projects `personal-web-app` and `backend`** have never had a working deployment
  and should be deleted (Project → Settings → General → Delete Project).

## Railway setup (one time)

1. **New service from the GitHub repo**, root directory `backend`. The build and health
   check come from [`backend/railway.toml`](../backend/railway.toml) (Dockerfile build,
   `/actuator/health`). Railway redeploys on every push to `main`; no CI job or deploy
   hook is involved.
2. **Database: the existing Supabase project** (`nxqiuqlwyjimioosaiio`). It already
   has the schema from [`supabase/init.sql`](../supabase/init.sql) and the seed rows,
   so there is nothing to create or migrate. Get the connection details from the
   Supabase dashboard → Connect → **Session pooler**. Use the pooler, not the direct
   `db.<ref>.supabase.co` host: the direct host is IPv6-only on the free plan, and
   session mode (port 5432) is the one that works with Hibernate's connection pool.
3. **Service variables:**

   | Variable | Value |
   |---|---|
   | `SPRING_PROFILES_ACTIVE` | `docker` |
   | `SPRING_DATASOURCE_URL` | `jdbc:postgresql://<pooler-host>:5432/postgres?sslmode=require` |
   | `SPRING_DATASOURCE_USERNAME` | the pooler username, `postgres.nxqiuqlwyjimioosaiio` |
   | `SPRING_DATASOURCE_PASSWORD` | the Supabase database password |
   | `DB_POOL_SIZE` | `5` (the pooler caps connections on the free plan) |
   | `JWT_SECRET` | `openssl rand -base64 32` |
   | `ADMIN_PASSWORD_HASH` | bcrypt hash of the admin password |
   | `MAIL_USER`, `MAIL_PASS` (and `MAIL_HOST`, `MAIL_PORT` if not Gmail) | SMTP credentials for contact notifications |
   | `CORS_ORIGIN` | `https://justcallmepratt.dev` |

   On the `docker` profile `SeedRunner` fills empty tables with placeholder content;
   the Supabase tables are already populated, so it does nothing.

   Free Supabase projects pause after about a week with no database activity. The
   hourly page re-renders query the API, which keeps it active while the site has any
   traffic. If it does pause, the site keeps rendering from `src/content` and the
   contact form reports "channel offline" until the project is restored.
4. **Domain:** add `api.justcallmepratt.dev` as a custom domain on the service, then
   create the CNAME record Railway shows in the Vercel DNS zone for
   `justcallmepratt.dev`.
5. **Tell `web` about it:** set `BACKEND_URL=https://api.justcallmepratt.dev` on the
   Vercel project and redeploy.

The Railway token is only needed for CLI or API automation. Do not commit it; if a
workflow ever needs it, store it with `gh secret set RAILWAY_TOKEN`.

## Environment variables for `web`

| Variable | Required | Purpose |
|---|---|---|
| `BACKEND_URL` | for live data | Base URL of the API. Server-only. |
| `NEXT_PUBLIC_SITE_NAME` | no | Site title |
| `NEXT_PUBLIC_SITE_URL` | no | Canonical URL for metadata / Open Graph |
| `MAIL_USER`, `MAIL_PASS`, `MAIL_HOST`, `MAIL_PORT`, `CONTACT_NOTIFY_TO` | only without `BACKEND_URL` | SMTP settings for the standalone contact handler |
| `CONTACT_RATE_LIMIT_MAX`, `CONTACT_RATE_LIMIT_WINDOW` | no | Standalone handler limits (default 3 per 3600 s, per instance, best effort) |

## Edge cases and what happens

| Situation | Behaviour |
|---|---|
| API down, erroring, or returning bad JSON | Pages render from `src/content`; a warning is logged |
| API slower than 5 s (cold start) | Same fallback; the next hourly re-render tries again |
| API down when the contact form is submitted | Form shows "channel offline" (HTTP 502); nothing is lost silently |
| Contact relay slower than 10 s | Treated as down (502) |
| Invalid or oversized contact payload | Rejected by `web` (400 / 413) without calling the API |
| Too many submissions | The API's per-address limit applies (429); `web` forwards the visitor's address |
| `BACKEND_URL` not set | Fully static site; contact handled by `web` over SMTP, or 503 if SMTP is not configured |

## Local development

```bash
cd frontend
pnpm install
pnpm dev          # http://localhost:3000, content from src/content
pnpm test && pnpm lint && pnpm exec tsc --noEmit && pnpm build
```

Full stack locally: `docker compose up --build` (Postgres + API + frontend reading from
the API). Running the API outside Docker on an Apple Silicon Mac needs an arm64 JDK 21;
the Corretto 21 referenced by `backend/run-dev.sh` is an x86_64 build and fails with
"Bad CPU type in executable".

Container images are also published to GHCR by `docker-build.yml` (every push to
`main`) and `release.yml` (`v*.*.*` tags), for hosting somewhere other than Railway.

## Roadmap

1. **Live on the domain:** done.
2. **Backend on Railway:** apply the Railway setup above.
3. **Monorepo:** move `frontend/` to `apps/web`, extract shared UI and API types into
   packages.
4. **`admin` micro-frontend:** new Next.js app for login, inbox and job tracker against
   the existing `/api/admin/*` endpoints; `microfrontends.json` in `web` routes
   `/admin/*` to it.

## GitHub setup

- **Branch protection on `main`:** the CI jobs `Backend — Java 21 / Maven` and
  `Frontend — Node 22 / pnpm` must pass before merging. No review is required and
  admins can bypass.
- **Dependabot:** version updates (`.github/dependabot.yml`), alerts and security
  updates are on. `dependabot-auto-merge.yml` approves patch and minor bumps and merges
  them once the required checks pass; major bumps get a comment and the `major-update`
  label instead.
- **Variables:** `NEXT_PUBLIC_SITE_NAME`, `NEXT_PUBLIC_SITE_URL` (used by the CI and
  image builds). No workflow needs a secret.

## Cleanup still to do by hand

- **GitHub environments:** the `… – backend` and `… – personal-web-app` environments
  were created by the two unused Vercel projects and can be deleted once those are gone.
- **Supabase:** nothing outstanding. Its security advisors reported no issues on
  2026-11-20; re-check them after any schema change.
- **Dependabot PRs:** triaged; the Spring Boot 4.1 + springdoc 3.2 upgrade is merged.
