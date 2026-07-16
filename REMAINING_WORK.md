# Remaining Work

> 📊 **Last validated end-to-end:** 2026-05-18 — see [`docs/VALIDATION.md`](docs/VALIDATION.md) for the full report.
> Production live · 241/241 tests green · email validation + rate limiting confirmed working in prod.
> 🔧 **Last deploy-pipeline audit:** 2026-07-16 — both prod endpoints confirmed live (200/200); see Backlog below.

---

## 🔥 Backlog — Known Issues (as of 2026-07-16)

| # | Issue | Severity | Status |
|---|---|---|---|
| 1 | **Repo renamed** `justcallmepratt/personal-web-app` → `pratO66/personal-web-app`. All `gh secret set --repo ...` instructions in `ci.yml`, README, ORCHESTRATOR.md, phase-15 doc pointed at the old owner. | High (broke secret-setup instructions) | ✅ Fixed 2026-07-16 — all refs repointed to `pratO66/personal-web-app` |
| 2 | **Railway CLI OAuth token expired.** `railway status` → `Unauthorized: Token refresh failed: invalid_grant`. Local CLI can't deploy or inspect the service until `railway login` is re-run interactively. | Medium (only blocks local/manual `railway up`; prod itself is unaffected) | ⏳ Needs manual `railway login` (interactive, can't be done by agent) |
| 3 | **CI Railway deploy relies on `RAILWAY_DEPLOY_HOOK_URL` secret** which was never confirmed as set. If missing, Tier 1 of the self-healing deploy skips straight to Tier 2, which also needs `RAILWAY_TOKEN` + `RAILWAY_SERVICE_ID` — neither confirmed set either. Net effect: **pushes to `main` may currently no-op on the backend deploy** (Tier 3 graceful skip), silently leaving Railway on the previous build. | High (deploys may not be reaching prod) | ⏳ User action: set one of the two secret pairs — see `docs/VALIDATION.md` outstanding actions #1 |
| 4 | **`vercel` CLI not installed locally** — `vercel whoami` / `vercel ls` fail with "command not found" outside of CI (where it's installed fresh each run). Not a bug, just means local Vercel debugging needs `npm install -g vercel` first. | Low | Informational only |
| 5 | **GitHub Actions API returned persistent HTTP 503** on `gh run list` during this audit (2026-07-16) — could not confirm actual pass/fail history of recent CI runs. Likely a transient GitHub-side outage, not a repo issue. | Low | ⏳ Re-check `gh run list` next session to confirm recent run status |
| 6 | **Production health check (manual, 2026-07-16):** backend `/actuator/health` → 200, frontend → 200. Both live and serving traffic despite issues #2/#3 above — meaning the *current* deployed versions are fine, but **new pushes to `main` may not be propagating** until secrets are fixed. | High (silent staleness risk) | ⏳ Verify next deploy actually updates a version marker in prod |

### Immediate next steps to close the backlog
1. Run `railway login` locally to refresh CLI auth (issue #2)
2. Either add `RAILWAY_DEPLOY_HOOK_URL`, or both `RAILWAY_TOKEN` + `RAILWAY_SERVICE_ID`, as repo secrets (issue #3):
   ```bash
   gh secret set RAILWAY_DEPLOY_HOOK_URL --repo pratO66/personal-web-app
   # or
   gh secret set RAILWAY_TOKEN --repo pratO66/personal-web-app
   gh secret set RAILWAY_SERVICE_ID --repo pratO66/personal-web-app
   ```
3. Push a trivial commit to `main` and confirm the `deploy-backend` job reports Tier 1 or Tier 2 success (not Tier 3 skip) in the Actions log
4. Re-run `gh run list` once GitHub's API 503s clear, to audit recent CI history

---

## Phase 1 — Foundation ✅
- [x] Spring Boot 3.5 + JPA + Postgres (Supabase), JWT auth, seed runner
- [x] Next.js 16 + React 19 + Tailwind 4 + Framer Motion
- [x] Docker Compose for local development
- [x] supabase/init.sql schema initialisation

## Phase 2 — Design system ✅
- [x] CP2077 Neo Militarism palette: `cp-red`, `cp-teal`, `cp-yellow`
- [x] Rajdhani + Orbitron + Share Tech Mono fonts
- [x] All components aligned: HUDChrome, Navbar, NeonButton, NeonCard, SkillBar, TerminalInput, ContactForm
- [x] TypeScript checks pass clean

## Phase 3 — Resilience & metadata ✅
- [x] `error.tsx` global error boundary with reconnect
- [x] Per-route `loading.tsx` skeleton loaders
- [x] Open Graph + Twitter Card metadata
- [x] `cv.pdf` + `og.png` placeholders in `public/`

## Phase 4 — 12-Factor compliance ✅
- [x] All 12 factors implemented and documented

## Phase 5 — GitHub Actions ✅
- [x] `ci.yml` — compile + test + deploy (Railway + Vercel) on push to main
- [x] `docker-build.yml` — GHCR image builds
- [x] `codeql.yml` + `release.yml` + `dependabot-auto-merge.yml`

## Phase 6 — Quality & Ops ✅
- [x] 95% test coverage: 42 backend tests (JaCoCo) + 66 frontend tests (Vitest)
- [x] GlobalExceptionHandler, OpenAPI/Swagger, @Transactional
- [x] Supabase: GIN indexes, updated_at trigger, pg_stat_statements, deny-all RLS
- [x] Vercel: security headers, API proxy rewrite, pnpm pinned
- [x] Railway: railway.toml, health check, restart policy
- [x] Mobile + tablet responsive polish (44px touch targets, stacked buttons, etc.)
- [x] Dependabot: auto-merge patch/minor, flag major

## Connector Status (validated 2026-05-16)

All MCP connectors probed and documented. Use this as the canonical reference.

| Connector | Tool prefix | Status | Verified capability |
|---|---|---|---|
| **Supabase** | `mcp__supabase__*` | ✅ Live | Migrations, advisors, SQL, GIN indexes, RLS |
| **Vercel** | `mcp__92c0163a__*` | ✅ Live | Deploy, env vars, runtime logs, domain check |
| **Google Calendar** | `mcp__3a7aa2e0__*` | ✅ Live | Create/update/delete events, recurring events |
| **Gmail** | `mcp__faebe781__*` | ✅ Live (read+label) | Search threads, list/create labels |
| **Notion** | `mcp__fdd91680__*` | ✅ Live | Fetch, create, update pages + databases |
| **Amplitude** | `mcp__47ca1c18__*` | ✅ Live | Tracking plan, dashboards, charts, events, session replay — org `cold-hall-104153`, project `814849` |
| **Railway** | CLI `railway` | ✅ Live (permanent token) | Deploy, logs, env vars, service management |
| **Chrome Preview** | `mcp__Claude_Preview__*` | ✅ Live | Screenshots at any viewport, click, fill |
| **Figma** | `mcp__Figma__*` | ⚙️ Needs action | Enable Dev Mode MCP in Figma desktop app |
| **Slack** | `mcp__plugin_design_slack__*` | 🔗 OAuth pending | OAuth URL generated — user must authorize |
| **GitHub Copilot** | `mcp__plugin_engineering_github__*` | 🔗 OAuth pending | Needs Copilot subscription + OAuth |
| **Google Drive** | `mcp__79b7446a__*` | ✅ Live (read) | List, read, search, metadata |
| **Figma plugin** | `mcp__ae6d6b45__*` | ⚠️ Disconnected | Use `mcp__Figma__*` instead |

### What each live connector adds to this project
- **Amplitude** → create dashboards before Phase 8 SDK is wired (define schema now)
- **Google Calendar** → deploy reminders, maintenance windows
- **Gmail** → monitor contact form emails, verify SMTP config
- **Notion** → living documentation, pitch deck, idea board
- **Google Drive** → store CV PDF, OG images, design assets
- **Supabase** → all DB work (migrations, performance, security)
- **Vercel** → all frontend deploys + env var management
- **Railway** → all backend deploys + service logs

### Action needed to unlock remaining connectors
- [ ] **Figma:** Open Figma desktop → Figma menu → Preferences → Enable Dev Mode MCP Server → restart Claude
- [ ] **Slack:** Authorize at `https://slack.com/oauth/v2_user/authorize?...` (URL in session)
- [ ] **GitHub Copilot:** Requires GitHub Copilot subscription + OAuth flow

---

## Phase 7 — Polish (in progress)
- [x] OLED background: pure black `#000000` + `#0A0A10` panels (neons pop on OLED)
- [ ] Framer Motion scroll-reveal on ExperienceTimeline (stagger by index)
- [ ] Hero typewriter boot animation (`init: night_city.exe ▍`)
- [ ] Neon-pulse on active navbar link
- [ ] Particle field canvas in hero background
- [ ] Glitch-on-hover for NeonCard titles
- [ ] Lighthouse audit + WCAG AA contrast fixes (`cp-red` on dark)
- [ ] Replace `cv.pdf` + `og.png` placeholders with real assets
- [ ] Add integration tests with Testcontainers (real Postgres)

---

## Phase 8 — Analytics (Agent: analytics-agent)
**Connector:** Amplitude (appId `814849`, 10k events/mo starter plan)

- [ ] Install `@amplitude/analytics-browser` in frontend
- [ ] Track: `page_viewed` (route + referrer), `cv_downloaded`, `contact_submitted`,
      `project_link_clicked` (demo/repo), `skill_filter_changed`, `experience_viewed`
- [ ] Create Amplitude dashboard: Unique visitors · Top pages · Contact conversion rate
- [ ] Add `pnpm test:coverage` Amplitude event on CI pass (optional)
- [ ] Backend: log structured JSON events for Railway health + contact submissions
- [ ] Supabase: `analytics_events` table for server-side event mirror

---

## Phase 9 — Spotify Integration (Agent: spotify-agent)
**Track:** "The Rebel Path" by Refused (Cyberpunk 2077 OST) · Spotify track embed

- [ ] Add `SpotifyPlayer` component — Spotify iframe embed (no auth required)
- [ ] Mount in HeroSection below the buttons, collapsed by default
- [ ] Expand on first user interaction (solves browser autoplay block)
- [ ] Pulse animation synced to play state (CSS, no Web Audio needed)
- [ ] `NEXT_PUBLIC_SPOTIFY_TRACK_ID` env var so track can be swapped

**Note:** Full autoplay on page load is blocked by all major browsers. Embed widget
lets user click ▶ once — stays collapsed until then.

---

## Phase 10 — Citation / Credits Page (Agent: citation-agent)

- [ ] New route `/credits` — `app/credits/page.tsx`
- [ ] Add "CREDITS" link to Navbar
- [ ] Sections:
  - **Stack** — all libraries, frameworks, and tools with links + license
  - **Design** — Cyberpunk 2077 CP2077 Neo Militarism design language credit
  - **Music** — "The Rebel Path" · Refused · Cyberpunk 2077 OST · CD PROJEKT RED
  - **Fonts** — Orbitron (Google Fonts), Share Tech Mono, Rajdhani
  - **Hosting** — Vercel, Railway, Supabase
  - **Inspiration** — developer portfolios referenced
- [ ] HUDChrome-styled cards per section, cyberpunk aesthetic

---

## Phase 11 — Job Application Tracker (Agent: job-tracker-agent)
**Access:** Admin-protected (`/admin/jobs`)

### Backend
- [ ] Supabase migration: `job_applications` table
  ```sql
  id, company, role, url, source (LinkedIn/Referral/…), status
  (Bookmarked/Applied/Phone Screen/Technical/Final/Offer/Rejected/Ghosted),
  applied_at, last_updated, notes, salary_min, salary_max, currency
  ```
- [ ] Spring Boot: `JobApplication` entity + repo + service + controller (`/api/admin/jobs/**`)
- [ ] CRUD endpoints: POST create · GET list (filterable by status) · PATCH update status · DELETE

### Frontend
- [ ] `/admin/jobs` page (admin-gated, client component)
- [ ] Kanban-style status board using HUDChrome cards per column
- [ ] Add/edit modal using TerminalInput components
- [ ] Status badge with cp-red/cp-yellow/cp-teal colour coding
- [ ] Export to CSV button

---

## Phase 12 — Market Research Engine (Agent: market-research-agent)
**API:** Adzuna Jobs API (free, 250 calls/day) · No scraping

### Backend
- [ ] Spring Boot `MarketResearchService`:
  - Calls Adzuna `/v1/api/jobs/{country}/search` with role keywords from profile
  - Extracts top N required skills from job descriptions (regex + keyword frequency)
  - Stores results in Supabase `market_insights` table (TTL 24h)
- [ ] Scheduled job (`@Scheduled(cron = "0 0 * * * *")`) refreshes every night
- [ ] Endpoint: `GET /api/admin/market/insights` → top skills, avg salary, job count by role
- [ ] Env vars: `ADZUNA_APP_ID`, `ADZUNA_APP_KEY`

### Frontend
- [ ] `/admin/market` page — top skills radar chart vs your current skills
- [ ] Salary band per role with market median overlay
- [ ] "Skill gaps" section: skills in demand you don't list on your profile
- [ ] "Resume suggestions" list auto-generated from gap analysis

---

## Phase 13 — Resume Auto-Updater (Agent: resume-updater-agent)
**Depends on:** Phase 12 (market insights)

### Backend
- [ ] `ResumeUpdateService`:
  - Reads market insights (Phase 12) + current `profile` from Supabase
  - Generates diff: missing skills, outdated tagline, under-represented highlights
  - Returns structured `ResumeSuggestion` objects (field, current value, suggested value, confidence)
- [ ] `POST /api/admin/resume/suggestions` — returns suggestions
- [ ] `POST /api/admin/resume/apply` — applies approved suggestions to `profile` table
- [ ] Audit log in Supabase `resume_change_log` (field, old, new, applied_at)

### Frontend
- [ ] `/admin/resume` page — split view: current profile left, suggestions right
- [ ] Per-suggestion: Accept / Dismiss / Edit-then-Accept actions
- [ ] Confidence score badge (High/Medium/Low) on each suggestion
- [ ] "Apply All Accepted" bulk action → calls `/api/admin/resume/apply`
- [ ] After apply: triggers Vercel redeploy via API so live site updates

---

## Phase 14 — LinkedIn Sync (Agent: linkedin-agent)
**Approach:** LinkedIn data export (no scraping) + manual OAuth import

> **Why not full API?** LinkedIn's r_member_social scope (reading your own posts)
> requires app review and is granted to very few developers. The data export
> approach is ToS-compliant and gives full fidelity.

- [ ] Supabase: `linkedin_snapshots` table (exported JSON blobs + parsed fields)
- [ ] Backend `LinkedInParserService`:
  - Accepts uploaded LinkedIn data export ZIP (from Settings → Data Privacy → Export)
  - Parses `Profile.csv`, `Positions.csv`, `Skills.csv`, `Recommendations_Received.csv`
  - Maps to `profile` + `experience` table updates
  - Returns diff preview before applying
- [ ] `POST /api/admin/linkedin/import` — multipart upload → parsed diff
- [ ] `POST /api/admin/linkedin/apply` — applies diff to Supabase
- [ ] Frontend `/admin/linkedin` page — upload zone + diff review

### LinkedIn Share Output (auto-generate, not auto-post)
- [ ] "Generate LinkedIn Post" button on each project/experience entry
- [ ] Uses profile + project data to draft a LinkedIn-ready post (copyable)
- [ ] "Generate Updated Summary" — drafts a new LinkedIn About section from current profile

---

## Phase 15 — Developer Benchmarking (Agent: dev-benchmark-agent)
**API:** GitHub public API (no auth needed, 60 req/hr · 5000 req/hr with token)

### Data collected per developer
- Public repos count · Stars received · Forks · Top languages (by bytes)
- Contribution streak · Pinned repos · Account age

### Backend
- [ ] `GitHubBenchmarkService`: fetches your profile + compares against a curated
      list of 20–50 target developers (stored in `benchmark_peers` table)
- [ ] `BenchmarkResult`: percentile rank per language, repos, stars, contribution frequency
- [ ] Cache results in Supabase `github_benchmarks` (TTL 7d)
- [ ] `GET /api/profile/benchmark` — public endpoint (no auth)
- [ ] Env var: `GITHUB_TOKEN` (optional, increases rate limit)

### Frontend
- [ ] Public `/benchmark` page — radar chart: your GitHub stats vs peer median
- [ ] Language breakdown bar chart (your distribution vs peers)
- [ ] "Top peers" leaderboard (anonymised by default, opt-in to show username)
- [ ] "Add peer" widget (admin-only, adds GitHub handle to benchmark list)

---

## Phase 16 — Professional Development Dashboard (Agent: pro-dev-agent)
**Access:** Admin-only (`/admin/growth`)

### Data sources
- Your `profile.skills` + `experience` (Supabase)
- Market insights (Phase 12)
- GitHub benchmarks (Phase 15)
- Manual learning log (new table)

### Backend
- [ ] Supabase migration: `learning_log` table
  ```sql
  id, resource_type (Course/Book/Cert/Project/Talk), title, provider,
  url, status (In Progress/Completed/Planned), completed_at, notes
  ```
- [ ] `GET /api/admin/growth/summary` — aggregated snapshot (skills coverage %, learning velocity, next recommended skills)
- [ ] `POST /api/admin/growth/log` + PATCH/DELETE — CRUD for learning log

### Frontend
- [ ] `/admin/growth` page with 4 panels:
  1. **Skill coverage** — your skills vs top-10 market skills (filled radar)
  2. **Learning log** — kanban: Planned → In Progress → Completed
  3. **GitHub activity** — contribution calendar embed (github-readme-stats iframe)
  4. **Next 3 recommended skills** — derived from market gaps + current trajectory

---

## Agent Orchestration Plan

```
ORCHESTRATOR (root agent)
│
├─► analytics-agent         Phase 8   — Amplitude SDK + events + dashboard
├─► spotify-agent           Phase 9   — SpotifyPlayer component + hero mount
├─► citation-agent          Phase 10  — /credits route + data + styling
│
├─► job-tracker-agent       Phase 11  — DB migration + API + Kanban UI
│
├─► market-research-agent   Phase 12  — Adzuna integration + nightly scheduler
│   └─► resume-updater-agent Phase 13 — depends on market insights
│
├─► linkedin-agent          Phase 14  — data export parser + diff UI
│
├─► dev-benchmark-agent     Phase 15  — GitHub API + radar chart
│   └─► pro-dev-agent       Phase 16  — depends on benchmarks + market data
│
└─► polish-agent            Phase 7   — animations, Lighthouse, real assets
```

### Sub-agent contracts
Each sub-agent receives:
- Project root path: `/Users/prathamsachan/Desktop/personal-web-app`
- Backend package root: `com.resume`
- Frontend src root: `frontend/src`
- Active Spring profile: `docker` (Railway) / `dev` (local)
- Supabase project ID: `nxqiuqlwyjimioosaiio`
- Coding standards: Java 21 records/sealed types where appropriate; TypeScript strict; Tailwind 4 CSS-first tokens; no inline styles except dynamic colour values
- Test requirement: every new backend class ≥ 95% JaCoCo coverage; every new frontend component has a Vitest test file
- Commit convention: `feat(phase-N): description` with Co-Authored-By trailer

### Execution order
```
Parallel batch 1 (no dependencies):
  analytics-agent · spotify-agent · citation-agent · polish-agent

Sequential batch 2 (job tracker is standalone):
  job-tracker-agent

Sequential batch 3 (market research must finish first):
  market-research-agent → resume-updater-agent

Parallel batch 4 (independent of batch 3):
  linkedin-agent · dev-benchmark-agent

Sequential batch 5 (needs batch 3 + 4):
  pro-dev-agent
```

### Environment variables needed (add to .env.example)
```bash
# Phase 8 — Amplitude
NEXT_PUBLIC_AMPLITUDE_API_KEY=

# Phase 9 — Spotify
NEXT_PUBLIC_SPOTIFY_TRACK_ID=5HTHMQ8wMAlF6cEo6bx0aL   # The Rebel Path

# Phase 12 — Adzuna
ADZUNA_APP_ID=
ADZUNA_APP_KEY=

# Phase 15 — GitHub
GITHUB_TOKEN=   # optional; increases rate limit from 60 to 5000 req/hr
GITHUB_USERNAME=pratO66

# Phase 15 — Benchmark peers (comma-separated GitHub usernames)
BENCHMARK_PEERS=torvalds,gaearon,addyosmani,kentcdodds,tj
```

---

## Deployment (live ✅)
- **Frontend** → https://frontend-liard-theta-28.vercel.app
- **Backend** → https://personal-web-app-backend-production.up.railway.app
- **DB** → Supabase `nxqiuqlwyjimioosaiio` (Railway internal Postgres + Supabase analytics)
- **Swagger UI** → `{backend-url}/swagger-ui/index.html`

## How to run locally
```bash
# Manual dev (recommended)
cd backend && ./run-dev.sh   # Spring Boot :8080, reads backend/.env
cd frontend && pnpm dev      # Next.js :3000
```

## How to run agents
```bash
# From repo root — example: spin up analytics agent
claude --agent analytics-agent "Implement Phase 8 per REMAINING_WORK.md"

# Full orchestration run (run from repo root)
claude "Read REMAINING_WORK.md agent orchestration plan and execute all phases
        in the documented parallel/sequential batches. Report blockers."
```
