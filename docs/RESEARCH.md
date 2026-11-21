# Research notes

Findings behind [ROADMAP.md](ROADMAP.md). Written 2026-11-20 against `main` at `0a8f52c`.
Part 1 is what remains open from the site review. Part 2 is third-party
research. Every third-party claim has a link; anything I could not confirm from an
official page is marked **(unconfirmed)**. Pricing pages change, so re-check before paying
for anything. Nothing here is legal advice.

Method limits: web search results were summarised, not read page by page, except the CD
PROJEKT RED guideline and the Databricks Free Edition pages, which were fetched in full.
I could not run Lighthouse (Google's PageSpeed API returned a quota error and a local run
was not permitted in this session), so there are no Lighthouse scores here. Run one
before and after the polish work (see WP-A and WP-B in the roadmap).

---

## Part 1 — Site review, status after the fixes

The first review (2026-11-20, `main` at `0a8f52c`) found placeholder content, a blank
Open Graph image on the wrong host, no `robots.txt` or sitemap, no reduced-motion or
focus handling, and an offline contact form. Those have been fixed (see
[ROADMAP.md](ROADMAP.md) "Done"); the original findings are in git history. What the
review found that is still open or unconfirmed:

- **Lighthouse scores were never measured** (the PageSpeed API returned a quota error and
  a local run was not permitted). Run one and record it (WP-A/WP-H).
- **No Content-Security-Policy** header (other security headers are in
  [`frontend/vercel.json`](../frontend/vercel.json)).
- **No custom `not-found` page**; unknown URLs show the default Next.js 404.
- **No form honeypot** on the contact form, which matters once the API is in use.
- **Small link targets**: social links, "DEMO"/"REPO" links and the logo link were under
  WCAG 2.2's 24 px minimum at 375 px
  (<https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html>); not re-measured.
- **`GlitchText`** duplicates its string in CSS pseudo-elements; whether screen readers
  announce it twice is **unconfirmed** (test with VoiceOver).
- **Performance**: Framer Motion ships to the browser for the skill bars, three Google
  fonts are loaded (Rajdhani with four weights); bundle size was not measured.
- **Mobile**: the angled `hud-clip` corner cut makes button borders look broken at the
  top right; only the home page was checked visually.
- **`avatarUrl`** exists in the data but is never rendered.
- **TypeScript is 6.x in `apps/*` and `^5` in `frontend/`**: harmless, but the monorepo
  move should settle on one version.
