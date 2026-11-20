# Roadmap

Prioritised plan for the site, written 2026-11-20 after reviewing the live site and the
remaining phase briefs (7 to 17). Evidence and sources are in [RESEARCH.md](RESEARCH.md);
how things are deployed is in [DEPLOYMENT.md](DEPLOYMENT.md); the original briefs are in
[`docs/agents/`](agents/ORCHESTRATOR.md) and are **not** rewritten, only annotated.

## Summary

The site is a portfolio, so its job is to make a recruiter or hiring manager think "this
person can ship, and I can reach them". Today it fails that for reasons that have nothing
to do with the phase list: all content is placeholder (fictional employers, fake project
links, a blank CV), the contact form is offline, and link previews point at the wrong
domain. Most of the remaining phases (11 to 16) are private tooling or comparison
features that add no visitor value, and several rest on assumptions that no longer hold
(Railway Postgres, Amplitude, an upload-and-diff LinkedIn flow, ranking against famous
developers).

So the plan is: **fix the foundation first, ship the small high-value items that need no
backend and no new accounts, deploy the backend, then decide whether any of the private
tools are worth building.** Of the eleven phases, three are worth doing now (7, 10, and 17
in reduced form), two are worth doing in a redesigned form (8 as Vercel Web Analytics, 15
as a build-time GitHub section), two are worth doing only after the backend is live and
the owner confirms they want them (11, 12), and four should be dropped or folded into
something simpler (9, 13, 14, 16).

### Recommended order

