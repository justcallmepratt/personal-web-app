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
                       api.justcallmepratt.dev (Railway)
                       Spring Boot API (backend/) ──▶ Supabase Postgres
```

- **Micro-frontends on Vercel.** `web` is the public site and the default app. `admin`
  (login, inbox, job tracker) is planned as a second Next.js app routed under
  `/admin/*` with Vercel Microfrontends. See [Roadmap](#roadmap).
- **Services on Railway.** The Spring Boot API owns content, contact messages and
  admin auth, backed by Postgres.
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

## Vercel setup (one time)

Three Vercel projects (`frontend`, `personal-web-app`, `backend`) are connected to this
repository and every push produces three failed deployments, because none of them
builds from `frontend/`.

1. **Project `frontend`** (this is `web`; rename it if you like):
   - Settings → Build and Deployment → Root Directory: `frontend`.
   - Environment variables: remove `NEXT_PUBLIC_API_URL`; set `BACKEND_URL` to the
     Railway URL once the backend is up (remove it until then — it currently points at
     a dead host); keep `NEXT_PUBLIC_SITE_NAME`; set `NEXT_PUBLIC_SITE_URL` to
     `https://justcallmepratt.dev`.
   - Domains: add `justcallmepratt.dev` (already registered with Vercel, on Vercel DNS).
2. **Projects `personal-web-app` and `backend`:** delete, or disconnect from Git. They
   have never had a working deployment.

After that every push to `main` deploys production and every PR gets a preview.

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

1. **Live on the domain:** merge, apply the Vercel setup above.
2. **Backend on Railway:** apply the Railway setup above. Land the Spring Boot 4.1
   upgrade (PR #32) first so the redeploy starts from the current framework version.
3. **Monorepo:** move `frontend/` to `apps/web`, extract shared UI and API types into
   packages.
4. **`admin` micro-frontend:** new Next.js app for login, inbox and job tracker against
   the existing `/api/admin/*` endpoints; `microfrontends.json` in `web` routes
   `/admin/*` to it.

## Cleanup still to do by hand

- **GitHub secrets no longer used by any workflow:** `RAILWAY_DEPLOY_HOOK_URL`,
  `RAILWAY_SERVICE_ID`, `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`,
  `BACKEND_URL`, `AMPLITUDE_API_KEY`, and the old `RAILWAY_TOKEN` value.
- **GitHub variables:** `NEXT_PUBLIC_API_URL` (unused); update `NEXT_PUBLIC_SITE_URL`
  to the new domain.
- **Supabase:** nothing outstanding. Its security advisors reported no issues on
  2026-11-20; re-check them after any schema change.
- **Dependabot PRs:** triaged; see PR #32 for the Spring Boot 4.1 + springdoc 3.2 upgrade.