- **Backend:** persistence is now tested against PostgreSQL in CI; `SeedRunner` still seeds
  the old placeholder persona into empty tables (see
  [DEPLOYMENT.md](DEPLOYMENT.md#outstanding-work)).

---

## Part 2 — Background research

### 2.1 What makes a developer portfolio effective in 2026

Sources are mostly practitioner posts and recruiting-company blogs rather than studies, so
treat percentages as unverified. The advice is consistent across them:

- **Real, deployed work beats volume.** Reviewers skim many applications and spot tutorial
  clones quickly; projects should be live, and the site must work on phones because
  hiring managers check there ([Scrimba](https://scrimba.com/articles/how-to-build-a-web-developer-portfolio-that-gets-you-hired),
  [Underdog.io](https://underdog.io/blog/software-engineer-portfolio),
  [DEV: portfolio that gets you hired in 2026](https://dev.to/getcraftly/how-to-build-a-developer-portfolio-that-gets-you-hired-in-2026-4oih)).
- **Explain the work for someone who will not read the code.** Short case studies:
  problem, your role, decisions and trade-offs, outcome, metrics, link to repo or demo.
  For backend-leaning engineers especially, diagrams, metrics, write-ups and live demos
  are what recruiters can actually evaluate ([Fueler](https://fueler.io/blog/what-recruiters-actually-want-to-see-in-a-backend-developer-portfolio)).
- **Make repos public and readable**, with a README (description, stack, live link,
  screenshot, setup) ([Underdog.io: what hiring managers look for on GitHub](https://underdog.io/blog/what-hiring-managers-look-for-on-github)).
- **Fewer, better projects tailored to target roles**, with AI-related work increasingly
  expected in 2026 (same sources; this is opinion, not data).
- **Make contact obvious and working**: visible email or LinkedIn, a downloadable CV.
- One quoted figure that looks more solid than the rest: a survey of 60+ hiring managers
  found 93% would look at a portfolio site if offered, but 51% said a candidate's chances
  would not be lower without one. I saw this only in a search summary; the **original
  survey was not located (unconfirmed)**. The widely repeated "73% value a portfolio over
  a résumé" and "7.4 seconds" figures have inconsistent attribution; I did not use them.

**How this site compares.**

| Practice | This site today |
|---|---|
| Real, verifiable work | Real profile and certifications since WP-E |
| Live demos and public repos | Live Kafka demo; GitHub activity section |
| Case-study depth | Still short descriptions; no problem, decision or outcome (WP-F) |
| Working contact path and CV | Form with SMTP and `mailto:` fallback (delivery not yet tested, variables not yet set); no CV file yet |
| Works on mobile | Yes |
| Fast, accessible, indexable | Fast; SEO and accessibility basics shipped; open items in Part 1 |
| Distinctive design | Strong (the Cyberpunk look is memorable), but it is also the main risk: it must not read as a joke at the expense of credibility |
| Self-ratings | Dropped: skills are listed by category without percentages |
| The repo itself as evidence | Strong: this monorepo (CI, Dependabot, micro-frontends, tests, docs) is real evidence of engineering practice, and nothing on the site points to it yet |

The last row is the opportunity: a "how this site is built" project with an architecture
diagram and decisions (static-first with backend fallback, micro-frontends, footprint
limits) is the most credible case study the owner can write today, because it is true.

### 2.2 Third-party dependencies the phases assume

#### Analytics: Amplitude vs Vercel Web Analytics (phase 8)

| | Vercel Web Analytics | Amplitude (Browser SDK) |
|---|---|---|
| Footprint | One component from `@vercel/analytics`, enabled per project in the dashboard; no key, no new project, no extra service | New SDK in the client bundle, an Amplitude account, an API key in the build env |
| Cookies and privacy | Docs say visitors are identified by a hash of request data, not cookies, and by default only aggregated data is kept ([privacy](https://vercel.com/docs/analytics/privacy-policy)). Whether a banner is still needed depends on jurisdiction; a consent vendor says it is compliant if loaded after consent (secondary source: [ConsentStack](https://www.consentstack.io/vendors/vercel-analytics)). | The SDK sets a first-party cookie (`AMP_<key prefix>`, 365 days by default) as soon as it initialises, even for opted-out users, so GDPR use means delaying `init()` until consent ([cookies and consent](https://amplitude.com/docs/en/sdks/analytics/browser/cookies-and-consent-management)). Session Replay needs disclosure and consent where required ([session replay consent](https://www.amplitude.com/docs/session-replay/best-practices-for-managing-user-consent)). |
| Cost | Billed by collected events across the team. **Sources disagree on Pro's allowance**: current docs list none included and $0.03 per 1K events; an older changelog says 100K/month. A portfolio's traffic is tiny, but confirm on the [pricing page](https://vercel.com/docs/analytics/limits-and-pricing) and keep the spend limit on. Web Analytics Plus is a $10/month add-on you do not need. | Free plan: 2M events/month plus session replay (10K sessions listed), no card ([pricing](https://amplitude.com/pricing)). Older Starter/MTU figures on community pages are legacy. Free session-replay cap **unconfirmed**. |
| Depth | Page views, referrers, countries, devices, custom events (whether custom events are included on Pro is **unconfirmed**) | Funnels, retention, replay: far more than a portfolio needs |

**Recommendation:** Vercel Web Analytics. It matches "smallest Vercel footprint" (no new
project, SDK or key), is cookieless by design, and answers the only questions a portfolio
has: did a recruiter's link get opened, from where, which page. Drop Amplitude. If custom
events (CV downloads, contact clicks) are wanted, check that they are included in the
plan first. Speed Insights is a separate Vercel product; skip it unless Lighthouse work
shows a need.

#### Spotify embeds (phase 9)

- The embed is an `<iframe>` from `open.spotify.com/embed/...`; Spotify documents it, plus
  an iFrame API for control ([Embeds docs](https://developer.spotify.com/documentation/embeds),
  [iFrame API](https://developer.spotify.com/documentation/embeds/references/iframe-api)).
- Visitors who are not logged in to Spotify in that browser get a preview clip of under
  30 seconds, and modifying the iframe tag or dropping `encrypted-media` also degrades it
  to previews ([troubleshooting](https://developer.spotify.com/documentation/embeds/tutorials/troubleshooting)).
  Most recruiters will not be logged in, so "play the song" mostly yields a 30-second clip.
- Autoplay is blocked by browsers (Safari especially) without a user gesture; the brief
  already plans click-to-play.
- Using embeds means accepting the Spotify Developer Terms
  ([Play Button docs](https://developer.spotify.com/technologies/widgets/spotify-play-button/documentation));
  I did not read those terms in full **(unconfirmed)**.
- The track ID in the brief (`5HTHMQ8wMAlF6cEo6bx0aL`, "The Rebel Path") **could not be
  verified**; check that it resolves to the right track before use.
- Cost: free. Footprint: an iframe loaded only on click adds nothing to page load. Once
  loaded, Spotify may set its own cookies, which belongs on the credits page.

#### Adzuna jobs API (market research)

Re-checked 2026-11-21 for the weekly market research, from Adzuna's own pages (read in
full): the [terms of service](https://developer.adzuna.com/docs/terms_of_service), the
[overview](https://developer.adzuna.com/overview), the
[search docs](https://developer.adzuna.com/docs/search) and the OpenAPI description behind
the [interactive docs](https://developer.adzuna.com/activedocs)
(`https://developer.adzuna.com/swagger/spec/test2.json`). No key was created and the API
was not called, so behaviour is as documented, not as observed.

- **Decision: Adzuna.** Its terms permit "Personal job search" and "Personal and academic
  research"; it documents a `company` filter, a `category` filter, `max_days_old` and
  title keywords; and it is a first-party aggregator with a keyed API, so nothing is
  scraped.
- **Terms that matter here.** Written agreement is needed for commercial analysis, resale
  or lead generation. A section headed "Commercial use" (commercial, government and
  academic organisations) carries a 14-day trial and a ban on using the data in
  aggregation; reading that as not applying to an individual's personal use is **my
  interpretation, not something Adzuna has confirmed**. An email to Adzuna would settle
  it. Attribution is required where results are displayed or research is published; the
  tool publishes nothing. There is no clause on storing or caching; on termination data
  from Adzuna must be removed. One account per person.
- **What is stored:** weekly counts only (skill, listings mentioning it, listings
  examined). No listing text, id or link, which keeps the tool clear of any question
  about holding Adzuna's content.
- **Rate limits: unconfirmed.** No public page gives numbers; the terms say the limits
  "are shown in your account". The often-quoted 25 a minute / 250 a day / 1,000 a week /
  2,500 a month come from third parties only. The job makes about 126 requests a week
  (63 companies, two target roles), spaced 3 seconds apart, in one run. That is inside the
  quoted daily and weekly figures and, at 20 a minute, under the quoted per-minute one; read the real ones in the
  dashboard after registering.
- **Request.** `GET https://api.adzuna.com/v1/api/jobs/us/search/1` with `app_id`,
  `app_key`, `content-type=application/json`, `what` or `what_phrase` (the forward
  deployed search uses the exact phrase), `category` (`it-jobs`, developer search only), `company`
  ("The canonical company name"), `max_days_old`, `results_per_page`, `sort_by`. **Not
  documented:** whether `company` matches exactly or loosely, and the maximum
  `results_per_page` (50 is the commonly cited figure). The job therefore re-checks every
  listing's employer name itself and logs companies that returned nothing usable.
- **Response.** `results[]` with `id`, `title`, `description`, `company.display_name`
  and more. The description is "truncated to 500 characters", so skill counts are
  undercounts. Following a listing's link to read the full text would be scraping the
  advertiser's site and is not done.
- **Errors.** Documented: 400, 404, 410 "Authorisation failed", 500. A 429 is not
  documented; the client handles one anyway.
- **Registration:** <https://developer.adzuna.com/signup> (free; has a CAPTCHA, so the
  owner does it).

**Alternative considered: JSearch** (OpenWeb Ninja, also sold on RapidAPI). It returns
full descriptions, which Adzuna does not. Not chosen: its data is collected from Google
for Jobs (LinkedIn, Indeed and others), so the provenance is scraping; it has no
structured company or title filter (both go into a free-text query); the vendor's free
plan is a one-off 50 requests at 10 results each, which cannot cover about 60 companies a
week; and its terms on storage and attribution could not be read (the pages returned
nothing usable). Sources:
[service manifest](https://agents.openwebninja.com/manifest.json),
[RapidAPI pricing page](https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch/pricing)
(free quota **unconfirmed**: the page would not render). Also looked at and set aside: The
Muse (its developer pages now redirect and the public endpoint answered 403/404) and
Jooble (the key needs an application form aimed at job portals; no public limits).

#### Company allow-list for market research: Fortune 500 and FINRA

The rule is the owner's (2026-11-21): a company counts only if it is on the current
Fortune 500 **and** is, or owns, a FINRA member broker-dealer. The list, with the
evidence per company, is
[`backend/src/main/resources/market/allow-list.json`](../backend/src/main/resources/market/allow-list.json),
compiled 2026-11-21.

- **Fortune 500:** <https://fortune.com/ranking/fortune500/>, the 2026 list (page data
  marked 2026, modified 2026-10-05). The page carries 1,000 ranked companies; ranks 1 to
  500 were taken as the Fortune 500.
- **FINRA:** [BrokerCheck](https://brokercheck.finra.org/). For each broker-dealer the
  firm record (`https://brokercheck.finra.org/firm/summary/<CRD>`) was read and showed an
  active, approved FINRA registration. The link from broker-dealer to parent comes from
  the same source: either the parent is the direct owner in the BrokerCheck record, or it
  is named among the indirect owners in the firm's Form BD detailed report
  (`https://files.brokercheck.finra.org/firm/firm_<CRD>.pdf`). The chain read for each
  company is in the file's `ownership` field.
- **Result:** 65 companies passed both tests. 63 are switched on. **CBRE Group and Jones
  Lang LaSalle pass both tests but are commercial real-estate companies**, so they are
  recorded and switched off; whether "financial services" should include them is the
  owner's call. 40 Fortune 500 companies are recorded as excluded because no FINRA member
  was confirmed (among them American Express, Visa, Mastercard, PayPal, AIG, Progressive,
  Berkshire Hathaway), and 14 because they are not on the 2026 Fortune 500 (among them
  T. Rowe Price at 509, Coinbase, CME Group, Stifel, Robinhood, and Fidelity Investments,
  which is private).
- **Not confirmed, and marked so in the file:**
  - "No FINRA member found" means a BrokerCheck name search on the parent's name found no
    active firm. A broker-dealer under an unrelated name would be missed, so an exclusion
    is not proof of absence.
  - Only Fortune's Financials sector and a handful of named fintech companies were
    screened. A Fortune 500 company in another sector that owns a broker-dealer is not on
    the list.
  - Farmers Insurance Exchange: an active member (Farmers Financial Solutions, CRD
    103863) exists, but the ownership chain read stops short of the Fortune entity, so it
    is excluded as unconfirmed.
  - Interactive Brokers Group is included although BrokerCheck shows it holding 25% to
    under 50% of the intermediate owner (it directs its management).
  - For State Street, Nasdaq and Prudential, a second broker-dealer is listed whose chain
    was not separately read; each inclusion rests on the first.
  - SEC filings (10-K, Exhibit 21) were not used: EDGAR full-text search refused the
    request. Every parent link rests on FINRA's Form BD data.
  - The employer names used to match listings (`searchName`, `aliases`) are best guesses
    from the Fortune and BrokerCheck names and were **not** checked against Adzuna.

#### LinkedIn data export (phase 14)

- Self-service: Settings & Privacy → Data Privacy → "Get a copy of your data"
  ([LinkedIn help](https://www.linkedin.com/help/linkedin/answer/50191)). Files include
  `Profile.csv`, `Positions.csv` and `Skills.csv` per that page and third-party tools.
  Delivery is quick for the partial download and up to about 72 hours for the full archive
  (reported by third-party guides; exact CSV columns **unconfirmed**, they change).
- Using your own export is ToS-safe; scraping profiles is not. The brief's point that API
  access needs Partner Program approval matches what is widely reported; I did not
  re-verify it.
- This is a once-in-a-while manual task. A multipart upload endpoint, ZIP parsing, a diff
  UI and an approval flow is a lot of surface for something done a few times a year.

#### GitHub API for benchmarking (phase 15)

- Unauthenticated REST: 60 requests/hour per IP; authenticated tokens: 5,000/hour
  ([official rate-limit page](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api);
  the 5,000 figure came from secondary sources in my search). GitHub changed
  unauthenticated limits in May 2025 ([changelog](https://github.blog/changelog/2025-05-08-updated-rate-limits-for-unauthenticated-requests/));
  exact current numbers **unconfirmed**.
- For one user's own repos, hourly-revalidated server fetches stay far under either limit.
  A token, if used, should be a fine-grained read-only token held only in Vercel or Railway.
- Product risk, not API risk: a public page that ranks the owner against well-known
  developers on stars and followers is an unflattering comparison and says little about
  hiring fit. See the roadmap.

### 2.3 Vercel Microfrontends on the Pro plan

- The repo's plan (`web` as default app, `admin` routed under `/admin/*`) is the
  documented pattern ([docs](https://vercel.com/docs/microfrontends),
  [quickstart](https://vercel.com/docs/microfrontends/quickstart)). Apps that set Next.js
  `basePath` are not supported, which `apps/admin` already respects.
- Pricing, as reported by Vercel's docs and pricing pages: two microfrontends projects
  are included on Hobby and Pro; additional projects are listed at **$250 per project per
  month**; routed requests are billed at **$2 per million** on Pro
  ([pricing](https://vercel.com/pricing), [docs pricing](https://vercel.com/docs/pricing)).
  The sources disagree: the pricing page shows a 50K routed-request allowance for Hobby
  and none stated for Pro, and the microfrontends docs page also says Pro and Enterprise
  get unlimited projects and requests at the same price table
  ([GA changelog](https://vercel.com/changelog/microfrontends-now-generally-available)).
  **Treat the $250 and the allowance as unconfirmed and read the dashboard before adding
  a third app.**
- What this means here: `web` plus `admin` is within the included two. A third app would
  likely cost real money; put new admin features in the existing `admin` app. At
  portfolio traffic, $2 per million routed requests is negligible, and the footprint
  advice in DEPLOYMENT.md still holds.
- Moving `frontend/` to `apps/web` does not change Vercel's setup beyond the project's
  root-directory setting.

### 2.4 Scheduled and background jobs on Railway, and the Supabase free tier

**Railway** (needed for the weekly market research, which uses option 1 below: a schedule
inside the API process, set up in code so a bad setting cannot stop startup):

- Railway has native cron: a service with a cron schedule starts on a five-field UTC
  expression, runs, and must **exit**. Minimum interval is 5 minutes; timing is not exact
  to the minute; if the previous run is still going the next is skipped
  ([cron docs](https://docs.railway.com/reference/cron-jobs),
  [cron vs workers vs queues](https://docs.railway.com/guides/cron-workers-queues)).
- Spring's `@Scheduled` runs inside the always-on API process. It works only while that
  process is awake. Railway's optional serverless (app sleeping) mode stops a service
  after about 10 minutes without outbound traffic, which would silently stop in-process
  schedulers, and the first request after sleep waits for a JVM cold start
  ([app sleeping](https://docs.railway.com/reference/app-sleeping)).
- Options for a daily or weekly job, smallest first:
  1. `@Scheduled` in the API with sleeping **off**. Simplest, no extra service; the JVM
     has to be always on anyway if the API must answer the contact form quickly.
  2. A second Railway service from the same image with a cron schedule and an entrypoint
     that runs one job and exits (a Spring profile or `CommandLineRunner`). Cleanest
     isolation, but a second service to configure and pay for.
  3. A GitHub Actions `schedule` workflow that calls a protected API endpoint. Free and
     visible in the repo, but needs a secret, which DEPLOYMENT.md says no workflow uses today.
  4. Vercel Cron (Pro: per-minute precision, 100 per project; it invokes a Vercel
     function and is listed as a legacy feature moving to "Schedules",
     [usage and pricing](https://vercel.com/docs/cron-jobs/usage-and-pricing)). It works
     against the "keep Vercel small" rule and should not be used here.
- Railway pricing: Hobby is $5/month and includes $5 of usage; a one-time $5 trial credit
  exists ([plans](https://docs.railway.com/pricing/plans)). Whether an always-on JVM
  service fits inside the included usage is **unconfirmed**; use Railway's usage estimate
  for a 512 MB service before committing to cron services on top.

**Supabase free plan** ([pausing](https://supabase.com/docs/guides/platform/pausing),
[pricing](https://supabase.com/pricing)):

- Projects with low database activity for about 7 days are paused, with a warning email
  about a week earlier. Paused projects can be restored from the dashboard; paid projects
  never pause. Activity means real queries, not just open connections (a Supabase
  explanation in [discussion 13121](https://github.com/orgs/supabase/discussions/13121)).
- Limits listed for Free: 500 MB database, 5 GB egress plus 5 GB cached egress, 1 GB file
  storage, two active projects, 50,000 monthly active users (auth, which this repo does
  not use). Automatic backups are not included on Free per secondary sources
  (the page originally cited has been removed); confirm on the pricing page. The contact messages table is the only irreplaceable data.
- Connection limits for Free are **not published on the pricing page** (it lists them for
  paid compute sizes only), so keep `DB_POOL_SIZE=5` as DEPLOYMENT.md says and use the
  session pooler.
- Pause risk for this site: the API sees about one request per page per hour only while
  the site has traffic. A quiet week could pause the database and leave the contact form
  on "channel offline". A weekly keep-alive that touches the DB (a scheduled GitHub Action
  or Railway cron calling an endpoint that runs a query) closes that gap; whether
  `/actuator/health` itself issues a query is **unconfirmed**; test it.

### 2.5 Databricks Free Edition

Read in full from [free-edition](https://docs.databricks.com/aws/en/getting-started/free-edition)
(updated 2026-11-15) and [limitations](https://docs.databricks.com/aws/en/getting-started/free-edition-limitations)
(updated 2026-11-16):

- **Offers:** serverless-only workspace with notebooks, a SQL editor and one 2X-Small SQL
  warehouse, Lakeflow pipelines (one active per type), jobs (max five concurrent tasks),
  up to three Databricks Apps (each auto-stops after 24 hours and must be restarted), one
  Lakebase Postgres project with scale-to-zero compute, AI Playground and model serving
  with limits, Genie for natural-language dashboards.
- **Limits and terms:** a fair-use quota with no published number; when exceeded, compute
  is shut down for the rest of the day (in extreme cases, the month) and data is kept.
  "Meant for non-commercial use." No SLA or support. Inactive accounts may be deleted after
  an unstated period. One workspace; no account-level APIs. Outbound internet is
  restricted to trusted domains; LinkedIn verification is listed as raising some limits.
  External JDBC/ODBC access, storage size and scheduling frequency are **not stated**.
- **Fit:** it does **not** fit serving the website or API: no reliability guarantee,
  daily compute shutdowns, apps that stop after 24 hours, possible account deletion, and a
  non-commercial label. It can fit **offline analysis** that is allowed to be down:
  phase 12's skill-frequency analysis (keep Adzuna JSON in Postgres, load it into Delta
  tables, run a weekly notebook or job, share a Genie dashboard) is a reasonable place to
  learn Databricks, and "used Databricks for market-skills analytics" is itself portfolio
  material. It must not be on the path of any public page or of the success of the
  backend's own job. This matches the deferred idea already recorded for the project.

### 2.6 Cyberpunk 2077 names, look and soundtrack: legal and brand risk

What the [CD PROJEKT RED Fan Content Guideline](https://cdprojektred.com/fan-content/)
says (the page is marked last updated 2020-12-10; it is not a contract, and the User
Agreement and each game's EULA win on conflict). This describes the text; it is not legal
advice:

- **Golden rules:** no commercial use (donations are fine, no paywalls); fan content must
  be clearly marked as unofficial and not endorsed, with a disclaimer in an obvious place;
  do not build it into another game or product; do not harm others; follow the User
  Agreement and EULA.
- **Permitted examples** include fan art, screenshots, community websites and fan pages,
  and software that works alongside the games. Domains must not contain CD PROJEKT RED or
  game or company names or trademarks. `justcallmepratt.dev` contains none.
- **Music:** not licensed by the page; it warns that some in-game music (some Cyberpunk
  2077 radio tracks) is owned by third parties and may need their permission. Remixing is
  not allowed. The guideline does not say whether linking or embedding from a streaming
  service is covered.
- **Not addressed anywhere on the page:** fonts, logo and trademark use beyond domain
  names, ads, personal portfolios or using fan work to seek employment, web apps.
- CD PROJEKT RED does enforce against commercial use; in January 2026 it issued a DMCA
  takedown against a paywalled Cyberpunk 2077 VR mod
  ([Windows Central](https://www.windowscentral.com/gaming/pc-gaming/cyberpunk-vr-mod-disappeared-cd-projekt-red-issues-a-takedown),
  [Gaming Bible](https://www.gamingbible.com/news/platform/pc/cd-projekt-dmca-cyberpunk-2077-vr-mod-257553-20260120)).
  That case is about paid distribution, not portfolios.

How this applies, factually:

| Element | Status |
|---|---|
| "Cyberpunk-inspired" colours, HUD panels, glitch effects, monospaced fonts | Generic visual language. No game artwork or logos appear to be shipped (the repo's own `CP2077_DESIGN_BIBLE.html` is the owner's reference document). Fonts are Google Fonts (Rajdhani, Orbitron, Share Tech Mono), which Google distributes under open licences; **licence text not re-read**. |
| Arasaka, Militech, Kang Tao, NetWatch as "employers" | In-game corporation names. Fine as obviously fictional placeholders on a fan page; a problem on a job-seeking portfolio, because a recruiter would read them as the owner's work history. They have been removed from the site with the real content (WP-E); the API database still has them. |
| "Night City" naming in copy and titles | Setting name from the game; low risk as an homage with a disclaimer; the guideline's "clearly unofficial" rule is the cautious path. |
| Disclaimer | Footer line and `/credits` page (WP-C). |
| Soundtrack (phase 9) | Third-party music. An official Spotify embed streams from Spotify rather than copying audio, but logged-out visitors get a ~30 s preview. Whether embedding fits the guideline's music paragraph is **unconfirmed**; the guideline page lists `legal@cdprojektred.com` for questions. |
| Job-seeking use | Not addressed by the guideline. The portfolio's purpose is career, which a strict reading of "no commercial use" could touch. That is a question for a lawyer or CD PROJEKT RED, not for this document. |

Mitigation already in the roadmap: keep the aesthetic, replace game names with real
content, add an unofficial-fan-work disclaimer, add a credits page, and make the
soundtrack optional or drop it.
