# Deployment

How the site is built, deployed and configured, and what is still outstanding. State as of
2026-11-20. This replaces the earlier `REMAINING_WORK.md`, `DEPLOYMENT_OPTIONS.md` and
`docs/MIGRATION_TO_GITHUB_PAGES.md` (see git history).

## Where things stand

| Part | Where | State |
|---|---|---|
| Public site (`frontend/`) | Vercel project `frontend`, root directory `frontend`, <https://justcallmepratt.dev> (`www` redirects to it) | Live. Serves the real profile from `frontend/src/content/index.ts`. |
| API (`backend/`) | Railway project `kafka-demo`, service `personal-web-app-api` | Deployed and healthy at `https://personal-web-app-api-production.up.railway.app`. **Not used by the site yet.** Its public `GET /api/profile` and `/api/experience` currently return the old placeholder persona. |
| API custom domain `api.justcallmepratt.dev` | Railway + Vercel DNS | Not attached. |
| Kafka demo | Site page `/projects/kafka`, relaying to Railway service `kafka-demo-api` | Live. |
| `apps/kafka` (`/kafka`) | Vercel project `kafka` + microfrontends group | Built, but `https://justcallmepratt.dev/kafka` is a 404: the project and group are not visible in the team that owns `frontend`. |
| `apps/admin` (`/admin`) | Vercel project `admin` + microfrontends group | Not deployed. |
| Database | Supabase Postgres | Used by the API (session pooler) and by the Kafka demo (`kafka_demo` schema). |

```
                       justcallmepratt.dev (Vercel)
  browser ───────────▶ ┌──────────────────────────────────────────┐
                       │ frontend  (frontend/)   public pages      │
                       │ kafka     (apps/kafka)  /kafka    (planned)│
                       │ admin     (apps/admin)  /admin/*  (planned)│
                       └───────────────┬──────────────────────────┘
                                       │ server-side only
                                       ▼
        BACKEND_URL ─▶ Railway: personal-web-app-api ─▶ Supabase Postgres
        KAFKA_DEMO_URL ▶ Railway: kafka-demo-api ─▶ kafka broker + Supabase
```

- **The browser only talks to Vercel.** Pages fetch content from the API on the server;
  the contact form posts to the site's own `/api/contact`, which relays to the API. No CORS
  and no API URL in the client bundle.
