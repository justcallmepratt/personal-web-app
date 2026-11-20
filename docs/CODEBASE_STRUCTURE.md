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

### Rules

1. **Pages get data through `lib/api.ts`**, never by importing `content/` directly.
   `api.ts` returns the repo content unless `BACKEND_URL` is set, in which case it
   fetches `/api/profile`, `/api/projects`, `/api/experience` from that host.
2. **The contact form always posts to this app's `/api/contact`.** `lib/contact.ts`
   uses Node APIs and must only be imported from server code.
3. **Pages are static.** Only `/api/contact` runs per request.
4. Checks before pushing: `pnpm exec tsc --noEmit && pnpm lint && pnpm test && pnpm build`.

## Backend — Spring Boot 3.5 (Java 21), optional

Not deployed. Kept as an alternative content source and built/tested in CI.

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

## Database — Postgres (backend only)

Schema: [`supabase/init.sql`](../supabase/init.sql), applied automatically by
`docker compose`. Tables: `profile`, `projects`, `experience`, `messages`. List-like
fields (`tech_stack`, `skills`, `tags`, `stack`, `highlights`, `technologies`,
`socials`) are `JSONB`.

## Workflows — `.github/workflows/`

| File | Trigger | Does |
|---|---|---|
| `ci.yml` | push / PR to `main` | Backend compile, test, package; frontend type check, lint, test, build. No deploy. |
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
