# Deployment

How the site is built, deployed and configured, and what is still outstanding. State as of
2026-11-20. This replaces the earlier `REMAINING_WORK.md`, `DEPLOYMENT_OPTIONS.md` and
`docs/MIGRATION_TO_GITHUB_PAGES.md` (see git history).

## Where things stand

| Part | Where | State |
|---|---|---|
| Public site (`frontend/`) | Vercel project `frontend`, root directory `frontend`, <https://justcallmepratt.dev> (`www` redirects to it) | Live. Profile, projects and experience come from the API (database); certifications and "In the works" come from `frontend/src/content/index.ts`, which is also the fallback. |
| API (`backend/`) | Railway project `kafka-demo`, service `personal-web-app-api` | Deployed and healthy at `https://personal-web-app-api-production.up.railway.app`. **Used by the production site** (`BACKEND_URL`); previews have no `BACKEND_URL` and use the repo content. |
| API custom domain `api.justcallmepratt.dev` | Railway + Vercel DNS | Not attached. |
| Kafka demo | Site page `/projects/kafka`, relaying to Railway service `kafka-demo-api` | Live. This is the demo's only home; `/kafka` and everything under it redirect here (308, from `frontend`). |
| `apps/kafka` | Nothing | Built and tested in CI, **not deployed**. Checked on 2026-11-21: the team that owns `frontend` has no `kafka` project and `frontend` is in no microfrontends group. Optional; see [the checklist](#if-you-want-the-separate-kafka-project-later). |
| `apps/admin` (`/admin`) | Vercel project `admin` + microfrontends group | Not deployed. |
| Database | Supabase Postgres | Used by the API (session pooler) and by the Kafka demo (`kafka_demo` schema). |

```
                       justcallmepratt.dev (Vercel)
  browser ───────────▶ ┌──────────────────────────────────────────┐
                       │ frontend  (frontend/)   public pages      │
                       │   /kafka/* redirects to /projects/kafka   │
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
- **Content lives in two places.** The Supabase rows (the owner's real profile, four
  projects, three roles) are what production shows.
  [`frontend/src/content/index.ts`](../frontend/src/content/index.ts) is the fallback and
  must be kept in step with them; certifications and the "In the works" list exist only
  there (the API has no endpoint for them).
- **The site survives a backend outage.** If the API is unreachable, slow (5 s limit) or
  erroring, pages render from `content/index.ts` and a warning is logged. Without
  `BACKEND_URL` (previews, local) the site runs entirely from that file.
- **`SeedRunner` is stale.** [`SeedRunner.java`](../backend/src/main/java/com/resume/SeedRunner.java)
  still seeds the old placeholder persona into *empty* tables (dev and docker profiles).
  The database was loaded with the real content separately, so production is unaffected,
  but a fresh database would get placeholder content.

## Outstanding work

1. **Attach `api.justcallmepratt.dev`:** add it as a custom domain on the Railway
   service, create the CNAME Railway shows in the Vercel DNS zone, then change
   `BACKEND_URL` on Vercel to `https://api.justcallmepratt.dev` and redeploy. Set
   `CORS_ORIGIN` on Railway to `https://justcallmepratt.dev`.
2. **Set `ADMIN_PASSWORD_HASH`** on the Railway service (bcrypt of the admin password),
   but only after a rate limiter is in front of admin login (first item of
   [Security follow-ups](ROADMAP.md#security-follow-ups)). Until then admin sign-in answers
   503 "Admin not configured", by design.
3. **Turn on contact email.** The contact form now relays to the API, which stores each
   message but sends no email until `MAIL_USER` and `MAIL_PASS` are set on the Railway
   service. Also set the Vercel variables ([steps](#turn-on-contact-email)) for the SMTP
   fallback and the `mailto:` link.
4. **Create the Vercel `admin` project and the microfrontends group**
   ([steps](#microfrontends-kafka-and-admin)) and add the `admin` route to
   `frontend/microfrontends.json`. Nothing is needed for the Kafka demo: `/kafka`
   redirects to `/projects/kafka`. A separate `kafka` project is optional and likely a
   paid extra ([checklist](#if-you-want-the-separate-kafka-project-later)).
5. **Delete the two unused Vercel projects** `personal-web-app` and `backend` if they
   still exist (they never had a working deployment), then the GitHub environments they
   created (`… – backend`, `… – personal-web-app`).
6. **Security follow-ups** (API surface, CSP, code-scanning alerts, rate limits) are
   listed in [ROADMAP.md](ROADMAP.md#security-follow-ups).
7. **Content fixes (not docs):** make `SeedRunner` seed the real profile, and correct the
   project description in `frontend/src/content/index.ts` (line 58) that still says the
   API is "built and tested in CI but not deployed yet".

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
- **Footprint:** two projects (`frontend`, and `admin` once created), none for services.
  A third, `kafka`, is optional and not planned.
  Pages are static and re-rendered at most hourly (`REVALIDATE_SECONDS` in
  `frontend/src/lib/api.ts`), so the API sees about one request per page per hour. The
  functions are `POST /api/contact` (25 s max; bodies over 16 KB rejected before reading;
  relay 4 s, MX lookup 2 s, SMTP 10 s) and the two Kafka relay routes.

### Environment variables for `frontend`

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | yes | Canonical URL for metadata and Open Graph. Read at build time. |
| `NEXT_PUBLIC_SITE_NAME` | no | Site title |
| `BACKEND_URL` | for live data | Base URL of the API. Server-only. Production only: set to the Railway address; previews do not have it. |
| `KAFKA_DEMO_URL`, `KAFKA_DEMO_TOKEN` | for the Kafka demo | Base URL of `kafka-demo-api`, and the secret matching its `DEMO_API_TOKEN` (sent as `X-Demo-Token`). Server-only; the URL is read at build and request time. |
| `MAIL_USER`, `MAIL_PASS` | for contact email | SMTP login for the direct path and the fallback. For Gmail, `MAIL_PASS` is an app password. Server-only. |
| `MAIL_HOST`, `MAIL_PORT` | no | Default `smtp.gmail.com` and 587 (465 uses TLS) |
| `CONTACT_NOTIFY_TO` | no | Recipient; defaults to `MAIL_USER` |
| `NEXT_PUBLIC_CONTACT_EMAIL` | recommended | Public address for the `mailto:` link in the form's error state and the "email me directly" line. Unset means no link. Read at build time. |
| `CONTACT_RATE_LIMIT_MAX`, `CONTACT_RATE_LIMIT_WINDOW` | no | Direct-SMTP path limit (default 3 per 3600 s, per instance, best effort) |
| `GITHUB_USERNAME`, `GITHUB_TOKEN` | no | The home page's GitHub activity section makes one request an hour (60/hour per IP unauthenticated). `GITHUB_USERNAME` overrides the default account (`DEFAULT_GITHUB_USERNAME` in `frontend/src/lib/github.ts`); a read-only token only raises the limit. |

Variable changes apply only to new deployments: redeploy after editing.

### Microfrontends: `kafka` and `admin`

`apps/kafka` and `apps/admin` are separate Next.js apps built to be served on the main
domain through Vercel Microfrontends, with `frontend` as the default application. Only
`admin` is planned; `kafka` is optional (see the end of this section). State on
2026-11-21: neither project exists in the team that owns `frontend`, and `frontend` is in
no microfrontends group. In the repository:

- `frontend/next.config.ts` wraps its config in `withMicrofrontends`, and
  `frontend/microfrontends.json` lists only `frontend`, so every path is served by the
  public site. The keys under `applications` must be Vercel project names; an entry for a
  project that does not exist routes nowhere, so add one only after its project is in the
  group.
- `/kafka`, `/kafka/` and `/kafka/<anything>` are redirected by `frontend` to
  `/projects/kafka` (308; `frontend/src/lib/redirects.ts`, tested in
  `src/test/lib/redirects.test.ts`). The two addresses the micro-frontend would have
  served, `/kafka/api/produce` and `/kafka/api/messages`, redirect to the live relay
  routes `/api/kafka/produce` and `/api/kafka/messages`, method and query string kept.
- Both apps build standalone when no group exists (the build logs "no microfrontends.json
  found; building as a standalone app"; that is expected).
- Both apps put every route under `src/app/kafka/` or `src/app/admin/` and set no
  `basePath`, which Vercel Microfrontends does not support. Neither has a `public/`
  directory: files there are not covered by the asset prefix.

To deploy `admin` (by hand, in this order; re-check
<https://vercel.com/docs/microfrontends/quickstart> first in case it changed):

1. **Create the project.** A new Vercel project from this repository named `admin` (root
   `apps/admin`; variable `BACKEND_URL`), for Production and Preview, **in the team that
   owns `frontend`** (`prathamsachan-8729's projects`). A project in another team or a
   personal account cannot join the group. Check `https://<project>.vercel.app/admin/login`
   loads. Do not attach domains.
2. **Create the group** (Team Settings → Microfrontends → Create Group) with `frontend`
   as the default application, and add `admin`.
3. **Add the `admin` route** to `frontend/microfrontends.json` and deploy `frontend`:

   ```json
   "admin": { "routing": [{ "paths": ["/admin/:path*"] }] }
   ```

4. **Redeploy `admin`** once the group is live, so its assets get their own prefix
   (`/vc-ap-…`) and cannot collide with the public site's `/_next/` files.
5. **Check** `/admin/login` signs in (needs the API and `ADMIN_PASSWORD_HASH`) and the
   public pages are unchanged.

Notes: moving between the public site and an app is a full page load. **Rollback:**
remove the app's entry from `microfrontends.json` and redeploy `frontend`.

#### If you want the separate `kafka` project later

Not needed: the demo works from `frontend` at `/projects/kafka`. **Cost:** Hobby and Pro
include two microfrontends projects (`frontend` and `admin`); `kafka` would be the third,
which is a paid extra (on Pro, routing is also $2 per million routed requests). Confirm
the current price in the Vercel dashboard before starting. Then, in this order:

1. Create a Vercel project from this repository **in the same team as `frontend`**,
   named exactly `kafka`, root directory `apps/kafka`.
2. Set `KAFKA_DEMO_URL` and `KAFKA_DEMO_TOKEN` on it (Production and Preview), with the
   same values as on `frontend`. Check `https://<project>.vercel.app/kafka` sends a
   record. Do not attach domains.
3. Add `kafka` to the microfrontends group that has `frontend` as its default application
   (create the group if `admin` has not been done yet).
4. In `frontend`: restore the routing entry in `microfrontends.json`,

   ```json
   "kafka": { "routing": [{ "paths": ["/kafka", "/kafka/:path*"] }] }
   ```

   remove `kafkaRedirects` from `src/lib/redirects.ts` and update
   `src/test/lib/redirects.test.ts`, then deploy `frontend`.
5. Redeploy `kafka` so its assets get their own prefix.
6. Check `https://justcallmepratt.dev/kafka` sends a record.

Two cautions. The `/kafka` redirect is permanent (308), and browsers remember those:
someone who visited `/kafka` before the switch may keep landing on `/projects/kafka`
until their cache clears. So keep `/projects/kafka` working after the switch and **never
redirect `/projects/kafka` to `/kafka`** (a cached browser would loop). And once both
copies are live there are two demos to maintain; until one is deleted, a demo change
must be made in both `frontend` and `apps/kafka`.

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
- **`ADMIN_USERNAME`** is set to `psachan` on the service (the code default is `admin`).
- **Variables not set:** `ADMIN_PASSWORD_HASH` (admin sign-in answers 503 "Admin not configured" until a rate limiter is in place; see [Security follow-ups](ROADMAP.md#security-follow-ups)) and
  `MAIL_USER`, `MAIL_PASS` (and `MAIL_HOST`, `MAIL_PORT`, `CONTACT_NOTIFY_TO`; contact
  contact messages are stored in the database but no notification email is sent).

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

On the `docker` profile `SeedRunner` fills **empty** tables with the old placeholder
persona; the Supabase tables hold the real content, so it does nothing there. Free Supabase projects
pause after about a week without database activity; hourly page re-renders keep it
active once the site uses the API. The Railway token is only needed for CLI or API
automation; never commit it (`gh secret set RAILWAY_TOKEN` if a workflow ever needs it).

## Contact delivery

`POST /api/contact` on the site tries these in order:

1. **Relay** to the API when `BACKEND_URL` is set (production). The API stores the message;
   it emails a notification only if mail variables are set on the Railway service. A definite answer (2xx, or a 4xx such
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

Also set `MAIL_*` on the Railway service so the API emails notifications for relayed
messages; the Vercel variables then serve as the fallback.

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
`/projects/kafka` is the demo's only address: `/kafka` and everything under it redirect
there. `apps/kafka` is an undeployed copy of the page, kept in case it is ever served as
its own micro-frontend (see
[the checklist](#if-you-want-the-separate-kafka-project-later)); a demo change is made in
`frontend`.

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