- **The site survives a backend outage.** If `BACKEND_URL` is unset, or the API is
  unreachable, slow (5 s limit) or erroring, pages render from
  [`frontend/src/content/index.ts`](../frontend/src/content/index.ts). Today `BACKEND_URL`
  is set to an old dead address, so every build waits 5 s per page before falling back;
  see [Outstanding work](#outstanding-work).
- **Why the site is not pointed at the API yet:** the database rows and
  [`SeedRunner.java`](../backend/src/main/java/com/resume/SeedRunner.java) still hold the
  old placeholder persona, so switching `BACKEND_URL` now would replace the real content
  with placeholder content.

## Outstanding work

In this order. Items 1 and 2 must not be swapped.

1. **Put the real profile in the API.** Update the Supabase `profile`, `projects` and
   `experience` rows and `SeedRunner` to match `frontend/src/content/index.ts`.
   `SeedRunner` only fills empty tables, so the existing rows need an SQL update; change
   the seed too so a fresh database matches.
2. **Set `BACKEND_URL` on Vercel** (project `frontend`, Production and Preview) to the
   Railway address, replacing the dead value, and redeploy. Check the site still shows the
   real content.
3. **Attach `api.justcallmepratt.dev`:** add it as a custom domain on the Railway
   service, create the CNAME Railway shows in the Vercel DNS zone, then set `BACKEND_URL`
   to `https://api.justcallmepratt.dev` and `CORS_ORIGIN` on Railway to
   `https://justcallmepratt.dev`.
4. **Set `ADMIN_PASSWORD_HASH`** on the Railway service (bcrypt of the admin password).
   Until then admin sign-in answers 503.
5. **Turn on contact email** ([steps](#turn-on-contact-email)): `MAIL_USER`, `MAIL_PASS`
   and `NEXT_PUBLIC_CONTACT_EMAIL` on Vercel. Until then the form can only offer the
   `mailto:` link, if that variable is set.
6. **Create or locate the Vercel `kafka` and `admin` projects and the microfrontends
   group** ([steps](#microfrontends-kafka-and-admin)), add the `admin` route to
   `frontend/microfrontends.json`, then make `Admin — Node 22 / pnpm` (and optionally the
   Kafka job) a required check if wanted.
7. **Delete the two unused Vercel projects** `personal-web-app` and `backend` if they
   still exist (they never had a working deployment), then the GitHub environments they
   created (`… – backend`, `… – personal-web-app`).

Product work (analytics, ops hardening, market research, monorepo move) is in
[ROADMAP.md](ROADMAP.md).

## Vercel

Every push to `main` deploys production and every PR gets a preview; CI does not deploy.

- **Project `frontend`:** root directory `frontend`; `justcallmepratt.dev` attached,
  `www.justcallmepratt.dev` redirects to it (308). The original
  `frontend-liard-theta-28.vercel.app` address still works.
- **`NEXT_PUBLIC_SITE_URL`** is `https://justcallmepratt.dev` (canonical URLs, Open Graph,
  sitemap). `NEXT_PUBLIC_API_URL` is not read by any code; delete it if it is still there.
- **Settings worth turning on** (dashboard, not in the repo): skip builds when nothing
  under the project's root directory changed, and a spend limit under Billing → Spend
  Management.
- **Footprint:** at most three projects (`frontend`, `kafka`, `admin`), none for services.
  Pages are static and re-rendered at most hourly (`REVALIDATE_SECONDS` in
  `frontend/src/lib/api.ts`), so the API sees about one request per page per hour. The
  functions are `POST /api/contact` (25 s max; bodies over 16 KB rejected before reading;
  relay 4 s, MX lookup 2 s, SMTP 10 s) and the two Kafka relay routes.

### Environment variables for `frontend`

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | yes | Canonical URL for metadata and Open Graph. Read at build time. |
| `NEXT_PUBLIC_SITE_NAME` | no | Site title |
| `BACKEND_URL` | for live data | Base URL of the API. Server-only. See [Outstanding work](#outstanding-work). |
| `KAFKA_DEMO_URL`, `KAFKA_DEMO_TOKEN` | for the Kafka demo | Base URL of `kafka-demo-api`, and the secret matching its `DEMO_API_TOKEN` (sent as `X-Demo-Token`). Server-only; the URL is read at build and request time. |
| `MAIL_USER`, `MAIL_PASS` | for contact email | SMTP login for the direct path and the fallback. For Gmail, `MAIL_PASS` is an app password. Server-only. |
| `MAIL_HOST`, `MAIL_PORT` | no | Default `smtp.gmail.com` and 587 (465 uses TLS) |
| `CONTACT_NOTIFY_TO` | no | Recipient; defaults to `MAIL_USER` |
| `NEXT_PUBLIC_CONTACT_EMAIL` | recommended | Public address for the `mailto:` link in the form's error state and the "email me directly" line. Unset means no link. Read at build time. |
| `CONTACT_RATE_LIMIT_MAX`, `CONTACT_RATE_LIMIT_WINDOW` | no | Direct-SMTP path limit (default 3 per 3600 s, per instance, best effort) |
| `GITHUB_USERNAME`, `GITHUB_TOKEN` | no | The home page's GitHub activity section makes one request an hour (60/hour per IP unauthenticated). `GITHUB_USERNAME` overrides the default account (`DEFAULT_GITHUB_USERNAME` in `frontend/src/lib/github.ts`); a read-only token only raises the limit. |

Variable changes apply only to new deployments: redeploy after editing.

### Microfrontends: `kafka` and `admin`

`apps/kafka` and `apps/admin` are separate Next.js apps meant to be served on the main
domain through Vercel Microfrontends, with `frontend` as the default application. In the
repository:

- `frontend/next.config.ts` already wraps its config in `withMicrofrontends`, and
  `frontend/microfrontends.json` routes `/kafka` and `/kafka/:path*` to `kafka`. It has no
  `admin` entry yet. The keys under `applications` must be Vercel project names.
- Both apps build standalone when no group exists (the build logs "no microfrontends.json
  found; building as a standalone app"; that is expected).
- Both apps put every route under `src/app/kafka/` or `src/app/admin/` and set no
  `basePath`, which Vercel Microfrontends does not support. Neither has a `public/`
  directory: files there are not covered by the asset prefix.

To finish (by hand, in this order; re-check
<https://vercel.com/docs/microfrontends/quickstart> first in case it changed):

1. **Create or locate the projects.** New Vercel projects from this repository named
   `kafka` (root `apps/kafka`; variables `KAFKA_DEMO_URL`, `KAFKA_DEMO_TOKEN`, optional
   `NEXT_PUBLIC_SITE_NAME`) and `admin` (root `apps/admin`; variable `BACKEND_URL`), both
   for Production and Preview. If they already exist in another team or account, find
   them first; they must be in the team that owns `frontend`. Check
   `https://<project>.vercel.app/kafka` and `/admin/login` load. Do not attach domains.
2. **Create the group** (Team Settings → Microfrontends → Create Group) with `frontend`
   as the default application, and add both projects.
3. **Add the `admin` route** to `frontend/microfrontends.json` and deploy `frontend`:

   ```json
   "admin": { "routing": [{ "paths": ["/admin/:path*"] }] }
   ```

4. **Redeploy `kafka` and `admin`** once the group is live, so their assets get their own
   prefix (`/vc-ap-…`) and cannot collide with the public site's `/_next/` files.
5. **Check** `https://justcallmepratt.dev/kafka` sends a record, `/admin/login` signs in
   (needs the API and `ADMIN_PASSWORD_HASH`), and the public pages are unchanged.
6. **Cut over the Kafka demo, in a separate change to `frontend`:** replace
   `src/app/projects/kafka` with a redirect to `/kafka`, point the projects page link at
   it, delete `src/app/api/kafka`, `KafkaDemo.tsx`, `lib/kafka.ts` and their tests, and
   remove `KAFKA_DEMO_URL` and `KAFKA_DEMO_TOKEN` from the `frontend` project. Until then
   the copy in `frontend` is the live one and a demo change must be made there.

Notes: Hobby and Pro include two microfrontends projects; a third costs extra (on Pro,
routing is $2 per million routed requests). Moving between the public site and an app is
a full page load. **Rollback:** remove the app's entry from `microfrontends.json` and
redeploy `frontend`; if step 6 shipped, revert it too.

## Railway: the API

Service `personal-web-app-api` in the Railway project `kafka-demo` (the same project that
holds the Kafka demo services), created from this GitHub repository with root directory
`backend`. Railway rebuilds on every push to `main`; no CI job or deploy hook is involved.

- **Build and health check** come from [`backend/railway.toml`](../backend/railway.toml):
  Dockerfile build (Maven, then Amazon Corretto 21), health check `/actuator/health`
  (60 s), restart on failure up to 3 times. It answers 200 at
  `https://personal-web-app-api-production.up.railway.app/actuator/health`.
- **Database:** the existing Supabase project, through the **session pooler** (port 5432),
  not the direct `db.<ref>.supabase.co` host, which is IPv6-only on the free plan. The
  schema from [`supabase/init.sql`](../supabase/init.sql) is already applied.
- **The database variables are references** to the same variables on the Railway service
  `kafka-demo-api`, not copies. Changing or removing them there changes this service
  too.
- **Variables set** (as reported by the owner on 2026-11-20): `SPRING_DATASOURCE_URL`,
  `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD` (references) and
  `JWT_SECRET`. I could not read the Railway dashboard, so whether
  `SPRING_PROFILES_ACTIVE=docker`, `DB_POOL_SIZE` and `CORS_ORIGIN` are set is not
  confirmed; the service is healthy, so the profile and datasource are right.
- **Variables not set:** `ADMIN_PASSWORD_HASH` (admin sign-in answers 503) and
  `MAIL_USER`, `MAIL_PASS` (and `MAIL_HOST`, `MAIL_PORT`, `CONTACT_NOTIFY_TO`; contact
  mail is saved to the database but no notification is sent).

| Variable | Value |
|---|---|
| `SPRING_PROFILES_ACTIVE` | `docker` |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://<pooler-host>:5432/postgres?sslmode=require` |
| `SPRING_DATASOURCE_USERNAME` | pooler username, `postgres.<project-ref>` |
| `SPRING_DATASOURCE_PASSWORD` | the Supabase database password |
| `DB_POOL_SIZE` | `5` (the pooler caps connections on the free plan) |
| `JWT_SECRET` | `openssl rand -base64 32` |
| `ADMIN_PASSWORD_HASH` | bcrypt hash of the admin password |
| `MAIL_USER`, `MAIL_PASS` (and `MAIL_HOST`, `MAIL_PORT`) | SMTP credentials for notifications |
| `CORS_ORIGIN` | `https://justcallmepratt.dev` (only matters for browser calls; the site calls the API server-side) |

On the `docker` profile `SeedRunner` fills **empty** tables with the placeholder persona;
the Supabase tables are already populated, so it does nothing. Free Supabase projects
pause after about a week without database activity; hourly page re-renders keep it
active once the site uses the API. The Railway token is only needed for CLI or API
automation; never commit it (`gh secret set RAILWAY_TOKEN` if a workflow ever needs it).

## Contact delivery

`POST /api/contact` on the site tries these in order:

1. **Relay** to the API when `BACKEND_URL` is set. A definite answer (2xx, or a 4xx such
   as validation or rate limit) is returned to the visitor as is.
2. **Direct SMTP** (`nodemailer`, `MAIL_*`) when there is no `BACKEND_URL`, or the relay
   failed: unreachable, no answer within 4 s, a 5xx, or a non-JSON reply. The site then
   applies its own rate limit and email-domain checks and logs a warning.
3. **Undeliverable** when neither path can deliver (503 with no mail configured, 502 if
   SMTP rejects or hangs). The error state then shows a `mailto:` link, and the contact
   page always shows "Or email me directly", when `NEXT_PUBLIC_CONTACT_EMAIL` is set. No
   address is hard-coded in the repository.

Each outcome writes one JSON line to the function logs (Vercel → project → Logs, filter
`"event":"contact"`): `relayed`, `sent-smtp`, `fell-back`, `undeliverable`. Lines carry
status codes, reasons and a masked sender; never the message, subject, name or a full
address.

### Turn on contact email

In Vercel → `frontend` → Settings → Environment Variables, Production (and Preview if
previews should send):

1. `MAIL_USER`: the sending mailbox. `MAIL_PASS`: for Gmail, an **app password** (Google
   Account → Security → 2-Step Verification → App passwords), never the account password.
2. Optional `CONTACT_NOTIFY_TO` if messages should go somewhere other than `MAIL_USER`;
   `MAIL_HOST` and `MAIL_PORT` only for a provider other than Gmail.
3. `NEXT_PUBLIC_CONTACT_EMAIL`: the public address for the direct-email link.
4. Redeploy, then send a test message from <https://justcallmepratt.dev/contact> with an
   address that is not yours and confirm it arrives (check spam once). If the form shows
   an error, read the `"event":"contact"` log lines. Real delivery has not been tested.

When the API is in use, also set `MAIL_*` on the Railway service if it should email
notifications; the Vercel variables can stay as the fallback.

## Admin app

`apps/admin`: sign-in and the contact-message inbox under `/admin/*`. **Not deployed**,
and only ever run against a local stand-in for the API.

- **Routes:** `/admin` (inbox), `/admin/login`, and handlers under `/admin/api/*`.
- **The browser only talks to this app.** The handlers call the API server-side with
  `BACKEND_URL` (required; without it every page reports no API is configured). The API's
  JWT is kept in an `httpOnly`, `secure`, `sameSite=strict` cookie scoped to `/admin`; it
  expires with the token (24 h, `jwt.expiry-ms` in the backend).
- Every API call has an 8 s timeout; the login handler refuses bodies over 4 KB; nothing
  is cached.

| Situation | Behaviour |
|---|---|
| `BACKEND_URL` not set | Login and inbox say no API is configured (503) |
| API unreachable / slower than 8 s / not the expected JSON | "could not be reached" (502) / "took too long" (504) / "response this app could not read" (502); the session is kept, **Refresh** retries |
| Wrong username or password | "Invalid credentials" (401) |
| `ADMIN_PASSWORD_HASH` not set on the API | "Admin sign-in is not configured on the API" (503) |
| Token expired or rejected (401/403) | Cookie cleared, back to login with "Your session has expired" |
| Message deleted before it is toggled (404) | Removed from the list |
| Oversized or malformed login request, request from another origin | Rejected by `admin` (413 / 400 / 403) without calling the API |

## Kafka live demo

The demo produces and consumes real records through the Spring Boot service in
[Kafka-Producer-Consumer-Demo](https://github.com/justcallmepratt/Kafka-Producer-Consumer-Demo).
It runs from the main site at `/projects/kafka`; `POST /api/kafka/produce` and
`GET /api/kafka/messages` relay to that service's endpoints of the same name.
`apps/kafka` is a copy of the page meant to replace it (see
[Microfrontends](#microfrontends-kafka-and-admin)); until then `/projects/kafka` is the
live one.

- **Where it runs.** Railway project `kafka-demo`: service `kafka-demo-api` (that repo's
  Dockerfile) and a single-node `kafka` broker on the private network. Consumed records
  are stored in this site's Supabase project, `kafka_demo` schema, which the Supabase API
  does not expose. Setup is in that repo's README ("Deploying to Railway").
- **Variables.** On Vercel, `KAFKA_DEMO_URL` and `KAFKA_DEMO_TOKEN`; the page is static,
  so the offline notice only goes away on a new build. `KAFKA_DEMO_TOKEN` must equal the
  service's `DEMO_API_TOKEN`; if they drift apart, sends and reads fail with 502.
- **Visitors only see their own records.** The relay prefixes each Kafka key with a random
  per-tab session id and filters reads by it. The service returns its latest 100 records
  overall, so on a busy day older records can drop out of view.
- **Function use:** nothing on page view, one call per send, then at most 8 reads
  (about 10 s) while waiting for the consumer; limits are 20 sends and 120 reads a minute
  per address (per instance, best effort).

## Edge cases and what happens

| Situation | Behaviour |
|---|---|
| API down, erroring, slower than 5 s, or returning bad JSON | Pages render from `src/content`; a warning is logged; the next hourly re-render tries again |
| GitHub unreachable, slow (5 s), rate limited, 404, 5xx, bad JSON or no public repos | The GitHub activity section shrinks to a link to the profile; build and page still succeed |
| API down, or relay slower than 4 s / 5xx / non-JSON, when the form is submitted | Falls back to SMTP if `MAIL_USER` / `MAIL_PASS` are set (warning logged); otherwise 503 and the `mailto:` link |
| API answers 4xx (validation, 429) | Passed to the visitor; no fallback |
| SMTP rejects (bad app password, etc.) or takes over 10 s | 502, logged as `undeliverable`; the form offers the `mailto:` link |
| `NEXT_PUBLIC_CONTACT_EMAIL` unset or malformed | No `mailto:` link or "email me directly" line |
| Invalid or oversized contact payload | Rejected by the site (400 / 413) without calling the API |
| `BACKEND_URL` not set | Fully static site; contact handled over SMTP, or 503 if not configured |
| `KAFKA_DEMO_URL` not set | `/projects/kafka` shows "broker offline" and a disabled form |
| Kafka service down, cold or slower than 10 s | The send or read returns 502; the page says the service is not responding |
| Record produced but never consumed | The page polls 8 times, then stops and offers Refresh |

## GitHub setup

- **Branch protection on `main`:** the CI jobs `Backend — Java 21 / Maven`,
  `Frontend — Node 22 / pnpm` and `Admin — Node 22 / pnpm` must pass before merging.
  `Kafka — Node 22 / pnpm` also runs on every PR but is not required. No review is
  required and admins can bypass.
- **Dependabot** (`.github/dependabot.yml`): weekly. npm apps (`frontend`, `apps/admin`,
  `apps/kafka`) get one grouped PR for all minor and patch bumps; majors arrive one per
  dependency. Maven groups Spring Boot and jjwt; GitHub Actions are grouped.
  `dependabot-auto-merge.yml` approves patch and minor bumps and merges them once the
  required checks pass; major bumps get a comment and the `major-update` label. Alerts and
  security updates are on.
- **Actions variables:** `NEXT_PUBLIC_SITE_NAME`, `NEXT_PUBLIC_SITE_URL` (used by CI and
  image builds). **No Actions secrets**; no workflow needs one.
- **Images:** `docker-build.yml` (every push to `main`) and `release.yml` (`v*.*.*` tags)
  publish to GHCR, for hosting somewhere other than Railway.
- **Environments:** the `… – backend` and `… – personal-web-app` environments were created
  by the two unused Vercel projects; delete them after the projects ([item 7](#outstanding-work)).
- **Supabase:** its security advisors reported no issues on 2026-11-20; re-check after any
  schema change.

## Local development

```bash
cd frontend
pnpm install
pnpm dev          # http://localhost:3000, content from src/content
pnpm test && pnpm lint && pnpm exec tsc --noEmit && pnpm build
```

`apps/admin` (`BACKEND_URL=http://localhost:8080 pnpm dev`, port 3001, `/admin`) and
`apps/kafka` (`KAFKA_DEMO_URL=http://localhost:<port> pnpm dev`, port 3002, `/kafka`) use
the same commands. Full stack: `docker compose up --build` (Postgres + API + frontend
reading from the API). Running the API outside Docker on an Apple Silicon Mac needs an
arm64 JDK 21; the Corretto 21 in `backend/run-dev.sh` is x86_64 and fails with "Bad CPU
type in executable".
