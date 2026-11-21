# Deployment

How the site is built, deployed and configured, and what is still outstanding. State as of
2026-11-21. This replaces the earlier `REMAINING_WORK.md`, `DEPLOYMENT_OPTIONS.md` and
`docs/MIGRATION_TO_GITHUB_PAGES.md` (see git history).

## Where things stand

| Part | Where | State |
|---|---|---|
| Public site (`frontend/`) | Vercel project `frontend`, root directory `frontend`, <https://justcallmepratt.dev> (`www` redirects to it) | Live. Profile, projects and experience come from the API (database); certifications and "In the works" come from `frontend/src/content/index.ts`, which is also the fallback. |
| API (`backend/`) | Railway project `kafka-demo`, service `personal-web-app-api` | Deployed and healthy at `https://personal-web-app-api-production.up.railway.app`. **Used by the production site** (`BACKEND_URL`); previews have no `BACKEND_URL` and use the repo content. |
| API custom domain `api.justcallmepratt.dev` | Railway + Vercel DNS | Not attached. |
| Kafka demo | Site page `/projects/kafka`, relaying to Railway service `kafka-demo-api` | Live. This is the demo's only home; `/kafka` and everything under it redirect here (308, from `frontend`). |
| `apps/kafka` | Nothing | Built and tested in CI, **not deployed**. Checked on 2026-11-21: the team that owns `frontend` has no `kafka` project and `frontend` is in no microfrontends group. Optional; see [the checklist](#if-you-want-the-separate-kafka-project-later). |
| `apps/admin` (`/admin`) | Vercel project `admin` (own address; the microfrontends group is optional) | Not deployed: no Vercel project yet, and admin sign-in is off on the API. Owner steps: [Turn on admin](#turn-on-admin). |
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

One list, in order. Nothing done is on it; what is done is in [ROADMAP.md](ROADMAP.md).

**First, before merging the content-suggestions pull request:** run
`supabase/migrations/2026-11-21_content_suggestions.sql` on the Supabase database
([steps and order](#content-suggestions-run-the-migration-before-merging)). The API will
not start without that table.

**And before merging the market-research pull request:** run
`supabase/migrations/2026-11-21_market_research.sql` the same way
([steps and order](#market-research-run-the-migration-before-merging)). The job itself
stays off until its three variables are set ([turn it on](#turn-on-market-research)).

1. **Delete the two unused Vercel projects `personal-web-app` and `backend`.** Checked
   2026-11-21: the team has exactly three projects (`frontend`, `backend`,
   `personal-web-app`). The last two never had a working deployment but still build on
   every push. Then delete the GitHub environments they created (`… – backend`,
   `… – personal-web-app`).
2. **Turn on admin** ([checklist](#turn-on-admin)): create the Vercel `admin` project in
   the team that owns `frontend`, then set `ADMIN_PASSWORD_HASH` on the Railway service.
   The sign-in rate limiter is live (PR #73), so nothing blocks this. Until the hash is
   set, admin sign-in answers 503 "Admin not configured", by design.
3. **Turn on contact email.** The contact form relays to the API, which stores each
   message but sends no email until `MAIL_USER` and `MAIL_PASS` are set on the Railway
   service. Also set the Vercel variables ([steps](#turn-on-contact-email)) for the SMTP
   fallback and the `mailto:` link.
4. **Attach `api.justcallmepratt.dev`:** add it as a custom domain on the Railway
   service, create the CNAME Railway shows in the Vercel DNS zone, then change
   `BACKEND_URL` on Vercel to `https://api.justcallmepratt.dev` and redeploy. Set
   `CORS_ORIGIN` on Railway to `https://justcallmepratt.dev`.
5. **Fix stale content about the API itself:**
   - the Supabase `projects` row for `justcallmepratt.dev` still says the API is "built
     and tested in CI but not deployed yet" (the content file in the repo is already
     correct), so the live site shows the old text;
   - `SeedRunner.java` still seeds the old placeholder persona into *empty* tables, so a
     fresh database would get it.
6. **Security follow-ups** (Swagger behind GitHub sign-in, Content-Security-Policy,
   contact rate limit, two CodeQL alerts to dismiss) are in
   [ROADMAP.md](ROADMAP.md#security-follow-ups).
7. **Dependabot PR #38** (Maven wrapper 3.10.0 → 3.10.1) is held: its diff rewrites
   `backend/mvnw.cmd` with CRLF line endings. Merge or close it deliberately.
8. **Product work, not operations:** Vercel Web Analytics (decided, not
   added); turning on the weekly market research (built, off:
   [steps](#turn-on-market-research)); the monorepo move (later);
   an optional microfrontends group (`/admin` on the main domain) and an optional
   separate `kafka` project. See [ROADMAP.md](ROADMAP.md).

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
- **Footprint:** the target is two projects (`frontend`, and `admin` once created), none
  for services; today there are three (`frontend` plus the two unused ones). A separate
  `kafka` project is optional and not planned.
  Pages are static and re-rendered at most hourly (`REVALIDATE_SECONDS` in
  `frontend/src/lib/api.ts`), so the API sees about one request per page per hour. The
  functions are `POST /api/contact` (25 s max; bodies over 16 KB rejected before reading;
  relay 4 s, MX lookup 2 s, SMTP 10 s) and the two Kafka relay routes.
- **How the resume PDF stays current:** `/resume.pdf` is never a file in the repo. It is
  a `GET` route handler (`frontend/src/app/resume.pdf/route.ts`) marked
  `dynamic = 'force-static'` with `revalidate = 3600`, so it behaves exactly like a
  page: rendered once at build time, served from Vercel's cache, and re-rendered in
  the background at most once an hour, when it reads the content API again. A content
  change in the API therefore reaches the PDF within about an hour with no deploy; a
  change to `frontend/src/content/index.ts` reaches it with the deploy that push
  triggers. No visitor request runs the generator, and nothing needs a headless
  browser: the PDF is written by about 500 lines of code in `frontend/src/lib/pdf/` and
  `lib/resumePdf.ts`, with no added dependency. To force a refresh sooner, redeploy.

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

To deploy `admin`, follow [Turn on admin](#turn-on-admin); serving it on the main
domain is its optional last step (it needs the group, with `frontend` as the default
application, and an `admin` entry in `frontend/microfrontends.json`).

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
  The sign-in rate limit needs no variables (defaults below).
- **Variables not set:** `ADMIN_PASSWORD_HASH` (admin sign-in answers 503 "Admin not configured" until the owner sets it; see [Turn on admin](#turn-on-admin)) and
  `MAIL_USER`, `MAIL_PASS` (and `MAIL_HOST`, `MAIL_PORT`, `CONTACT_NOTIFY_TO`; contact
  messages are stored in the database but no notification email is sent).

| Variable | Value |
|---|---|
| `SPRING_PROFILES_ACTIVE` | `docker` |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://<pooler-host>:5432/postgres?sslmode=require` |
| `SPRING_DATASOURCE_USERNAME` | pooler username, `postgres.<project-ref>` |
| `SPRING_DATASOURCE_PASSWORD` | the Supabase database password |
| `DB_POOL_SIZE` | `5` (the pooler caps connections on the free plan) |
| `JWT_SECRET` | `openssl rand -base64 32` |
| `ADMIN_PASSWORD_HASH` | bcrypt hash of the admin password ([how to make it](#turn-on-admin)) |
| `ADMIN_USERNAME` | admin username (default `admin`; `psachan` in production) |
| `ADMIN_LOGIN_MAX_ATTEMPTS`, `ADMIN_LOGIN_MAX_ATTEMPTS_OVERALL`, `ADMIN_LOGIN_WINDOW_SECONDS` | optional sign-in rate limit; defaults 5 per client address, 30 overall, 900 s |
| `MAIL_USER`, `MAIL_PASS` (and `MAIL_HOST`, `MAIL_PORT`) | SMTP credentials for notifications |
| `CORS_ORIGIN` | `https://justcallmepratt.dev` (only matters for browser calls; the site calls the API server-side) |
| `MARKET_RESEARCH_ENABLED`, `ADZUNA_APP_ID`, `ADZUNA_APP_KEY` | not set; the weekly market research is off until all three are ([turn it on](#turn-on-market-research), with the optional variables) |

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

## Content suggestions: run the migration before merging

The suggest-and-approve feature adds a table, `content_suggestions`. The API runs
Hibernate with `ddl-auto: validate`, so **the API will not start if the table is
missing**, and Railway deploys `main` on every push. The order that is safe:

1. **Run the migration first.** Supabase dashboard → SQL editor → paste
   [`supabase/migrations/2026-11-21_content_suggestions.sql`](../supabase/migrations/2026-11-21_content_suggestions.sql)
   → Run. It only creates the new table, its two indexes and row level security on it;
   it changes no existing table or row and can be run again without effect. The API
   that is running now ignores the extra table, so doing this early is harmless.
2. **Check it:** `select count(*) from content_suggestions;` answers `0`.
3. **Then merge the pull request.** Railway redeploys the API and Vercel the admin app.
4. **Confirm** `/actuator/health` on the API answers 200, then open `/admin/suggestions`.

If the pull request is merged before step 1, the new API deployment fails at startup with
a schema-validation error naming `content_suggestions`. Railway's health check should keep
the previous deployment serving, but do not rely on that: run the migration, then
redeploy the service from the Railway dashboard.

What to know when using it:

- A suggestion changes nothing until it is accepted at `/admin/suggestions`. Accepting
  writes the one field to the database; the public site shows it at its next hourly
  re-render (so within the hour), with no deploy.
- `frontend/src/content/index.ts`, the fallback the site uses when the API is down, is
  **not** updated by accepting a suggestion. Update it by hand to match, or the fallback
  drifts from the database.
- Rolling back: reverting the pull request is safe with the table left in place. To undo
  one accepted change, make and accept a suggestion that puts the old value back (the
  history view shows what it was).

## Market research: run the migration before merging

The weekly market research adds three tables, `market_research_runs`,
`market_role_totals` and `market_skill_counts`. As with content suggestions, the API runs Hibernate with
`ddl-auto: validate`, so **the API will not start if they are missing**, and Railway
deploys `main` on every push. The order that is safe:

1. **Run the migration first.** Supabase dashboard → SQL editor → paste
   [`supabase/migrations/2026-11-21_market_research.sql`](../supabase/migrations/2026-11-21_market_research.sql)
   → Run. It only creates the three new tables and turns row level security on for them;
   it changes no table or row that existed before and can be run again without effect.
   **If you ran an earlier version of this file, run it again:** the per-role breakdown
   added a column and a table, and the file brings an earlier run up to date. The API that
   is running now ignores the extra tables, so doing this early is harmless.
2. **Check it:** `select count(*) from market_role_totals;` answers `0`.
3. **Then merge the pull request.** Railway redeploys the API. Nothing else changes: the
   job is **off** until you turn it on (below), and the log says so once at startup:
   `Market research is disabled: MARKET_RESEARCH_ENABLED is not true`.
4. **Confirm** `/actuator/health` on the API answers 200.

If the pull request is merged before step 1, the new API deployment fails at startup with
a schema-validation error naming `market_research_runs`. Run the migration, then redeploy
the service from the Railway dashboard. It also needs `content_suggestions`
([above](#content-suggestions-run-the-migration-before-merging)), which is already merged.
Rolling back: reverting the pull request is safe with the tables left in place.

### Turn on market research

All on the Railway service `personal-web-app-api` → Variables. No key is in the
repository, and none should ever be.

1. **Get the API keys.** Register at <https://developer.adzuna.com/signup> (free, no
   payment details) and create an application; the dashboard shows an *application id*
   and an *application key*. While there, **read the rate limits shown in your account**:
   Adzuna publishes no numbers, and this job makes about 126 requests in one weekly run
   (one per company and target role),
   at most one every 3 seconds (see [limits](#what-it-does-and-the-limits-of-the-data)).
2. **Set three variables:** `ADZUNA_APP_ID`, `ADZUNA_APP_KEY` and
   `MARKET_RESEARCH_ENABLED=true`. Railway redeploys. The startup log now says
   `Market research is enabled: schedule '0 0 6 * * MON' (UTC)`. With any of the three
   missing the job stays off and the log says which.
3. **Keep the service always on.** The schedule lives inside the API process, so
   Railway's serverless / app-sleeping option must stay off for this service
   ([RESEARCH.md 2.4](RESEARCH.md#24-scheduled-and-background-jobs-on-railway-and-the-supabase-free-tier)).
4. **Run it once by hand** instead of waiting for Monday (needs [admin](#turn-on-admin)
   switched on, for the token): `POST /api/admin/market-research/run` with the admin
   `Authorization: Bearer …` header answers 202 and runs in the background (six to
   seven minutes). `GET /api/admin/market-research/latest` then shows the week's counts. There
   is no page for this in the admin app; Swagger UI on the API has both calls.
5. **Read the first run's log.** It lists the companies for which no listing was counted
   (`no listing counted for N of M companies: …`). That usually means the `searchName`
   or `aliases` for that company in the allow-list do not match what Adzuna calls it:
   they were written from Fortune's and FINRA's names and **have not been checked
   against Adzuna**. Fix them in the allow-list and merge.
6. **Decide the suggestions** at `/admin/suggestions`. Each has source `market-research`
   and a reason giving the numbers. Accept only skills you really have experience with;
   reject the rest. A rejected skill is never proposed again.

| Variable | Value |
|---|---|
| `MARKET_RESEARCH_ENABLED` | `true` to switch the job on (default off) |
| `ADZUNA_APP_ID`, `ADZUNA_APP_KEY` | from the Adzuna developer dashboard; both required |
| `MARKET_RESEARCH_CRON` | optional; Spring cron in UTC, default `0 0 6 * * MON` (Mondays 06:00). A value that is not a cron expression falls back to the default with a warning |
| `MARKET_RESEARCH_MIN_LISTINGS` | optional; default `30`, per role. A role with fewer listings examined in a week produces no suggestion |
| `MARKET_RESEARCH_MIN_SHARE_PERCENT` | optional; default `20`. A skill must be mentioned in at least this share of a role's listings (and in at least 5) |
| `MARKET_RESEARCH_MAX_SUGGESTIONS` | optional; default `3` per run, `0` for none. Never more than 5 from market research waiting at once |

To switch it off again, remove `MARKET_RESEARCH_ENABLED` (or set it to `false`). Stored
summaries and suggestions stay.

### What it does, and the limits of the data

- **Two target roles** (yours, 2026-11-21): software developer and forward deployed
  engineer, both in financial services at the allow-listed companies. The title variants
  that count for each are a reviewed list in the repository (below).
- **Once a week** it asks Adzuna, company by company and role by role, for recent
  listings at the companies on the allow-list, keeps the ones whose employer name matches
  that company and whose title is one of a role's variants, and counts how many mention
  each skill in the dictionary. The title decides the role, and a listing counts for one
  role only ("Forward Deployed Software Engineer" is a forward deployed engineer). It
  stores **counts only, per role** (role, skill, listings that mentioned it, listings of
  that role examined, week): no listing text, id or link is stored or logged.
- **Then it proposes.** Each role is judged on its own listings. For a skill that is
  common in a role's listings that week and is not on the profile, in any experience
  entry or in any project, it creates one pending suggestion to add that skill's name to
  the profile's tech stack. The reason states the evidence, **says which role's listings
  it came from** ("mentioned in 10 of 12 forward deployed engineer listings"; a skill
  common in both roles names both), and asks you to accept only if you have that
  experience. It never edits anything itself, never
  touches experience or project text, and never words a claim about you.
- **Safe to run twice.** One summary per week (weeks start on Monday, UTC). A second run
  in the same week fetches nothing and only re-checks suggestions; `?force=true` on the
  manual call fetches again and replaces that week. Two runs never overlap.
- **A failed run** (Adzuna down, rate limited, bad key) is retried per request up to
  three times with a growing wait, then the run stops, logs
  `Market research run FAILED for the week of …` with the reason, stores no counts, and
  leaves earlier summaries exactly as they were. Nothing retries it until the next
  scheduled run or a manual call.
- **Accepting one suggestion supersedes the others still pending** for the tech stack
  (the suggestions queue does that for any field: they were made against the old list).
  Trigger a run, or wait for the next one, and the remaining skills are proposed again
  against the new list.

Limits to keep in mind when reading the numbers:

- Adzuna returns only the first **500 characters** of a description, so counts are
  undercounts and favour skills named in titles and opening lines.
- **Forward deployed engineer listings will be few.** The role is rare at these firms,
  and a role needs 30 listings in a week before it produces any suggestion (the two
  roles are never added together). Expect its counts to be recorded and visible in the
  summary while producing no suggestions; lower `MARKET_RESEARCH_MIN_LISTINGS` only if
  you accept acting on a small sample (it applies to both roles).
- At most **50 listings per company and role**, from the last 30 days, in the US (the
  developer search is limited to Adzuna's IT category; the forward deployed search is the
  exact phrase "forward deployed" in any category); consecutive weeks overlap, so week-to-week changes are small by construction.
- The skill list is a fixed dictionary; a technology that is not in it is never counted.
- Adzuna's **rate limits and its matching of the `company` filter are not documented**,
  and none of this has been run against the real API (no key was available). Expect to
  adjust search names after the first run.
- Adzuna's terms allow personal research and job search; anything published must credit
  Adzuna. Nothing here is published, so keep it that way or add the credit
  ([RESEARCH.md](RESEARCH.md#adzuna-jobs-api-market-research)).

### The target roles, the allow-list and the skills dictionary

All three are data files in the repository, read at startup; change them with a pull
request.

- **[`backend/src/main/resources/market/roles.json`](../backend/src/main/resources/market/roles.json)**:
  the target roles. Each has an `id` (stored with the counts; do not change it once runs
  exist), a `name` (how it is written in a suggestion's reason), the `titles` that count,
  and the `search` sent to Adzuna. Today: **software developer** (software engineer,
  software developer, software development engineer, backend / back end developer or
  engineer, Java developer or engineer, full stack developer or engineer, application
  developer, programmer analyst, software programmer) and **forward deployed engineer**
  (forward deployed engineer, forward deployed software engineer, forward deployed
  developer, forward deployed AI engineer, forward deployed solutions engineer, forward
  deployment engineer). A title counts when it contains a variant as whole words, so
  "Senior Software Engineer II" counts and "Software Engineering Manager" does not. To
  add a variant, add a line to `titles`. Each role costs one request per company a week.

- **[`backend/src/main/resources/market/allow-list.json`](../backend/src/main/resources/market/allow-list.json)**:
  the companies that count. The rule (yours, 2026-11-21): on the current Fortune 500
  **and** is, or owns, a FINRA member broker-dealer. Compiled 2026-11-21 from the 2026
  Fortune 500 and FINRA BrokerCheck: 63 companies count, each with its rank, the
  broker-dealer's name and CRD number, a BrokerCheck link and the ownership chain. 56
  more are listed with `"included": false` and the reason (no FINRA member found, not on
  the list, or not confirmed). To change it: edit the entry. A company is used only when
  `included` is `true` **and** it has a rank from 1 to 500, a FINRA firm with a CRD
  number and at least one alias, so a half-finished edit can only shrink the list.
  `aliases` are matched as whole words inside a listing's employer name; keep them
  specific (`aliasesLeftOut` records the short names deliberately not used, such as
  "chase" or "citizens"). Review the list when a new Fortune 500 comes out and update
  `compiledOn`. **Two decisions are yours:** CBRE Group and Jones Lang LaSalle meet both
  tests but are real-estate companies, so they are switched off; and companies outside
  Fortune's Financials sector were not screened.
- **[`backend/src/main/resources/market/skills.json`](../backend/src/main/resources/market/skills.json)**:
  the skills looked for, with other spellings. The `name` is exactly what would be added
  to your tech stack, so write it the way you want it shown. Ambiguous words (Go, R, C)
  are left out on purpose.

If any of the three files cannot be read, the job stays off and says so in the log; the
API still starts.

## Turn on admin

`apps/admin` is sign-in and the contact-message inbox: `/admin` (inbox), `/admin/login`,
and handlers under `/admin/api/*`. As of 2026-11-21 it is **not deployed**: the team has
no Vercel project for it, and the API answers every sign-in with 503 "Admin not
configured" because `ADMIN_PASSWORD_HASH` is unset. Only the owner can do the steps
below, in this order. Steps 1 to 4 are enough to use admin; step 5 is optional.

1. **Create the Vercel project.** Vercel dashboard → Add New → Project → import
   `justcallmepratt/personal-web-app`, in the **same team as `frontend`**.
   - Project name: `admin` (step 5 needs exactly this name).
   - Root directory: `apps/admin`. Leave framework, build and install settings alone;
     `apps/admin/vercel.json` sets them.
   - Environment variable, for Production: `BACKEND_URL` =
     `https://personal-web-app-api-production.up.railway.app` (no trailing path). It is
     the only variable the app reads. Do not attach a domain.
2. **Deploy and open `https://<the project's production address>.vercel.app/admin/login`.**
   The app works on its own address; it does not need the microfrontends group. Submit
   anything once: the form must say "Admin sign-in is not switched on yet". That proves
   the app reaches the API. ("This app has no API configured" means `BACKEND_URL` is
   missing; set it and redeploy.)
3. **Set `ADMIN_PASSWORD_HASH` on Railway.** Pick a long random password and keep it in
   a password manager. In a terminal on your own machine run:

   ```bash
   htpasswd -nBC 12 psachan
   ```

   It asks for the password twice (nothing is echoed or saved in shell history) and
   prints `psachan:$2y$12$…`. The hash is everything **after the colon**. Paste it as
   `ADMIN_PASSWORD_HASH` on the Railway service `personal-web-app-api` (Variables) and
   let the service redeploy. Put the hash nowhere else: not in the repository, a `.env`
   file, Vercel, a chat or an issue. `ADMIN_USERNAME` is already `psachan`.
4. **Sign in** at `/admin/login` as `psachan` with that password. The inbox should list
   the stored contact messages; mark one read and back to check writes work.
5. **Optional: serve it at `justcallmepratt.dev/admin`.** Needs the microfrontends group
   ([Microfrontends](#microfrontends-kafka-and-admin)) with `frontend` as the default
   application. Add the `admin` project to the group, then add this entry under
   `applications` in `frontend/microfrontends.json`, after `frontend`, and deploy `frontend`:

   ```json
   "admin": {
     "routing": [{ "paths": ["/admin", "/admin/:path*"] }]
   }
   ```

   Then redeploy `admin` so its assets get their own prefix, and check
   `https://justcallmepratt.dev/admin/login`. Sign in again there: the session cookie
   belongs to one address. To undo, remove the entry and redeploy `frontend`.

**Cost.** One more Vercel project on the `*.vercel.app` address costs nothing extra.
For step 5, per the note under
[the Kafka checklist](#if-you-want-the-separate-kafka-project-later), the plan includes
two microfrontends projects: `frontend` and `admin` fit, and a third (a separate `kafka`
project) would be billed extra. Confirm Vercel's current microfrontends pricing before
doing step 5; skipping it keeps the footprint smallest.

**Sign-in limits (API, since PR #73).** After 5 failed sign-ins from one address, or 30
from everyone, within 15 minutes, the API answers 429 with `Retry-After` and the form
says "Too many sign-in attempts … try again in about 15 minutes" and locks until then.
The API sees the admin app's Vercel address, not yours, so failed attempts by anyone
count against the same limit: a stranger guessing passwords can lock sign-in for up to
15 minutes. Waiting is the only fix; a correct sign-in is refused too while it lasts.

### How the app behaves

- **The browser only talks to this app.** The handlers call the API server-side with
  `BACKEND_URL`; the API address never reaches the browser. The API's JWT is kept in an
  `httpOnly`, `secure`, `sameSite=strict` cookie scoped to `/admin`; it expires with the
  token (24 h, `jwt.expiry-ms` in the backend).
- Every API call has an 8 s timeout and every browser request to the app a 15 s one; the
  login handler refuses bodies over 4 KB; nothing is cached.
- The form asks for a username and a password; neither is built into the app.

| Situation | What the owner sees |
|---|---|
| `BACKEND_URL` not set | Login and inbox say no API is configured (503) |
| `ADMIN_PASSWORD_HASH` not set on the API (503 "Admin not configured") | "Admin sign-in is not switched on yet … This is not a wrong password." |
| Wrong username or password (401) | "Wrong username or password." |
| Too many failed sign-ins (429) | "Too many sign-in attempts", the wait from `Retry-After` (15 minutes if absent, capped at an hour), button locked until then. The app also stops forwarding sign-ins to the API for that time (per server instance) |
| Token expired or rejected on any call (401/403) | Cookie cleared, back to login with "Your session has expired" |
| API host answers 502 / 503 / 504 (restarting, deploying) | "The API is temporarily unavailable"; the session is kept, **Refresh** retries |
| API unreachable / slower than 8 s / not the expected JSON | "could not be reached" (502) / "took too long" (504) / "response this app could not read" (502); the session is kept |
| The app itself does not answer within 15 s, or the network drops | "The admin app took too long to answer" / "Could not reach the admin app" |
| Message deleted before it is toggled (404) | Removed from the list |
| Oversized or malformed login request, request from another origin | Rejected by `admin` (413 / 400 / 403) without calling the API |

**Checked on 2026-11-21.** Against the live API, through the app run locally: the login
page loads and one dummy sign-in shows the "not switched on yet" message; the API
answers 403 to the inbox endpoints without a token. Everything after a successful
sign-in (inbox, mark read, expiry, 429, outages) has only been run against a local
stand-in for the API and in the unit tests, because no admin password exists yet.

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
| The same, when `/resume` or `/resume.pdf` is re-rendered | Both render from `src/content`, like every page. API rows with missing or wrongly typed fields are dropped, a section with no entries is left out, and if the live content still cannot be laid out the PDF is generated from `src/content` (warning logged) |
| Resume text that is very long, has no spaces, or uses characters outside Latin-1 | The PDF wraps it (splitting an unbroken string between characters), continues on another page, and replaces unsupported characters with a plain equivalent or `?`; the page wraps it with CSS |
| GitHub unreachable, slow (5 s), rate limited, 404, 5xx, bad JSON or no public repos | The GitHub activity section shrinks to a link to the profile; build and page still succeed |
| API down, or relay slower than 4 s / 5xx / non-JSON, when the form is submitted | Falls back to SMTP if `MAIL_USER` / `MAIL_PASS` are set (warning logged); otherwise 503 and the `mailto:` link |
| API answers 4xx (validation, 429) | Passed to the visitor; no fallback |
| SMTP rejects (bad app password, etc.) or takes over 10 s | 502, logged as `undeliverable`; the form offers the `mailto:` link |
| `NEXT_PUBLIC_CONTACT_EMAIL` unset or malformed | No `mailto:` link or "email me directly" line |
| A suggestion is accepted after its target was edited some other way | The API refuses with 409 and applies nothing; the admin page shows the value on the site now. Reject it and make a new one |
| A suggestion's target row was deleted, or the suggestion was already decided | 409 with the reason; nothing changes |
| Market research variables missing, or a data file unreadable | The API starts normally; one log line says the job is disabled and why; the manual trigger answers 409 `disabled` |
| Adzuna is down, slow (5 s connect, 10 s read), rate limiting (429) or erroring (5xx) | Each request is tried up to 3 times with a growing wait (a `Retry-After` header is honoured up to 60 s); then the run fails, is logged as `FAILED`, stores no counts, and the previous summary stays |
| Adzuna refuses the key (401, 403 or its 410 "Authorisation failed") | No retry; the run fails and the log says to check `ADZUNA_APP_ID` and `ADZUNA_APP_KEY`. The key never appears in a log line or in the stored error |
| The weekly run and a manual trigger arrive together, or the trigger is sent twice | The second is refused (409 `already_running`) or skipped; one row per week in the database either way |
| The same week is run again | Nothing is fetched; suggestions already pending or rejected are not repeated |
| Too few listings for a role in a week (fewer than 30 by default), or no profile row | The counts are stored and shown per role; that role produces no suggestion |
| A title fits both roles ("Forward Deployed Software Engineer") | It counts once, for the role whose matching variant is longest (forward deployed engineer) |
| The API restarts at the scheduled minute, or mid-run | That week's run is missed or lost (nothing half-written: counts are saved in one transaction at the end). Trigger it by hand, or wait a week |
| API down or slow while using `/admin/suggestions` | The page stays signed in, says why, and offers Refresh; no decision is half-applied (accept is one transaction) |
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
  by the two unused Vercel projects; delete them after the projects ([item 1](#outstanding-work)).
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
