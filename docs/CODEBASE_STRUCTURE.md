# Codebase Structure

What is actually in the repository. For how it is deployed, see
[DEPLOYMENT.md](DEPLOYMENT.md).

## Frontend — Next.js 16 (TypeScript, Tailwind 4)

`frontend/AGENTS.md` applies: this Next.js version differs from older ones, so check
`node_modules/next/dist/docs/` before using an API.

```
frontend/src/
├── app/
│   ├── layout.tsx                → Root layout: fonts, metadata, JSON-LD, skip link, navbar, footer
│   ├── page.tsx                  → Home: hero, featured projects, GitHub activity
│   ├── projects/page.tsx         → All projects, then planned ones under "In the works"
│   ├── projects/kafka/page.tsx   → Live Kafka demo (relays via api/kafka/*)
│   ├── robots.ts, sitemap.ts, opengraph-image.tsx → Crawling and social-preview metadata
│   ├── experience/page.tsx       → Career timeline
│   ├── skills/page.tsx           → Skills by category (a bar only for skills with a `level`)
│   ├── certifications/page.tsx   → Certifications, from the content file
│   ├── contact/page.tsx          → Contact form
│   ├── credits/page.tsx          → Credits, licences and the unofficial-fan-work disclaimer (data in lib/credits.ts)
│   ├── api/contact/route.ts      → POST handler: validate → relay to API, else rate-limit → SMTP
│   ├── api/kafka/{produce,messages}/route.ts → Relay to the Kafka demo service
│   ├── error.tsx, loading.tsx    → Error boundary and loading states
│   └── globals.css               → Tailwind 4 theme (cp-* colours)
│
├── content/
│   └── index.ts                  → profile, projects, plannedProjects, experience,
│                                   certifications — the site's content (the owner's real profile)
│
├── components/
│   ├── layout/                   → Navbar, Footer, SkipLink, HUDChrome, ScanlineOverlay
│   ├── sections/                 → HeroSection, ProjectsGrid, ExperienceTimeline,
│   │                               SkillsChart, CertificationsList, PlannedProjects, ContactForm,
│   │                               GitHubActivity, KafkaDemo
│   └── ui/                       → GlitchText, NeonButton, NeonCard, SkillBar, TerminalInput
│
├── lib/
│   ├── api.ts                    → Content source seam + sendContact
│   ├── contact.ts                → Server-only: validation, rate limit, SMTP send
│   ├── contactEmail.ts           → Public `mailto:` address from NEXT_PUBLIC_CONTACT_EMAIL
│   ├── kafka.ts                  → Server-only: Kafka demo relay (session ids, limits, timeout)
│   ├── site.ts                   → Site name, URL and description for metadata
│   ├── credits.ts, theme.ts      → Credits page data, theme constants
│   ├── github.ts                 → Server-only: owner's public repos from the GitHub API
│   │                               (hourly, 5 s timeout, never throws), language summary
│   └── types.ts                  → Profile, Project, PlannedProject, Experience, Certification,
│                                   ContactPayload, ApiResponse
│
└── test/                         → Vitest + React Testing Library, mirrors src/
```

Outside `src/`: `frontend/vercel.json` sets the security headers (HSTS, X-Frame-Options,
Referrer-Policy and others), cache headers and build commands for Vercel;
`frontend/next.config.ts` wraps the config in `withMicrofrontends` (this app is the
default application of the planned Vercel microfrontends group) and
`frontend/microfrontends.json` lists only this app for now. `next.config.ts` also serves
the redirects in `src/lib/redirects.ts`: `/kafka` and everything under it go to
`/projects/kafka`.

### Rules

1. **Pages get data through `lib/api.ts`**, never by importing `content/` directly.
   With `BACKEND_URL` set it fetches `/api/profile`, `/api/projects`, `/api/experience`
   from the Spring Boot API and falls back to the repo content if that fails; without
   it, it returns the repo content.
2. **The contact form always posts to this app's `/api/contact`**, which relays to the
   API when `BACKEND_URL` is set and otherwise sends mail itself. `lib/contact.ts`
   uses Node APIs and must only be imported from server code.
3. **Pages are static**, re-rendered at most hourly. Only `/api/contact` and the two
   `/api/kafka/*` handlers run per request.
4. Checks before pushing: `pnpm exec tsc --noEmit && pnpm lint && pnpm test && pnpm build`.

### Content shape

`content/index.ts` is the fallback for the API content and the only source of
certifications and planned projects; in production the database is what visitors see for
profile, projects and experience, so keep the two in step. The site is public, so it holds only facts the owner has confirmed; `test/content/content.test.ts`
guards against placeholder links, an email address or a phone number coming back.

- **Optional means "leave it out".** `Skill.level` is optional and unset, so the skills
  page lists names by category with no percentage. `Profile.email` is `''` (the hero
  hides the row). An experience entry with `current: false` and `endDate: null` shows
  its start month only, never "PRESENT"; use that when an end date is not confirmed.
