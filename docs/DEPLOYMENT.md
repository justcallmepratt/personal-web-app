# Deployment

How the site is built, deployed and configured. This replaces the earlier
`REMAINING_WORK.md`, `DEPLOYMENT_OPTIONS.md` and `docs/MIGRATION_TO_GITHUB_PAGES.md`
(see git history for those).

## Architecture

```
                       justcallmepratt.dev (Vercel)
  browser ───────────▶ ┌──────────────────────────────────────────┐
                       │ web   (frontend/)  public pages, static   │
                       │ admin (apps/admin) /admin/* micro-frontend│
                       └───────────────┬──────────────────────────┘
                                       │ server-side only (BACKEND_URL)
                                       ▼
                       api.justcallmepratt.dev (Railway)  — not live yet
                       Spring Boot API (backend/) ──▶ Supabase Postgres
```

- **Micro-frontends on Vercel.** `web` is the public site and the default app. `admin`
  (login and inbox) is a second Next.js app in `apps/admin`, to be
  routed under `/admin/*` with Vercel Microfrontends. The code is in the repository
  but not deployed yet. See [Admin app](#admin-app). `kafka` (`apps/kafka`) is a third
  app for the live Kafka demo, to be routed under `/kafka/*` the same way. See
  [Kafka app](#kafka-app).
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

- **Three projects at most:** `web`, `admin` and `kafka`. No Vercel projects for services.
- **Pages are static** and re-rendered at most once an hour (`REVALIDATE_SECONDS` in
  `frontend/src/lib/api.ts`), so visitors are served from the CDN and the API sees
  about one request per page per hour, not one per visit.
- **One function:** `POST /api/contact` (`maxDuration` 25 s). It rejects bodies over
  16 KB before reading them and validates before doing any network call. Every
  outbound call has a timeout: relay 4 s, MX lookup 2 s, SMTP 10 s, so the worst case
  is 16 s.
- **CI does not deploy.** Vercel's Git integration builds once per push.
- **Settings worth turning on** (dashboard, not in the repo): skip builds when nothing
  under the project's root directory changed, so backend-only and Dependabot Maven
  pushes cost no build; and a spend limit under Billing → Spend Management.

## Contact delivery

`POST /api/contact` on `web` tries these in order:

1. **Relay** to the API when `BACKEND_URL` is set. A definite answer (2xx, or a 4xx such
   as validation or rate limit) is returned to the visitor as is.
2. **Direct SMTP** (`nodemailer`, `MAIL_*`) when there is no `BACKEND_URL`, or when the
   relay failed: backend unreachable, no answer within 4 s, a 5xx, or a non-JSON reply.
   On this path `web` applies its own rate limit and email-domain checks (the API's did
   not run) and logs a warning.
3. **Undeliverable** when neither path can deliver (HTTP 503 with no mail configured,
   502 if SMTP rejects or hangs). The form's error state then shows a `mailto:` link,
   and the contact page always shows "Or email me directly", when
   `NEXT_PUBLIC_CONTACT_EMAIL` is set. No address is hard-coded in the repository.

Each outcome writes one JSON line to the function logs (Vercel → project → Logs, filter
`"event":"contact"`): `relayed`, `sent-smtp`, `fell-back`, `undeliverable`. Lines carry
status codes, reasons and a masked sender (`a***@example.com`); never the message,
subject, name or a full address. A failure to deliver is an `undeliverable` line.

### Turn on contact email

Do this once, in the Vercel `frontend` project (Settings → Environment Variables), for
Production (and Preview if you want previews to send mail):

1. **Remove `BACKEND_URL`** until the API is live. It currently points at a dead host.
   (Leaving it is safe now, since the form falls back to SMTP after 4 s, but it adds a
   delay to every submission and a 5 s wait per page at build time.)
2. **Add `MAIL_USER`**: the sending mailbox, e.g. your Gmail address.
3. **Add `MAIL_PASS`**: for Gmail, an **app password**, never the account password.
   Create it at <https://myaccount.google.com/security> → turn on 2-Step Verification →
   App passwords → create one named "portfolio". Paste the 16 characters without spaces.
4. **Optional `CONTACT_NOTIFY_TO`**: where messages are delivered if not `MAIL_USER`.
   `MAIL_HOST` and `MAIL_PORT` default to `smtp.gmail.com` and 587; set them only for
   another provider.
5. **Add `NEXT_PUBLIC_CONTACT_EMAIL`**: the address visitors may write to directly. It is
   public, and read at build time, so a redeploy is required.
6. **Redeploy** the latest production deployment (Deployments → ⋯ → Redeploy). Variable
   changes apply only to new deployments.
7. **Send a test message** from <https://justcallmepratt.dev/contact> using a real
   address that is not yours, and confirm it arrives (check spam once). If the form shows
   an error, read the `"event":"contact"` log lines for the reason. Real delivery has not
   been tested in this repository's CI.

When the API goes live, set `BACKEND_URL` again. The SMTP variables can stay as the
fallback.

## Vercel setup

State as of 2026-11-20. Every push to `main` deploys production and every PR gets a
preview.

- **Project `frontend`** is `web`. Root directory is `frontend`; `justcallmepratt.dev`
  is attached and `www.justcallmepratt.dev` redirects to it. The original
  `frontend-liard-theta-28.vercel.app` address still works.
- **Still to do on `frontend` → Environment Variables:** remove `NEXT_PUBLIC_API_URL`;
  set `NEXT_PUBLIC_SITE_URL` to `https://justcallmepratt.dev`; set `BACKEND_URL` to the
  Railway URL once the backend is up. Until then it points at a dead host, so every
  build waits 5 s per page before falling back to the repo content. Add the mail
  variables too: see [Turn on contact email](#turn-on-contact-email).
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

## Admin app

`apps/admin` is a separate Next.js app: sign-in and the contact-message inbox. It is
**not deployed yet**, and it has only been run against a local stand-in for the API,
never the real one. It is useful once the API is live on Railway.

How it works:

- **Routes:** `/admin` (inbox) and `/admin/login`, plus its own handlers under
  `/admin/api/*`. All routes sit in `src/app/admin/`; the app does not set `basePath`,
  because Vercel Microfrontends does not support Next.js apps that use it.
- **The browser only talks to this app.** The handlers call the API server-side with
  `BACKEND_URL`. The API's JWT is kept in an `httpOnly`, `secure`, `sameSite=strict`
  cookie scoped to `/admin`; client script never sees it. The cookie expires with the
  token (24 h by default, `jwt.expiry-ms` in the backend).
- **Every API call has an 8 s timeout**, and the login handler refuses bodies over 4 KB.
- **No static pages and no caching:** each view of the inbox is one function call and
  one API request. Only the admin uses it, so the cost is negligible.

### Environment variables for `admin`

| Variable | Required | Purpose |
|---|---|---|
| `BACKEND_URL` | yes | Base URL of the API, `https://api.justcallmepratt.dev`. Server-only. Without it the app builds and runs but every page reports that no API is configured. |

### Vercel setup (by hand, in this order)

Nothing here has been done yet. Steps 2 to 4 follow
<https://vercel.com/docs/microfrontends/quickstart>; re-check that page before starting
in case it has changed.

1. **Create the project.** New Vercel project from this repository, named `admin`
   (the name is what `microfrontends.json` refers to), root directory `apps/admin`,
   framework Next.js. Set `BACKEND_URL` for Production and Preview. Deploy and check
   that `https://<admin-project>.vercel.app/admin/login` loads. Do not attach a domain.
2. **Create the microfrontends group.** Team **Settings → Microfrontends → Create
   Group**. Add the `frontend` and `admin` projects and choose **`frontend` as the
   default application**. Nothing changes for visitors until step 3 reaches production.
3. **Add `microfrontends.json` to the default app** (`frontend/microfrontends.json`,
   deliberately not part of the change that added `apps/admin`), then deploy it to
   production. Vercel shows a suggested file on the `frontend` project under
   **Settings → Microfrontends**; it should be equivalent to:

   ```json
   {
     "$schema": "https://openapi.vercel.sh/microfrontends.json",
     "applications": {
       "frontend": {
         "development": { "fallback": "justcallmepratt.dev" }
       },
       "admin": {
         "routing": [{ "paths": ["/admin/:path*"] }]
       }
     }
   }
   ```

   The keys under `applications` must be the Vercel project names. The quickstart also
   has every app in the group install `@vercel/microfrontends` and wrap its Next.js
   config in `withMicrofrontends`; `apps/admin` already does, and `frontend` needs the
   same change in that commit.
4. **Redeploy `admin`** after step 3 is live. Its build then picks up the group's
   configuration and serves its JavaScript and CSS under its own asset prefix
   (`/vc-ap-…`) so they cannot collide with the public site's `/_next/` files. Until
   then the build logs "no microfrontends.json found; building as a standalone app",
   which is expected.
5. **Check** `https://justcallmepratt.dev/admin/login` signs in and the inbox loads,
   and that the public pages are unchanged.

Things to know:

- **Cost:** Hobby and Pro include two microfrontends projects; on Pro, routing is
  billed at $2 per million routed requests. A third project costs extra.
- **Moving between the public site and `/admin` is a full page load**, since they are
  separate apps.
- **`apps/admin` has no `public/` directory** on purpose: files there are not covered
  by the asset prefix and would have to be routed separately.
- **Rollback:** remove the `admin` entry from `microfrontends.json` and redeploy
  `frontend`; `/admin/*` then goes back to the public site (a 404).

### Edge cases and what the admin sees

| Situation | Behaviour |
|---|---|
| `BACKEND_URL` not set | Login and inbox say no API is configured (HTTP 503 from the handlers) |
| API unreachable | "The API could not be reached" (502); the session is kept, **Refresh** retries |
| API slower than 8 s | "The API took too long to answer" (504); same as above |
| API answers with something that is not the expected JSON | "A response this app could not read" (502) |
| Wrong username or password | "Invalid credentials" (401) |
| `ADMIN_PASSWORD_HASH` not set on the API | "Admin sign-in is not configured on the API" (503) |
| Token expired or rejected (API answers 401 or 403) | Cookie cleared, back to the login page with "Your session has expired" |
| Message deleted before it is toggled (404) | Removed from the list with "That message no longer exists" |
| No messages | "No messages yet" |
| Oversized or malformed login request, request from another origin | Rejected by `admin` (413 / 400 / 403) without calling the API |

### Local development

```bash
cd apps/admin
pnpm install
BACKEND_URL=http://localhost:8080 pnpm dev   # http://localhost:3001/admin
pnpm exec tsc --noEmit && pnpm lint && pnpm test && pnpm build
```

## Kafka app

`apps/kafka` is the live Kafka demo as its own Next.js app, built to join the same
microfrontends group as `admin`. It is **not deployed yet**. Until it is, the demo
keeps running from `web` at `/projects/kafka` (see [Kafka live demo](#kafka-live-demo));
both copies talk to the same Railway service, so nothing is lost while this is pending.

How it works:

- **Routes:** `/kafka` (the page) plus its own handlers `/kafka/api/produce` and
  `/kafka/api/messages`. All routes sit in `src/app/kafka/`, with no `basePath`, for
  the same reason as `admin`.
- **Same behaviour as the page in `web`:** session-scoped records, validation, rate
  limits, a 10 s timeout, and bounded polling. The code was copied, not shared, because
  the shared UI package (roadmap step 3) does not exist yet. Until it does, a change to
  the demo has to be made in the copy that is live.
- **Its header links back to `/` and `/projects` with plain links**, which are full
  page loads because those pages belong to `web`.

### Environment variables for `kafka`

| Variable | Required | Purpose |
|---|---|---|
| `KAFKA_DEMO_URL` | yes | Base URL of the Kafka demo service on Railway. Server-only, read at build time and at request time. Without it the page shows "broker offline". |
| `KAFKA_DEMO_TOKEN` | yes | Must match the service's `DEMO_API_TOKEN`. Server-only. |
| `NEXT_PUBLIC_SITE_NAME` | no | Site name shown in the header and page title |

### Vercel setup (by hand, in this order)

Nothing here has been done yet. It follows the same steps as [Admin app](#admin-app);
if the microfrontends group already exists, skip creating it.

1. **Create the project.** New Vercel project from this repository, named `kafka`,
   root directory `apps/kafka`, framework Next.js. Set both variables above for
   Production and Preview. Deploy and check that
   `https://<kafka-project>.vercel.app/kafka` loads and a record goes through. Do not
   attach a domain.
2. **Add it to the microfrontends group** (Team **Settings → Microfrontends**), with
   `frontend` as the default application.
3. **Route `/kafka/*` to it** in `frontend/microfrontends.json`, next to `admin`:

   ```json
   "kafka": {
     "routing": [{ "paths": ["/kafka", "/kafka/:path*"] }]
   }
   ```

   `frontend` must also wrap its Next.js config in `withMicrofrontends` in that commit,
   as described for `admin`.
4. **Redeploy `kafka`** once step 3 is live, so its assets get their own prefix.
5. **Cut over, in a separate change to `web`:** replace `frontend/src/app/projects/kafka`
   with a redirect to `/kafka`, point the projects page link at `/kafka`, and delete
   `frontend/src/app/api/kafka`, `KafkaDemo.tsx`, `lib/kafka.ts` and their tests. Then
   remove `KAFKA_DEMO_URL` and `KAFKA_DEMO_TOKEN` from the `frontend` project.
6. **Check** `https://justcallmepratt.dev/kafka` sends and shows a record, the old
   `/projects/kafka` address redirects, and the public pages are unchanged.

**Rollback:** remove the `kafka` entry from `microfrontends.json` and redeploy
`frontend`. If step 5 has already shipped, revert that change too.

### Local development

```bash
cd apps/kafka
pnpm install
KAFKA_DEMO_URL=http://localhost:<port> pnpm dev   # http://localhost:3002/kafka
pnpm test && pnpm lint && pnpm exec tsc --noEmit && pnpm build
```

## Environment variables for `web`

| Variable | Required | Purpose |
|---|---|---|
| `BACKEND_URL` | for live data | Base URL of the API. Server-only. |
| `KAFKA_DEMO_URL` | for the Kafka demo | Base URL of the Kafka demo service (see [Kafka live demo](#kafka-live-demo)). Server-only, read at build time and at request time. |
| `KAFKA_DEMO_TOKEN` | when the service has `DEMO_API_TOKEN` set | The same secret, sent as `X-Demo-Token` on every relay call. Server-only. |
| `GITHUB_TOKEN`, `GITHUB_USERNAME` | no | Optional, server-only. The home page's GitHub activity section makes one request an hour to `api.github.com` (60/hour per IP unauthenticated); a read-only token only raises that limit. `GITHUB_USERNAME` overrides the default account (`DEFAULT_GITHUB_USERNAME` in `frontend/src/lib/github.ts`). |
| `NEXT_PUBLIC_SITE_NAME` | no | Site title |
| `NEXT_PUBLIC_SITE_URL` | no | Canonical URL for metadata / Open Graph |
| `MAIL_USER`, `MAIL_PASS` | to receive contact mail without the API | SMTP login for the direct path and the fallback. For Gmail, `MAIL_PASS` is an app password. Server-only. |
| `MAIL_HOST`, `MAIL_PORT` | no | SMTP server, default `smtp.gmail.com` and 587 (465 uses TLS) |
| `CONTACT_NOTIFY_TO` | no | Recipient; defaults to `MAIL_USER` |
| `NEXT_PUBLIC_CONTACT_EMAIL` | recommended | Public address for the `mailto:` link in the form's error state and the "email me directly" line. Unset means no link is shown. Read at build time. |
| `CONTACT_RATE_LIMIT_MAX`, `CONTACT_RATE_LIMIT_WINDOW` | no | Direct-SMTP path limits (default 3 per 3600 s, per instance, best effort) |

## Edge cases and what happens

| Situation | Behaviour |
|---|---|
| API down, erroring, or returning bad JSON | Pages render from `src/content`; a warning is logged |
| API slower than 5 s (cold start) | Same fallback; the next hourly re-render tries again |
| GitHub unreachable, slow (5 s), rate limited (403/429), 404, 5xx, bad JSON or no public repos | The GitHub activity section shrinks to a link to the profile; a warning is logged; the build and the page still succeed |
| API down when the contact form is submitted | Falls back to SMTP if `MAIL_USER` / `MAIL_PASS` are set (message delivered, warning logged); otherwise 503 and the form offers the `mailto:` link |
| Contact relay slower than 4 s, or answering 5xx / non-JSON | Treated as down: same fallback as above |
| API answers 4xx (validation, 429) | Passed to the visitor; no fallback, no SMTP |
| Fallback path | `web` applies its own rate limit (429) and email-domain checks (422) |
| SMTP rejects the message (bad app password, etc.) | 502, logged as `undeliverable` with the error code; form offers the `mailto:` link |
| SMTP slower than 10 s | Aborted, 502 |
| `NEXT_PUBLIC_CONTACT_EMAIL` unset or malformed | No `mailto:` link or "email me directly" line is rendered |
| Invalid or oversized contact payload | Rejected by `web` (400 / 413) without calling the API |
| Too many submissions | With the API: its per-address limit (429), `web` forwards the visitor's address. Direct SMTP: `web`'s own limit |
| `BACKEND_URL` not set | Fully static site; contact handled by `web` over SMTP, or 503 if SMTP is not configured |
| `KAFKA_DEMO_URL` not set | `/projects/kafka` renders with a "broker offline" notice and a disabled form; no function is called |
| Kafka demo service down, cold or slower than 10 s | The send or read returns 502 and the page says the service is not responding |
| Record produced but never consumed | The page polls 8 times (about 10 s), then stops and offers Refresh |
| More than 20 sends or 120 reads a minute from one address | 429 (per instance, best effort) |

## Kafka live demo

`/projects/kafka` produces and consumes real records through the Spring Boot service in
[Kafka-Producer-Consumer-Demo](https://github.com/justcallmepratt/Kafka-Producer-Consumer-Demo).
The browser only talks to `web`: `POST /api/kafka/produce` and `GET /api/kafka/messages`
relay to that service's endpoints of the same name.

- **Where it runs.** Railway project `kafka-demo`: the `kafka-demo-api` service (that
  repo's Dockerfile) and a single-node `kafka` broker on the private network. Consumed
  records are stored in this site's Supabase project, in the `kafka_demo` schema, which
  the Supabase API does not expose. Setup is in that repo's README ("Deploying to
  Railway"). On Vercel, set `KAFKA_DEMO_URL` and `KAFKA_DEMO_TOKEN` and redeploy; the
  page is static, so the offline notice only goes away on a new build.
- **Visitors only see their own records.** The relay prefixes each Kafka key with a
  random per-tab session id and filters reads by it, so nothing one visitor types is
  shown to another. The service returns its latest 100 records overall, so on a busy
  day a session's older records can drop out of view.
- **The service is locked to the relay.** With `DEMO_API_TOKEN` set on the service,
  its `/api/**` endpoints (including `DELETE /api/kafka/consume`) return 401 without
  the matching `X-Demo-Token` header, which only the relay sends. If the two values
  drift apart, sends and reads fail with 502.
- **Function use:** nothing on page view (one read if the tab already produced
  something), one call per send, then at most 8 reads while waiting for the consumer.

To try it locally, run the demo service (it needs Kafka and Postgres, see its README) and
start the site with `KAFKA_DEMO_URL=http://localhost:<port> pnpm dev`.

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
4. **`admin` micro-frontend:** login and inbox are built (`apps/admin`). Still to do:
   the Vercel steps under [Admin app](#admin-app).

The prioritised plan for the remaining phases (what to do now, what to drop, in what
order) is in [ROADMAP.md](ROADMAP.md); the findings behind it are in
[RESEARCH.md](RESEARCH.md).

## GitHub setup

- **Branch protection on `main`:** the CI jobs `Backend — Java 21 / Maven` and
  `Frontend — Node 22 / pnpm` must pass before merging. `Admin — Node 22 / pnpm` also
  runs on every PR but is not a required check yet; add it under Settings → Branches
  if it should be. No review is required and
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
