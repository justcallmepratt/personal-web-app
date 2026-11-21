# Roadmap

Plan and status for the site, last updated 2026-11-21. Evidence and sources are in
[RESEARCH.md](RESEARCH.md); how things are deployed, and the ordered list of outstanding
operations steps, is in [DEPLOYMENT.md](DEPLOYMENT.md); the original phase briefs are in
[`docs/agents/`](agents/ORCHESTRATOR.md) and are not rewritten, only given a status block.

The site is a portfolio: its job is to make a recruiter or hiring manager think "this
person can ship, and I can reach them". Work is judged against that.

## Done

- **Live on the domain** `justcallmepratt.dev` (Vercel, `www` redirects to it).
- **Phase 10 / WP-C:** `/credits`, the unofficial-fan-work disclaimer and a footer.
- **WP-A SEO and social, WP-B accessibility and motion** (PR #61): canonical URLs,
  `robots.txt`, `sitemap.xml`, generated Open Graph image, per-page metadata, minimal
  JSON-LD; reduced motion, focus styles, AA contrast, skip link, live regions. Not done
  from the package: a custom `not-found` page, and no Lighthouse scores were recorded.
- **WP-E real content** (PR #67): the owner's real profile in `frontend/src/content/index.ts`,
  `/certifications`, and an "In the works" list of planned projects on `/projects`.
- **Resume** (replaces the "real `cv.pdf`" item): a `/resume` page and a `/resume.pdf`
  generated from the same content as the rest of the site, so there is no CV file to
  maintain; "Download CV" links to it. `education` and `leadership` were added to the
  content file, and `/certifications` gained an Education section.
- **Phase 15 / WP-G:** replaced by a GitHub activity section on the home page.
- **Contact fallback** (PR #66): SMTP fallback when the API is down, `mailto:` path,
  delivery logs. Needs the Vercel variables in [DEPLOYMENT.md](DEPLOYMENT.md).
- **Kafka live demo** at `/projects/kafka`, its only home; `/kafka` redirects there
  (PR #74). `apps/kafka` is built and kept for later, not deployed and not planned (a
  third Vercel microfrontends project is a paid extra; checklist in
  [DEPLOYMENT.md](DEPLOYMENT.md#if-you-want-the-separate-kafka-project-later)).
- **Admin app** `apps/admin`: ready (PR #75), handles every answer the live API gives;
  not deployed, and sign-in is off until `ADMIN_PASSWORD_HASH` is set.
- **Admin sign-in rate limiter** (PR #73): 5 failed attempts per client address and 30
  overall per 15 minutes, then 429 with `Retry-After`.
- **Backend deployed on Railway** (`personal-web-app-api`), healthy, and read by the
  production site (`BACKEND_URL`) with `frontend/src/content/index.ts` as the fallback;
  the database holds the real profile, projects and experience.
- **Content suggestions, the foundation** (PR #78): suggest-and-approve for profile,
  experience and project content. Tools may only propose; a change reaches the site when
  the owner accepts it at `/admin/suggestions` (before/after view, conflict check, history).
  Suggestions are created by hand for now. Needs the one-time migration in
  [DEPLOYMENT.md](DEPLOYMENT.md#content-suggestions-run-the-migration-before-merging)
  run before the merge. Accepted changes show within the hour;
  `frontend/src/content/index.ts` (the fallback) is not updated by it.
- **Weekly market research (WP-L, replaces phase 12 as written):** a weekly job in the API
  reads software-developer listings (Adzuna) at an allow-list of companies that are on the
  Fortune 500 and own a FINRA member broker-dealer, counts the skills they mention
  against a dictionary in the repository, stores the weekly counts, and proposes common
  skills that are missing from the profile as suggestions (source `market-research`). It
  never edits content and never words a claim: each suggestion asks the owner to accept
  only if they have that experience. Built and **off**: needs the one-time migration in
  [DEPLOYMENT.md](DEPLOYMENT.md#market-research-run-the-migration-before-merging) before
  the merge, then Adzuna keys and a flag on Railway. Not run against the real API yet.
- **Backend persistence tests** against real PostgreSQL in the required backend CI job;
  branch protection requires the backend, frontend and admin jobs.

## Next, in order

1. The operations checklist in [DEPLOYMENT.md](DEPLOYMENT.md#outstanding-work): delete the
   two unused Vercel projects, turn on admin, turn on contact email, attach
   `api.justcallmepratt.dev`, fix the stale API-project row and `SeedRunner`, decide on
   Dependabot PR #38.
2. **Resume follow-ups (owner):** confirm the graduation date (then set `year` on the
   education entry), the education and leadership wording, and whether a GitHub link
   should join LinkedIn in `profile.socials`. The resume itself is done: see below.
3. **WP-D Vercel Web Analytics** (decided; not added).
4. **Security follow-ups** below.
5. **WP-H ops hardening** (Supabase keep-alive, uptime check, backup of the `messages`
   table, secret-rotation notes, Lighthouse baseline).
6. **WP-F case-study projects.**
7. **Turn on the weekly market research** (built, off): register for Adzuna keys and set
   three variables on Railway ([steps](DEPLOYMENT.md#turn-on-market-research)), run it
   once by hand, fix the allow-list names the first log flags, and decide whether CBRE
   and JLL count. Needs admin live, for the manual trigger and to decide suggestions.
8. **WP-J monorepo move**, later, in a quiet window.
9. **WP-M suggestion sources**, later: automatic sources that write to the suggestions
   pipeline and nothing else (see Work packages).

## Security follow-ups

Checked against the repository, the live API and code scanning on 2026-11-21. No owner yet.

**Done**
- **Admin sign-in rate limiter** (PR #73, `LoginRateLimiter`): failed sign-ins are limited
  in the Spring app, so `ADMIN_PASSWORD_HASH` can be set.
- **`java/log-injection` alerts**: none open in code scanning any more.

**Open**
1. **Swagger behind GitHub sign-in (decided, not built).** The Swagger UI
   (`/swagger-ui/index.html`) and `POST /api/admin/auth/login` on the Railway API are
   public (`SecurityConfig` permits both). The owner's decision: Swagger is reachable only
   after signing in with GitHub, as the owner's account (`justcallmepratt`). Needs: Spring
   Security OAuth2 login with GitHub protecting `/swagger-ui/**` and `/v3/api-docs/**`;
   an allow-list of one GitHub login; a GitHub OAuth App created by the owner, with its
   client ID and secret set as variables on the Railway `personal-web-app-api` service;
   and a callback URL on the API's public address. **Open question:** should the same
   GitHub sign-in replace the username-and-password admin login?
2. **The login limiter keys on the caller's address.** For sign-ins made through the admin
   app that is Vercel's address, so anyone's failed attempts can lock the owner out for up
   to 15 minutes. Options if that bites: pass the visitor's address from the admin app in
   a way the API can trust, a shared secret so only Vercel can call the API, or an edge
   proxy in front of the API only (not the Vercel site).
3. **No Content-Security-Policy** header on the site; the other standard security headers
   are sent from `frontend/vercel.json`.
4. **Contact-form rate limiting is per server instance** (in-memory in both the API and
   the site), so it slows casual abuse but is not a hard cap.
5. **Two expected CodeQL alerts**, candidates to dismiss with a reason:
   `java/spring-disabled-csrf-protection` (stateless JWT API) and
   `js/empty-password-in-configuration-file` (the test profile). Other open alerts are
   lint-level (`java/deprecated-call`, `java/unused-parameter`, CSS/SQL style rules).

## Phases

| Phase | Status | Notes |
|---|---|---|
| 7 Polish | Partly done | Accessibility, reduced motion, SEO and real OG image shipped (WP-A, WP-B). The CV (7-G) is now the generated `/resume.pdf`. Still open: custom 404, Lighthouse baseline. Typewriter, hover glitch and particle field are skipped. |
| 8 Analytics | Decided, not started | Vercel Web Analytics instead of Amplitude (no key, no cookies, no extra project). WP-D. |
| 9 Spotify | Dropped | Third-party music and brand question; logged-out visitors get a 30 s preview. |
| 10 Credits | Done | WP-C. |
| 11 Job tracker | Dropped | Owner uses the external tool [JobSync](https://github.com/Gsync/jobsync), run separately; nothing from this phase is in the repository. |
| 12 Market research | Replaced; built, off | The brief (nightly pull, salary table, insights page) was not built. In its place: a weekly pull for allow-listed firms only, counts only, results as suggestions the owner decides (WP-L). Off until the owner sets the Adzuna keys and the flag. |
| 13 Resume updater | Dropped as written; replaced | The brief applied changes too freely. Its useful part is rebuilt as content suggestions (done, PR #78): nothing is applied without the owner's accept. Automatic sources are WP-M. |
| 14 LinkedIn sync | Dropped | Content was updated by hand in WP-E. |
| 15 Benchmarking | Done, redesigned | Built as the GitHub activity section (WP-G); peers, table and backend endpoints were never built. |
| 16 Pro-dev dashboard | Dropped | Depended on 12 and 15 as written. |
| 17 Production | Reduced, partly done | Domain, Git deploys, CI and the Railway deployment exist. Open: WP-H items and turning on admin (WP-I). |

## Work packages

| Pkg | Status | Remaining scope |
|---|---|---|
| WP-A SEO and social | Done (PR #61) | Custom `not-found`; Lighthouse before/after. |
| WP-B Accessibility and motion | Done (PR #61) | Check `GlitchText` with VoiceOver (unconfirmed); 24 px minimum targets for small links; no form honeypot. |
| WP-C Credits and disclaimer | Done | none |
| WP-D Vercel Web Analytics | Decided, not started | Add `@vercel/analytics` once to the layout; owner turns it on in the dashboard and confirms plan cost. |
| WP-E Real content and CV | Mostly done | The CV is the generated `/resume.pdf` (no file, `cvUrl` unused). `SeedRunner` still seeds the old persona, and the database row for the site's own project still says the API is not deployed (see DEPLOYMENT.md). |
| WP-F Case-study projects | Not started | Problem, role, decisions, outcome per project; `/projects/[slug]`; a "How this site is built" entry. New fields optional in `types.ts`. |
| WP-G GitHub activity | Done | none |
| WP-H Ops hardening | Not started | Weekly keep-alive touching the database, uptime check, `messages` export, secret-rotation notes, Lighthouse baseline. |
| WP-I Admin deploy | Ready, waiting on the owner | The app handles every answer the live API gives (sign-in off, wrong password, rate limit, expired session, outages) and runs on its own Vercel address without the microfrontends group. Checked against the live API as far as possible without a password (2026-11-21). Remaining, owner only: [Turn on admin](DEPLOYMENT.md#turn-on-admin) (create the Vercel project, set `ADMIN_PASSWORD_HASH`, sign in); optional `/admin` route on the main domain (`frontend/microfrontends.json` lists only `frontend` today). Username `psachan`; rate limits 5 per client and 30 overall per 15 minutes. |
| WP-J Monorepo move | Later | `frontend/` to `apps/web`, shared UI package and API types, one TypeScript version (6 in `apps/admin`, 5 in `frontend`), update workflows, Dockerfile, Vercel root directory. Collides with any concurrent change under `frontend/`. |
| WP-K Job tracker | Dropped | Replaced by JobSync. |
| WP-M Suggestion sources | Later, not started | Sources that create suggestions through `POST /api/admin/suggestions` with their own `source` value; none may write content directly. **JobSync** (`jobsync`): the owner's separately run job tracker; not installed and no integration exists. **Market research** (`market-research`): done as WP-L; it runs inside the API, so it needs no credential. An outside source still needs a way to call the API without the owner's browser session (a scoped credential, not built), and rules against overstating: suggestions must be grounded in facts the owner has confirmed. |
| WP-L Market research | Built, off, waiting on the owner | Owner: run the migration before merging, register for Adzuna keys, set `MARKET_RESEARCH_ENABLED`, `ADZUNA_APP_ID`, `ADZUNA_APP_KEY` on Railway ([DEPLOYMENT.md](DEPLOYMENT.md#turn-on-market-research)). Then: check Adzuna's real rate limits in the dashboard, correct allow-list search names after the first run (never checked against Adzuna), decide on CBRE and JLL, review the list yearly. Not built: a page for the summary in the admin app (the API has `GET /api/admin/market-research/latest`), trends across weeks, salaries. Databricks is deferred. |

## Decisions

| # | Decision | Status | Answer |
|---|---|---|---|
| 1 | Real portfolio under the real name, or a persona? | **Answered** | Real name and history; Cyberpunk look as styling only. |
| 2 | Real content, links and CV | **Answered** | Content and certifications are in. No CV file is needed: `/resume.pdf` is generated from the content. Open: the graduation date. |
| 3 | Analytics | **Answered** | Vercel Web Analytics, not Amplitude. Not added yet. |
| 4 | Cyberpunk branding | **Answered** | Look kept with the unofficial-fan-work disclaimer on `/credits` and in the footer; game-corp names gone with the real content; soundtrack dropped. |
| 5 | Private tools | **Answered** | Job tracker: no (JobSync). Market research: built as a weekly, suggestions-only job (WP-L), off until the owner turns it on. |
| 6 | Railway Hobby plan for the backend | **Answered** | Deployed. Cost of an always-on JVM is unconfirmed (RESEARCH.md 2.4); check Railway's usage estimate and set a spend limit. |
| 7 | Contact fallback while the API is offline | **Answered** | Built (`mailto:` plus SMTP fallback). Needs `NEXT_PUBLIC_CONTACT_EMAIL` and the mail variables set on Vercel. |
| 8 | Monorepo move timing | **Answered** | Later, in a quiet window (WP-J). |
| 9 | Databricks for phase 12 | **Answered** | Deferred; never on the path of a public page. |
| 10 | Spotify | **Answered** | Dropped. |
| 11 | Public GitHub comparison page | **Answered** | Replaced by the GitHub activity section (done). |
| 12 | `Admin — Node 22 / pnpm` as a required check | **Answered** | Already required. |
| 13 | Make `Kafka — Node 22 / pnpm` a required check | **Open** | Runs on every PR but is not required. |
| 14 | How tools may change resume and profile content | **Answered** (2026-11-21) | Suggest-and-approve only: tools propose, nothing is public until the owner accepts it in the admin app. |
| 15 | Which companies market research looks at | **Answered** (2026-11-21) | Software-developer roles in financial services, only at companies that are both on the Fortune 500 and FINRA-regulated (they are, or own, a FINRA member broker-dealer). The list and its evidence: `backend/src/main/resources/market/allow-list.json`. |
| 16 | Do CBRE Group and Jones Lang LaSalle count? | **Open** | Both meet the two tests in decision 15 but are real-estate companies. Switched off in the allow-list until decided. |