1. **Owner, no code (this week):** set `NEXT_PUBLIC_SITE_URL`, leave `BACKEND_URL` unset
   until the API is live, delete the two dead Vercel projects, and hand over the real
   content and CV (see [Decisions](#decisions-needed-from-the-owner)).
2. **Start today, in parallel, frontend only, no backend, no new accounts:** WP-A SEO and
   social metadata, WP-B accessibility and motion, WP-C credits page and disclaimer, WP-D
   Vercel Web Analytics (if the owner agrees). Details in [Work packages](#independent-work-packages).
3. **When real content arrives:** WP-E real content and CV, then WP-F case-study projects,
   and WP-G the GitHub activity section.
4. **Deploy the backend on Railway** (owner, using the DEPLOYMENT.md steps), then WP-H
   (keep-alive and uptime check) and WP-I (admin Vercel project and microfrontends group).
5. **Monorepo move (WP-J):** in a quiet window, after steps 2 and 3 have merged, and
   before any shared-package work or new admin pages.
6. **Only then**, if wanted: job tracker (phase 11), then market research (phase 12, with
   an optional Databricks learning exercise).
7. **Drop:** phases 9 (as a feature), 13, 14 and 16 as written.

### Top five recommendations

1. Replace placeholder content with real content and a real CV before building anything else.
2. Fix social previews and crawlability now: set `NEXT_PUBLIC_SITE_URL`, add a real OG
   image, `robots`, `sitemap`, per-page metadata (WP-A).
3. Fix accessibility basics: reduced-motion support, focus styles, contrast of `cp-red`
   and `cp-muted`, skip link, form status announcements (WP-B).
4. Use Vercel Web Analytics instead of Amplitude (smaller footprint, no cookies), and
   drop the Spotify, benchmark-against-celebrities, resume-auto-updater and LinkedIn-upload features.
5. Deploy the backend on Railway and create the `admin` Vercel project before building any
   admin feature; keep new admin features inside the existing `admin` app (a third
   Vercel microfrontends project is probably a paid extra).

## Decisions needed from the owner

| # | Decision | Why it matters | My recommendation |
|---|---|---|---|
| 1 | Is the site your real portfolio under your real name, or a persona ("V")? | Drives all content, metadata and the legal posture. A persona with fake employers cannot be used for job hunting. | Real name and real history; keep the Cyberpunk look as styling only. |
| 2 | Provide real content: bio, roles, 3 to 5 projects (with problem, your role, outcome, links), real links, a CV PDF, optionally a photo | Blocks WP-E, WP-F and every claim on the site | Do this first. A rough draft in `frontend/src/content/index.ts` is enough to start. |
| 3 | Analytics: Vercel Web Analytics, Amplitude, or none | Phase 8 | Vercel Web Analytics. Confirm Pro pricing for events in the dashboard. |
| 4 | Cyberpunk branding: keep the look and "Night City" copy? Keep game-corp names anywhere? Keep or drop the soundtrack? | Brand and fan-guideline risk (see RESEARCH.md 2.6) | Keep the look, add the unofficial-fan-work disclaimer, remove game-corp names once real jobs are in, drop the soundtrack (phase 9). |
| 5 | Do you want private tools (job tracker, market research) at all? | Phases 11 to 16 are tools for you, not for visitors, and each adds backend, schema, admin pages and upkeep | Decide after the backend is live. Build 11 only if you will actually use it. |
| 6 | Railway: go ahead with the Hobby plan and deploy the backend? Cost of an always-on JVM is unconfirmed (RESEARCH.md 2.4) | Unblocks the contact form, admin app and all later phases | Yes, but check Railway's usage estimate first and set a spend limit. |
| 7 | Contact fallback while the API is offline: show your email address (or a `mailto:`) on the contact page? | A recruiter currently has no way to reach you | Yes; it is a one-line change in WP-E. |
| 8 | Monorepo move timing (`frontend/` to `apps/web`) | It renames every frontend path and conflicts with anyone else editing `frontend/src` | After WP-A to WP-G merge, announced in advance. |
| 9 | Databricks for phase 12's analysis? | Free Edition is non-commercial, has no SLA and its apps stop every 24 h | Yes as an optional learning exercise after phase 12 works without it; never on the path of a public page. |
| 10 | Spotify: drop, or keep as a click-to-load embed? | Logged-out visitors get a 30 s preview; third-party music; the fan-guideline music paragraph is ambiguous | Drop. Revisit only if you want it for personality, and ask `legal@cdprojektred.com` first. |
| 11 | Public GitHub comparison page (phase 15) | Ranking yourself against famous developers is unflattering and not a hiring signal | Replace with a "my GitHub activity" section (WP-G). |
| 12 | Make `Admin — Node 22 / pnpm` a required CI check? | It is the only CI job not required for merge | Yes, once the admin app is deployed. |

## Prerequisites that are not phases

These block value. Several are manual and only the owner can do them.

| Prerequisite | Who | Effort | Notes |
|---|---|---|---|
| **Real content** replacing the placeholder in `frontend/src/content/index.ts`; real `cv.pdf`; real OG image | Owner provides, session implements (WP-E) | S for code, owner time for writing | The single biggest value item. `cv.pdf` is currently a blank page (RESEARCH.md Part 1). |
| **Vercel env fixes on `frontend`:** set `NEXT_PUBLIC_SITE_URL=https://justcallmepratt.dev`; remove `NEXT_PUBLIC_API_URL`; leave `BACKEND_URL` unset until the API is live (saves a 5 s timeout per page per build) | Owner (dashboard) | 5 minutes | Fixes the wrong `og:image` host immediately. Already listed in DEPLOYMENT.md. |
| **Delete the Vercel projects `personal-web-app` and `backend`** and the matching GitHub environments | Owner | 5 minutes | Footprint and clutter. |
| **Deploy the backend on Railway** | Owner, following DEPLOYMENT.md "Railway setup" | M | Needed for the contact form, admin app and phases 11 to 16. Until then the contact form says "channel offline". |
| **Create the `admin` Vercel project and microfrontends group**, then add `frontend/microfrontends.json` and `withMicrofrontends` | Owner (dashboard) then a session (WP-I) | M | Order and steps are in DEPLOYMENT.md "Vercel setup (by hand, in this order)". Needs the backend live to be useful. |
| **Monorepo move:** `frontend/` to `apps/web`, shared UI package, shared API types | A session (WP-J) | M to L | Collides with every concurrent change under `frontend/`; do it in a quiet window. Also settle the TypeScript version (6 in admin, 5 in frontend) and update Vercel's root directory. |
| **Backend test gap:** H2 cannot create `JSONB` tables, so profile/projects/experience entities are not exercised against a real schema in CI | A session | S to M | Fix before adding any phase that adds tables. |
| **Supabase pause protection** and a note on backups | Owner/session (WP-H) | S | Free projects pause after about 7 days of inactivity and have no automatic backups (RESEARCH.md 2.4). |

## Per-phase plan

Value is judged against the site's purpose: helping a recruiter or hiring manager decide
and contact. Effort: S under a day, M one to three days, L about a week or more.

| Phase | Goal (one line) | Value | Effort | Depends on | Where it lives now | What changes from the May brief | Recommendation |
|---|---|---|---|---|---|---|---|
| **7 Polish** | Finish visual animations and run a Lighthouse audit | **High** for the audit, real CV/OG and accessibility; **low** for typewriter, particle field and hover glitch, which add motion cost and need reduced-motion handling | M | Nothing. 7-G needs the real CV from the owner. | `frontend/` only | Reframe as quality work: accessibility (contrast, focus, reduced motion), Lighthouse before/after, real OG image. Skip 7-B, 7-D, 7-E (typewriter, hover glitch, canvas particles) or ship them only behind `prefers-reduced-motion: no-preference`. 7-A (timeline reveal) is cheap but also needs reduced-motion care. | **Do now**, as WP-A and WP-B (and WP-E for 7-G). Drop the particle field. |
| **8 Analytics** | Know who visits and what they click | **Medium**: tells you whether a recruiter opened the link; little else is needed | S | A Vercel dashboard toggle | `frontend/` layout (one component) | Replace Amplitude with Vercel Web Analytics: no key, no cookies, no extra project (RESEARCH.md 2.2). No `NEXT_PUBLIC_AMPLITUDE_API_KEY`, no dashboard to build, no consent-banner logic. | **Redesign, then do now** (WP-D). Drop Amplitude. |
| **9 Spotify** | Click-to-play Cyberpunk soundtrack in the hero | **Low**: logged-out visitors get a 30 s preview; adds a third-party iframe and a brand/licensing question | S | Nothing technical; legal question open | `frontend/` hero | The track ID in the brief is unverified. | **Drop** for now. If revived: click-to-load iframe only, credited on the credits page, after the owner asks CD PROJEKT RED. |
| **10 Credits** | Credits and citations page for tech, design, fonts, hosting | **Medium**: cheap trust signal, and the place for the unofficial-fan-work disclaimer, font licences and third-party notices | S | Nothing | `frontend/` new page, footer | List what is actually used today (Vercel, Supabase; Railway only once live; Spring Boot 4.1 not 3.5; Framer Motion version from `package.json`). Add the disclaimer and a note on third-party embeds. Put the link in a footer, not the navbar, so it does not touch `Navbar.tsx` while WP-B edits it. | **Do now** (WP-C). |
| **11 Job tracker** | Admin-only Kanban of job applications | **Low for visitors**, **medium for the owner** if used daily | L | Backend live; `admin` project deployed; microfrontends group; Supabase table | `backend/` (entity, service, controller), `apps/admin` (pages), `supabase/init.sql` plus a migration | Not Railway Postgres, not Flyway, not `ddl-auto: update`: add the table to `supabase/init.sql` and apply it with the Supabase migration tool. Pages go in `apps/admin`, not the public app. Fix the H2/JSONB test gap or test on Postgres. A spreadsheet does the same job with no code, so build it only if the owner commits to using it. | **After the backend is live**, and only on the owner's say-so (WP-K). |
| **12 Market research** | Scheduled Adzuna pull, skill-frequency insights | **Low for visitors**, **medium for the owner** (informs what to learn; a good Databricks exercise) | L | Backend live; Adzuna account and keys; a way to run a schedule (RESEARCH.md 2.4) | `backend/` service, controller, scheduler; `supabase/init.sql`; admin page in `apps/admin` | Nightly is overkill: pull weekly. Scheduler per RESEARCH.md 2.4 (`@Scheduled` with sleeping off, or a Railway cron service), never Vercel Cron. Adzuna's free tier is for evaluation and its rate limit is unconfirmed, so keep it admin-only and cache. Optional: analysis in Databricks Free Edition (offline only). Re-check the 250 calls/day assumption on the Adzuna dashboard. | **Redesign; do after the backend and only if wanted** (WP-L). |
| **13 Resume auto-updater** | Turn market insights into suggested edits to your profile and apply them | **Low**, and risky: suggestions to add skills to a public résumé because the market wants them invite overstating | L | Phase 12 | `backend/` and `apps/admin` | The Vercel redeploy hook is unnecessary: the site re-renders hourly from the API. The apply flow adds change-log tables and audit code for an edit you can make in one commit. | **Drop.** If wanted later, fold "edit profile in admin" into the admin app as a plain editor with no market-driven suggestions. |
| **14 LinkedIn sync** | Import a LinkedIn data export into profile and experience | **Low to medium**: a one-off convenience | M | Backend live; admin app | `backend/` (parser), `apps/admin` (upload page) | ToS-safe (it uses the user's own export), but the upload, ZIP parsing, diff and approve flow is far more machinery than a few copy-pastes a year. CSV columns change (RESEARCH.md 2.2). | **Drop** as a feature. The owner (or a session) reads the export once and updates `content/index.ts` by hand in WP-E. |
| **15 Benchmarking** | Compare you to peer developers via GitHub on a public page | **Low as written**: ranking against famous developers is unflattering and not a hiring signal. **Medium** as "my GitHub activity" (recent repos, languages, pinned work) | M | None (public GitHub API; optional read-only token) | As written: `backend/` plus a Supabase table plus a public page. Redesign: `frontend/` server code only | Drop peers, `BENCHMARK_PEERS`, the table, the backend endpoints and the database. Fetch the owner's public repos in the frontend with a one-hour revalidate (one request, far below the 60/hour unauthenticated limit; see RESEARCH.md 2.2). Fall back to repo content if GitHub is slow. | **Redesign; do now** (WP-G), after real content exists so there is something worth showing. |
| **16 Pro-dev dashboard** | Skill gaps and learning velocity from market and GitHub data | **Low** | L | Phases 12 and 15 (as written) | `backend/`, `apps/admin`, Supabase | Built on two phases that are being dropped or redesigned. | **Drop.** Revisit only after 11 and 12 have been used for months. |
| **17 Production** | Harden the deployed system | **High** for the ops items; much of the brief is obsolete | S to M | Backend live for the monitoring items | Mostly settings, docs, and small workflows | Already done by other means: custom domain, Vercel Git deploys, CI. Obsolete: Railway CLI deploys, Railway Postgres and backups, `NEXT_PUBLIC_API_URL`, deploy-hook and smoke-test jobs that need secrets. Still valuable: uptime check, Supabase keep-alive, backup of the messages table, secret-rotation notes, Lighthouse baseline. | **Do in reduced form** as WP-H and WP-I, once the backend is live. |

### Phases that can start today with no backend and no new accounts

| Item | Package | Notes |
|---|---|---|
| 7 (accessibility, motion, Lighthouse, real OG) | WP-A, WP-B | Frontend only. The OG image can be generated in code until the owner has a design. |
| 10 Credits | WP-C | Static page. |
| 8 Analytics as Vercel Web Analytics | WP-D | Uses the existing Vercel account; the owner switches it on in the dashboard and confirms cost. |
| 15 as a GitHub activity section | WP-G | Public API, no token needed at this scale; best after real content. |

Everything else needs the backend (11, 12, 14, 16, 17's monitoring), a third-party
account (12: Adzuna), or the owner's decision (9, 13).

## Independent work packages

Each package is sized for one pull request. They are chosen so that no two touch the same
files, with the exceptions noted. Where two packages must change one file they touch
different hunks and should merge in the order shown.

| Pkg | Scope | Files it owns | Needs | Effort |
|---|---|---|---|---|
| **WP-A SEO and social** | `site.ts` constants (name, URL, description) so metadata is not duplicated; page-level `generateMetadata` for every page with its own `og:title` and description; canonical URLs; `robots.ts` and `sitemap.ts`; a generated `opengraph-image` replacing the blank `og.png`; JSON-LD `Person`; custom `not-found.tsx`; `theme-color`; correct fallback site URL. Run Lighthouse before and after and record the scores in the PR. | New `frontend/src/lib/site.ts`, `frontend/src/app/robots.ts`, `sitemap.ts`, `opengraph-image.tsx`, `not-found.tsx`; metadata exports in the five `page.tsx` files and the metadata block of `layout.tsx`; tests | Nothing. The owner sets `NEXT_PUBLIC_SITE_URL` for it to take effect. | S |
| **WP-B Accessibility and motion** | `prefers-reduced-motion` for glitch, cursor blink, scanlines and Framer Motion (`MotionConfig reducedMotion="user"` or CSS); `:focus-visible` styles; lift `cp-red` and `cp-muted` text to AA (a lighter red for text, keep the dark red for fills and large text); stronger input borders; skip link and `<main id>`; `aria-live` on the contact status; Escape and focus handling in the mobile menu; `aria-pressed` on skill filters; 24 px minimum targets for links; check `GlitchText` with VoiceOver. | `globals.css`, `Navbar.tsx`, `ContactForm.tsx`, `TerminalInput.tsx`, `SkillBar.tsx`, `SkillsChart.tsx`, `NeonButton.tsx`, `NeonCard.tsx`, the skip-link hunk of `layout.tsx`; tests | Nothing | M |
| **WP-C Credits and disclaimer** | `/credits` page listing the stack as it is, the hosting actually in use, fonts, the unofficial-fan-work disclaimer and third-party notices; a `Footer` component with the disclaimer and the credits link. | New `frontend/src/app/credits/page.tsx`, new `components/layout/Footer.tsx`, the footer hunk of `layout.tsx`; tests | Owner approves the disclaimer wording | S |
| **WP-D Vercel Web Analytics** | Add `@vercel/analytics`, mount once in the layout, document the dashboard toggle and the plan cost; add custom events (CV download, contact click) only if the plan includes them. | `frontend/package.json` and lockfile, one line in `layout.tsx`; a short DEPLOYMENT.md note | Owner enables Web Analytics on the project | S |
| **WP-E Real content and CV** | Replace `content/index.ts` with the real profile, roles, links and skills grouped by area (drop the percentages or relabel as "daily / comfortable / familiar"); real `cv.pdf`; `mailto:` fallback on the contact page; remove game-corp names. | `frontend/src/content/index.ts`, `frontend/public/cv.pdf`, the contact page copy | **Owner's real content and CV** | S for code |
| **WP-F Case-study projects** | Each project gets problem, role, decisions, outcome and links; a `/projects/[slug]` page; a "How this site is built" project with the architecture diagram from DEPLOYMENT.md. Keep new fields optional so the Spring API and `types.ts` stay compatible; a Supabase column change only if content moves to the database. | `types.ts`, `ProjectsGrid`, `NeonCard`, new `projects/[slug]/page.tsx`, the content file (after WP-E) | WP-E | M |
| **WP-G GitHub activity** | Server-side fetch of the owner's public repos with `revalidate: 3600`, a small section on the home page or a `/github` page, graceful fallback if GitHub is slow or rate-limited, optional read-only `GITHUB_TOKEN`. Replaces phase 15. | New `frontend/src/lib/github.ts`, new `components/sections/GitHubActivity.tsx`, one hunk in the home page or a new page; tests | Real GitHub username in the content (WP-E) | M |
| **WP-H Ops hardening (phase 17, reduced)** | Weekly keep-alive that touches the database (a scheduled GitHub Action calling a query-running endpoint, or a Railway cron), an uptime check, a documented export of the `messages` table, secret-rotation notes, Lighthouse baseline recorded in docs. | `.github/workflows/` (new file), `docs/`; maybe one small backend endpoint | Backend live | S to M |
| **WP-I Admin deploy** | After the owner creates the `admin` Vercel project and microfrontends group: add `frontend/microfrontends.json` and wrap `frontend/next.config.ts` in `withMicrofrontends`; verify `/admin/login` end to end against the real API; make the admin CI job required. | `frontend/microfrontends.json`, `frontend/next.config.ts`, `frontend/package.json`; docs | Backend live; Vercel project and group created by hand | S |
| **WP-J Monorepo move** | `frontend/` to `apps/web`, a shared UI package and shared API types, one TypeScript version, update workflows, Dockerfile, Vercel root directory and docs. | Almost everything under `frontend/`, `apps/admin`, `.github/workflows/`, docs | Quiet window; WP-A to WP-G merged | M to L |
| **WP-K Job tracker (phase 11)** | Table in `supabase/init.sql`, backend entity, service and controller, admin pages; fix the H2/JSONB test gap first. | `backend/`, `supabase/`, `apps/admin` | Backend and admin deployed; owner decision 5 | L |
| **WP-L Market research (phase 12)** | Adzuna client, weekly scheduler, table, admin insights page; optional Databricks exercise on exported data. | `backend/`, `supabase/`, `apps/admin` | WP-K's test fix; Adzuna keys; owner decisions 5 and 9 | L |

Overlap notes: WP-A, WP-B and WP-C each touch a different hunk of `layout.tsx`, and WP-A
and WP-E both touch page-level files; merge in the order A, B, C, D, then E, F, G. WP-J
must wait for all of them. WP-H and WP-I touch files disjoint from the frontend packages
(WP-I edits `frontend/next.config.ts` and `package.json`, so it also goes after WP-D). WP-K
and WP-L both add backend classes and edit `supabase/init.sql` and `apps/admin`, so run
them one after the other.

## Status of the phases after this roadmap

| Phase | Recommendation |
|---|---|
| 7 | Do now (WP-A, WP-B; 7-G via WP-E); drop the particle field |
| 8 | Redesign to Vercel Web Analytics; do now (WP-D) |
| 9 | Drop (optional click-to-load later) |
| 10 | Do now (WP-C) |
| 11 | After the backend is live, if the owner wants it (WP-K) |
| 12 | Redesign (weekly, simple scheduler, admin-only); after the backend (WP-L) |
| 13 | Drop |
| 14 | Drop as a feature; one-off manual update (WP-E) |
| 15 | Redesign to a GitHub activity section; do now (WP-G) |
| 16 | Drop |
| 17 | Reduced; do after the backend is live (WP-H, WP-I) |
