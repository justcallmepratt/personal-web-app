# Codebase Structure

What is actually in the repository. For how it is deployed, see
[DEPLOYMENT.md](DEPLOYMENT.md).

## Frontend — Next.js 16 (TypeScript, Tailwind 4)

`frontend/AGENTS.md` applies: this Next.js version differs from older ones, so check
`node_modules/next/dist/docs/` before using an API.

```
frontend/src/
├── app/
│   ├── layout.tsx                → Root layout: fonts, metadata, navbar, footer
│   ├── page.tsx                  → Home: hero + featured projects
│   ├── projects/page.tsx         → All projects
│   ├── experience/page.tsx       → Career timeline
│   ├── skills/page.tsx           → Skill bars by category
│   ├── contact/page.tsx          → Contact form
│   ├── api/contact/route.ts      → POST handler: validate → rate-limit → send email
│   ├── error.tsx, loading.tsx    → Error boundary and loading states
│   └── globals.css               → Tailwind 4 theme (cp-* colours)
│
├── content/
│   └── index.ts                  → profile, projects, experience — the site's content
│
├── components/
│   ├── layout/                   → Navbar, HUDChrome, ScanlineOverlay
│   ├── sections/                 → HeroSection, ProjectsGrid, ExperienceTimeline,
│   │                               SkillsChart, ContactForm
│   └── ui/                       → GlitchText, NeonButton, NeonCard, SkillBar, TerminalInput
│
├── lib/
│   ├── api.ts                    → Content source seam + sendContact
│   ├── contact.ts                → Server-only: validation, rate limit, SMTP send
│   └── types.ts                  → Profile, Project, Experience, ContactPayload, ApiResponse
│
└── test/                         → Vitest + React Testing Library, mirrors src/
```

Outside `src/`: `frontend/vercel.json` sets the security headers (HSTS, X-Frame-Options, Referrer-Policy and others) and cache headers
and build commands for Vercel.

### Rules

1. **Pages get data through `lib/api.ts`**, never by importing `content/` directly.
   With `BACKEND_URL` set it fetches `/api/profile`, `/api/projects`, `/api/experience`
   from the Spring Boot API and falls back to the repo content if that fails; without
   it, it returns the repo content.
2. **The contact form always posts to this app's `/api/contact`**, which relays to the
   API when `BACKEND_URL` is set and otherwise sends mail itself. `lib/contact.ts`
   uses Node APIs and must only be imported from server code.
3. **Pages are static**, re-rendered at most hourly. Only `/api/contact` runs per request.
4. Checks before pushing: `pnpm exec tsc --noEmit && pnpm lint && pnpm test && pnpm build`.

## `apps/kafka`

A self-contained app like `apps/admin`, with its own `package.json` and lockfile: the
live Kafka demo, served under `/kafka/*`. Not deployed yet; see
[DEPLOYMENT.md](DEPLOYMENT.md#kafka-app). Its page, relay routes and helpers are copies
of the ones in `frontend/` (`KafkaDemo.tsx`, `lib/kafka.ts`, `app/api/kafka/*`), which
stay live until the cutover described there.

## Admin — Next.js 16 (TypeScript, Tailwind 4)

`apps/admin` is a self-contained app with its own `package.json` and lockfile: admin
sign-in and the contact-message inbox, served under `/admin/*`. Not deployed yet; see
[DEPLOYMENT.md](DEPLOYMENT.md#admin-app). `apps/admin/AGENTS.md` applies here too.

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

The service layer: content, contact messages and admin auth. Intended for Railway from
`backend/` (see `backend/railway.toml`); not live yet. Built and tested in CI.

```
backend/src/main/java/com/resume/
├── ResumeApplication.java        → Entry point
├── SeedRunner.java               → Seeds placeholder data on the dev and docker profiles
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
`docker compose`. Tables: `profile`, `projects`, `experience`, `messages`. List-like
fields (`tech_stack`, `skills`, `tags`, `stack`, `highlights`, `technologies`,
`socials`) are `JSONB`; `tags`, `stack`, `technologies` and `skills` have GIN indexes.
The `DEFAULT '[]'` on those columns does not apply to rows written through JPA
(Hibernate inserts an explicit `NULL`, which `NOT NULL` rejects), so code must set them.

## Workflows — `.github/workflows/`

| File | Trigger | Does |
|---|---|---|
| `ci.yml` | push / PR to `main` | Backend compile, then `mvn verify` (tests including PostgreSQL via Testcontainers, JAR, JaCoCo gate); frontend and admin type check, lint, test, build. No deploy. |
| `docker-build.yml` | push to `main`, manual | Builds and pushes backend and frontend images to GHCR |
| `release.yml` | `v*.*.*` tag | JAR + versioned images + GitHub release |
| `codeql.yml` | schedule / push | Code scanning |
| `dependabot-auto-merge.yml` | Dependabot PRs | Auto-merges patch/minor updates |
| `stale.yml`, `summary.yml` | schedule / issues | Housekeeping |

Deployment is done by Vercel's Git integration, not by a workflow.

## Other docs

- `docs/agents/` — phase briefs for planned features. They assume the original
  Railway-hosted backend and predate this structure; treat their deployment steps and
  file lists as out of date.
- `docs/VALIDATION.md` — validation report from 2026-05-18 against the old deployment.