- **CV.** There is no `public/cv.pdf`. The "Download CV" button renders only when
  `profile.cvUrl` is set: add the real file as `frontend/public/cv.pdf` and set
  `cvUrl: '/cv.pdf'`.
- **Certifications** are `{ id, name, issuer, date?, credentialId?, url?, sortOrder? }`.
  `date` is ISO at whatever precision is known (`'2023'`, `'2023-05'`). The Spring API
  has no certifications endpoint, so `api.getCertifications()` always reads this file.
- **Planned projects** are `{ id, name, goal }` in their own `plannedProjects` array,
  read by `api.getPlannedProjects()` (repo content only). They are ideas with no code:
  `/projects` lists them under "In the works" below the real projects, with no links,
  dates or featured styling, and they never reach `getProjects()` or the home page.
  When one ships, move it into `projects`.
- **New fields in `types.ts` stay optional** so the Spring API's responses (which do
  send `level`, and may send `email` and `cvUrl`) keep type-checking.
- `backend/.../SeedRunner.java` and the seed rows in `supabase/init.sql` still hold the old
  placeholder persona; the Supabase database was loaded with the real content separately.
  `Skill.level` is optional in the API and omitted from the JSON when absent. Update the
  seed (see [DEPLOYMENT.md](DEPLOYMENT.md#outstanding-work)).

## `apps/kafka`

A self-contained app like `apps/admin`, with its own `package.json` and lockfile: the
live Kafka demo, served under `/kafka/*` (`src/app/kafka/page.tsx` and
`src/app/kafka/api/{produce,messages}`). Not deployed and not planned: there is no Vercel
`kafka` project, and `frontend` redirects `/kafka` to `/projects/kafka`; see
[DEPLOYMENT.md](DEPLOYMENT.md#if-you-want-the-separate-kafka-project-later). Its page,
relay routes and helpers are copies of the ones in `frontend/` (`KafkaDemo.tsx`,
`lib/kafka.ts`, `app/api/kafka/*`), which are the live ones. Checks as for the other
apps.

## Admin — Next.js 16 (TypeScript, Tailwind 4)

`apps/admin` is a self-contained app with its own `package.json` and lockfile: admin
sign-in and the contact-message inbox, served under `/admin/*`. Not deployed yet; see
[DEPLOYMENT.md](DEPLOYMENT.md#turn-on-admin). `apps/admin/AGENTS.md` applies here too.
`apps/kafka/AGENTS.md` likewise.

```
apps/admin/src/
├── app/
│   ├── layout.tsx                    → Root layout: fonts, noindex metadata
│   ├── globals.css                   → Theme tokens copied from frontend/
│   └── admin/
│       ├── page.tsx                  → Inbox; redirects to login without a session
│       ├── login/page.tsx            → Sign-in form
│       ├── loading.tsx, error.tsx
│       └── api/
│           ├── session/route.ts          → POST sign in (sets cookie), DELETE sign out
│           ├── session/expired/route.ts  → GET: clear cookie, redirect to login
│           ├── messages/route.ts         → GET list
│           └── messages/[id]/read/route.ts → PATCH toggle read
│
├── components/
│   ├── Inbox.tsx, LoginForm.tsx      → Client components
│   └── ui.tsx                        → NeonButton, Panel, TerminalInput, Notice
│
├── lib/
│   ├── backend.ts                    → Server-only: every call to the API (timeout,
│   │                                   response validation, failure kinds)
│   ├── session.ts                    → Server-only: session cookie options
│   ├── http.ts                       → Server-only: handler replies, origin check
│   ├── messages.ts, types.ts         → Shared by server and client
│   ├── client.ts                     → Browser side: request timeout, error and wait text
│
└── test/                             → Vitest + React Testing Library
```

### Rules

1. **Only `lib/backend.ts` talks to the API**, and only server code imports it. Client
   components call this app's own `/admin/api/*` handlers.
2. **The JWT lives in the `admin_session` cookie** (`httpOnly`, path `/admin`). Never
   return it in a response body or pass it to a client component.
3. **Every route stays under `src/app/admin/`** and the app sets no `basePath`; Vercel
   Microfrontends routes `/admin/*` here and does not support `basePath`.
4. **No `public/` directory** (see DEPLOYMENT.md). UI primitives and theme tokens are
   copies of the ones in `frontend/` until a shared package exists.
5. Checks before pushing: `pnpm exec tsc --noEmit && pnpm lint && pnpm test && pnpm build`.

## Backend — Spring Boot 4.1 (Java 21)

The service layer: content, contact messages and admin auth. Deployed on Railway from
`backend/` (service `personal-web-app-api`, see `backend/railway.toml` and
[DEPLOYMENT.md](DEPLOYMENT.md#railway-the-api)); the production site calls it. Built
and tested in CI.

```
backend/src/main/java/com/resume/
├── ResumeApplication.java        → Entry point
├── SeedRunner.java               → Seeds the old placeholder profile into empty tables (stale) on the dev and docker profiles
├── config/                       → SecurityConfig, CorsConfig, GlobalExceptionHandler, OpenApiConfig
├── controller/
│   ├── ProfileController         → GET /api/profile
│   ├── ProjectController         → GET /api/projects (?featured=true), GET /api/projects/{id}
│   ├── ExperienceController      → GET /api/experience
│   ├── ContactController         → POST /api/contact, GET /api/contact/validate-email
│   └── AdminController           → POST /api/admin/auth/login,
│                                   GET /api/admin/messages, PATCH /api/admin/messages/{id}/read
├── service/                      → Profile, Project, Experience, Contact,
│                                   EmailValidation, RateLimit
├── repository/                   → Profile, Project, Experience, Message (Spring Data JPA)
├── model/                        → Profile, Project, Experience, Message, Skill
├── dto/                          → ApiResponse, ContactRequest, LoginRequest
└── security/                     → JwtFilter, JwtUtil
```

Contact messages are guarded in layers: `EmailValidationService` rejects disposable
providers (a blocklist) and domains with no MX record (422), and `RateLimitService`
allows 3 submissions per hour per address by default (429; `CONTACT_RATE_LIMIT_MAX`,
`CONTACT_RATE_LIMIT_WINDOW`). `GET /api/contact/validate-email` exposes the first two.

Profiles: `dev` (Supabase Postgres via `SUPABASE_DB_PASSWORD`), `docker`
(`SPRING_DATASOURCE_*`), `test` (H2 in memory). Hibernate runs with
`ddl-auto: validate`, so the schema must already exist.

Tests (`backend/src/test/`): Mockito unit tests for services and security,
`@WebMvcTest` slices for controllers, and `ResumeApplicationTests`, which loads the
context on the `test` profile. H2 cannot create the `JSONB` tables there (the failed
DDL is only logged), so that profile never exercises the profile, project or experience
tables. `persistence/PostgresPersistenceTest` covers them: Testcontainers starts
PostgreSQL 15 (the major version in `docker-compose.yml`), `supabase/init.sql` is run
unchanged, the application starts with Hibernate in `validate` mode, and the test
round-trips each entity, checks the JSONB columns and indexes, and calls every
repository query method. It needs Docker and is skipped with a message without it; CI
fails if it is skipped. Any new table or entity should get a case there. `mvn verify`
also enforces the JaCoCo gate (95% instructions).

The `dev` profile's default datasource host is Supabase's direct host
(`db.<ref>.supabase.co`), which is IPv6-only on the free plan. Production should set
`SPRING_DATASOURCE_URL` to the Supabase session pooler instead (see
[DEPLOYMENT.md](DEPLOYMENT.md)).

## Database — Postgres (backend only)

Schema: [`supabase/init.sql`](../supabase/init.sql), applied automatically by
`docker compose` and already applied to the Supabase project the API uses. Tables: `profile`, `projects`, `experience`, `messages`. List-like
fields (`tech_stack`, `skills`, `tags`, `stack`, `highlights`, `technologies`,
`socials`) are `JSONB`; `tags`, `stack`, `technologies` and `skills` have GIN indexes.
The `DEFAULT '[]'` on those columns does not apply to rows written through JPA
(Hibernate inserts an explicit `NULL`, which `NOT NULL` rejects), so code must set them.

## Workflows — `.github/workflows/`

| File | Trigger | Does |
|---|---|---|
| `ci.yml` | push / PR to `main` | Backend compile, then `mvn verify` (tests including PostgreSQL via Testcontainers, JAR, JaCoCo gate); frontend, admin and kafka type check, lint, test, build. No deploy. The backend, frontend and admin jobs are required to merge. |
| `docker-build.yml` | push to `main`, manual | Builds and pushes backend and frontend images to GHCR |
| `release.yml` | `v*.*.*` tag | JAR + versioned images + GitHub release |
| `codeql.yml` | schedule / push | Code scanning |
| `dependabot-auto-merge.yml` | Dependabot PRs | Auto-merges patch/minor updates |
| `stale.yml`, `summary.yml` | schedule / issues | Housekeeping |

Deployment is done by Vercel's Git integration (site) and Railway's GitHub integration
(API), not by a workflow.

## Other docs

- `docs/agents/` — phase briefs. Each has a status block that agrees with
  [ROADMAP.md](ROADMAP.md); they predate the current structure, so treat their
  deployment steps and file lists as out of date.
- [`HOW_IT_WAS_BUILT.md`](HOW_IT_WAS_BUILT.md) — historical build narrative (May 2026).
