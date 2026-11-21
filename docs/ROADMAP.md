# Roadmap

Plan and status for the site, last updated 2026-11-20. Evidence and sources are in
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
- **Phase 15 / WP-G:** replaced by a GitHub activity section on the home page.
- **Contact fallback** (PR #66): SMTP fallback when the API is down, `mailto:` path,
  delivery logs. Needs the Vercel variables in [DEPLOYMENT.md](DEPLOYMENT.md).
- **Kafka live demo** at `/projects/kafka`, its only home; `/kafka` redirects there. The
  `apps/kafka` micro-frontend is built but not deployed and not planned (a third Vercel
  microfrontends project is a paid extra; checklist in
  [DEPLOYMENT.md](DEPLOYMENT.md#if-you-want-the-separate-kafka-project-later)). The
  `admin` micro-frontend `apps/admin` is built, not deployed.
- **Backend deployed on Railway** (`personal-web-app-api`), healthy, and used by the production site (`BACKEND_URL`); the database holds the real profile, projects and experience.
- **Backend persistence tests** against real PostgreSQL in the required backend CI job;
  branch protection requires the backend, frontend and admin jobs.

## Next, in order

1. The operations checklist in [DEPLOYMENT.md](DEPLOYMENT.md#outstanding-work): the API
   domain, `ADMIN_PASSWORD_HASH`, contact email (mail variables on Railway), the Vercel
   `admin` project and group, deleting two unused Vercel projects, and the
   `SeedRunner` and content-file description fixes.
2. **WP-E leftovers:** the owner's real `cv.pdf` (none exists; the button is hidden until
   `profile.cvUrl` is set).
3. **WP-D Vercel Web Analytics** (decided; not added).
4. **WP-H ops hardening** (the site now uses the API) (Supabase keep-alive, uptime check,
   backup of the `messages` table, secret-rotation notes, Lighthouse baseline).
5. **WP-F case-study projects.**
6. **WP-J monorepo move**, in a quiet window.
7. **WP-L market research (phase 12)**, wanted, after the backend and admin are live.

## Security follow-ups

Not started; no owner yet. Noted 2026-11-20 and checked against the repository and the
live API that day.

1. **API surface.** On the Railway API, the Swagger UI (`/swagger-ui/index.html`, answers
   200) and `POST /api/admin/auth/login` are public (`SecurityConfig` permits both), and
   login attempts are not rate limited. Add a rate limiter (in the Spring app, or an edge
   or load-balancer layer) in front of admin login **before** `ADMIN_PASSWORD_HASH` is
   set. Options for the login limiter: rate limiting in the app; requiring a shared secret
   from the site so only Vercel can call the API; an edge proxy such as Cloudflare in
   front of the API only, not the Vercel site.

   **Decided (owner):** Swagger must only be reachable after signing in with GitHub, and
   only as the owner's account (`justcallmepratt`). Needs, none of it built yet: Spring
   Security OAuth2 login with GitHub protecting `/swagger-ui/**` and `/v3/api-docs/**`;
   an allow-list of one GitHub login; a GitHub OAuth App created by the owner, with its
   client ID and client secret set as variables on the Railway `personal-web-app-api`
   service; and a callback URL on the API's public address. **Open question:** should the
   same GitHub sign-in replace the username-and-password admin login?
2. **No Content-Security-Policy** header on the site; the other standard security headers
   are sent from `frontend/vercel.json`.
3. **Contact-form rate limiting is per server instance** (in-memory in both the API and
   the site), so it slows casual abuse but is not a hard cap.
4. **Code scanning.** Five `java/log-injection` alerts (`RateLimitService`,
   `EmailValidationService`) are still open after the fix in PR #56. Two expected alerts,
   `java/spring-disabled-csrf-protection` (stateless JWT API) and
   `js/empty-password-in-configuration-file` (test profile), are candidates to dismiss
   with a reason.
5. **Two unused Vercel projects** (`personal-web-app`, `backend`) still build on every
   pull request; delete them ([DEPLOYMENT.md](DEPLOYMENT.md#outstanding-work)).

## Phases

| Phase | Status | Notes |
|---|---|---|
| 7 Polish | Partly done | Accessibility, reduced motion, SEO and real OG image shipped (WP-A, WP-B). Still open: real CV (7-G), custom 404, Lighthouse baseline. Typewriter, hover glitch and particle field are skipped. |
| 8 Analytics | Decided, not started | Vercel Web Analytics instead of Amplitude (no key, no cookies, no extra project). WP-D. |
| 9 Spotify | Dropped | Third-party music and brand question; logged-out visitors get a 30 s preview. |
| 10 Credits | Done | WP-C. |
| 11 Job tracker | Dropped | Owner uses the external tool [JobSync](https://github.com/Gsync/jobsync), run separately; nothing from this phase is in the repository. |
| 12 Market research | Wanted, not started | Weekly Adzuna pull, admin-only, simple scheduler (RESEARCH.md 2.4). Needs backend and admin deployed, Adzuna keys. WP-L. |
| 13 Resume updater | Dropped | The redeploy hook is unnecessary and market-driven edits invite overstating. |
| 14 LinkedIn sync | Dropped | Content was updated by hand in WP-E. |
| 15 Benchmarking | Done, redesigned | Built as the GitHub activity section (WP-G); peers, table and backend endpoints were never built. |
| 16 Pro-dev dashboard | Dropped | Depended on 12 and 15 as written. |
| 17 Production | Reduced, partly done | Domain, Git deploys, CI and the Railway deployment exist. Open: WP-H items and the admin deploy (WP-I). |

## Work packages

| Pkg | Status | Remaining scope |
|---|---|---|
| WP-A SEO and social | Done (PR #61) | Custom `not-found`; Lighthouse before/after. |
| WP-B Accessibility and motion | Done (PR #61) | Check `GlitchText` with VoiceOver (unconfirmed); 24 px minimum targets for small links; no form honeypot. |
| WP-C Credits and disclaimer | Done | none |
| WP-D Vercel Web Analytics | Decided, not started | Add `@vercel/analytics` once to the layout; owner turns it on in the dashboard and confirms plan cost. |
| WP-E Real content and CV | Mostly done | Real `cv.pdf` and `cvUrl`; `SeedRunner` still seeds the old persona and the project description in `content/index.ts` still says the API is not deployed (see DEPLOYMENT.md); the database itself holds the real content. |
| WP-F Case-study projects | Not started | Problem, role, decisions, outcome per project; `/projects/[slug]`; a "How this site is built" entry. New fields optional in `types.ts`. |
| WP-G GitHub activity | Done | none |
| WP-H Ops hardening | Not started | Weekly keep-alive touching the database, uptime check, `messages` export, secret-rotation notes, Lighthouse baseline. The site is on the API now. |
| WP-I Admin deploy | Partly done | `withMicrofrontends` is in `frontend`; `microfrontends.json` lists only `frontend` (the `kafka` route was removed, `/kafka` redirects to `/projects/kafka`). Remaining: the `admin` route in `frontend/microfrontends.json` after the owner creates the project and group; verify `/admin/login` against the real API. |
| WP-J Monorepo move | Later | `frontend/` to `apps/web`, shared UI package and API types, one TypeScript version (6 in `apps/admin`, 5 in `frontend`), update workflows, Dockerfile, Vercel root directory. Collides with any concurrent change under `frontend/`. |
| WP-K Job tracker | Dropped | Replaced by JobSync. |
| WP-L Market research | Wanted, not started | Adzuna client, weekly scheduler, table in `supabase/init.sql` and `PostgresPersistenceTest`, admin insights page. Databricks is deferred. |

## Decisions

| # | Decision | Status | Answer |
|---|---|---|---|
| 1 | Real portfolio under the real name, or a persona? | **Answered** | Real name and history; Cyberpunk look as styling only. |
| 2 | Real content, links and CV | **Answered** (CV open) | Content and certifications are in. The CV file has not been provided. |
| 3 | Analytics | **Answered** | Vercel Web Analytics, not Amplitude. Not added yet. |
| 4 | Cyberpunk branding | **Answered** | Look kept with the unofficial-fan-work disclaimer on `/credits` and in the footer; game-corp names gone with the real content; soundtrack dropped. |
| 5 | Private tools | **Answered** | Job tracker: no (JobSync). Market research: wanted (phase 12). |
| 6 | Railway Hobby plan for the backend | **Answered** | Deployed. Cost of an always-on JVM is unconfirmed (RESEARCH.md 2.4); check Railway's usage estimate and set a spend limit. |
| 7 | Contact fallback while the API is offline | **Answered** | Built (`mailto:` plus SMTP fallback). Needs `NEXT_PUBLIC_CONTACT_EMAIL` and the mail variables set on Vercel. |
| 8 | Monorepo move timing | **Answered** | Later, in a quiet window (WP-J). |
| 9 | Databricks for phase 12 | **Answered** | Deferred; never on the path of a public page. |
| 10 | Spotify | **Answered** | Dropped. |
| 11 | Public GitHub comparison page | **Answered** | Replaced by the GitHub activity section (done). |
| 12 | `Admin — Node 22 / pnpm` as a required check | **Answered** | Already required. |
| 13 | Make `Kafka — Node 22 / pnpm` a required check | **Open** | Runs on every PR but is not required. |
