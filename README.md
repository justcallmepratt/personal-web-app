# 🌆 Night City Dev — Cyberpunk Personal Portfolio

[![CI](https://github.com/justcallmepratt/personal-web-app/actions/workflows/ci.yml/badge.svg)](https://github.com/justcallmepratt/personal-web-app/actions/workflows/ci.yml)
[![CodeQL](https://github.com/justcallmepratt/personal-web-app/actions/workflows/codeql.yml/badge.svg)](https://github.com/justcallmepratt/personal-web-app/actions/workflows/codeql.yml)
[![Java](https://img.shields.io/badge/Java-21-ED8B00?style=flat&logo=openjdk)](https://openjdk.org/projects/jdk/21/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.1-6DB33F?style=flat&logo=springboot)](https://spring.io/projects/spring-boot)
[![Next.js](https://img.shields.io/badge/Next.js-16-000?style=flat&logo=nextdotjs)](https://nextjs.org)
[![Tailwind](https://img.shields.io/badge/Tailwind-4-38BDF8?style=flat&logo=tailwindcss)](https://tailwindcss.com)
[![Vercel](https://img.shields.io/badge/Frontend-Vercel-000?style=flat&logo=vercel)](https://vercel.com)


The personal portfolio of Pratham Sachan, a backend developer, in a **CP2077 Neo
Militarism** visual style (unofficial fan styling; see `/credits` on the site).

The repository holds three Next.js apps and a Spring Boot API:

| Part | Path | State |
|---|---|---|
| Public site | `frontend/` | Live on Vercel at https://justcallmepratt.dev. Home, projects (with an "In the works" list), experience, skills, certifications, research, resume (page and generated PDF), contact and credits pages, and a GitHub activity section. Content from the API, with `frontend/src/content/index.ts` as fallback. |
| REST API | `backend/` | Deployed on Railway and used by the production site for profile, projects and experience (the database holds the real content). Contact messages relayed to it are stored; email needs mail variables on Railway. See [Outstanding work](docs/DEPLOYMENT.md#outstanding-work). |
| Kafka demo page | `apps/kafka/` | A copy of the demo built as a micro-frontend, kept for later; not deployed and not planned. The demo runs from `frontend/` at `/projects/kafka`, and `/kafka` redirects there. |
| Admin app | `apps/admin/` | Sign-in and contact-message inbox, deployed as the Vercel project `admin` and served at `/admin` through the microfrontends group. Sign-in waits on an admin password reset (username `psachan`; failed sign-ins limited to 5 per client and 30 overall per 15 minutes). See [Turn on admin](docs/DEPLOYMENT.md#turn-on-admin). |

In production `frontend` reads the API on the server (`BACKEND_URL`) and falls back to
`frontend/src/content/index.ts` if it is unavailable; certifications and the "In the
works" list come only from that file, as do education and research. The research papers'
PDFs are static files in `frontend/public/research/`. Previews and local runs use the
file alone.

The site also hosts a **live Apache Kafka demo** at `/projects/kafka`: a visitor sends a
record, it goes through a real broker and a Spring Boot consumer on Railway, is stored
in Supabase, and shows up on the page. The service is a separate repo,
[Kafka-Producer-Consumer-Demo](https://github.com/justcallmepratt/Kafka-Producer-Consumer-Demo);
this repo holds the page and the relay routes.

The **Athlink** recruiting prototype is linked from its project card but lives in its own
repo, [Athllinkmvp-DEMO](https://github.com/justcallmepratt/Athllinkmvp-DEMO), deployed
as a separate Vercel project at https://athllinkmvp-demo.vercel.app/ (sample data only).
It is not a micro-frontend; see [Athlink demo](docs/DEPLOYMENT.md#athlink-demo).

**Live:** https://justcallmepratt.dev  
**Kafka live demo:** https://justcallmepratt.dev/projects/kafka  
**Deployment, configuration and outstanding work:** [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)  
**Code layout:** [`docs/CODEBASE_STRUCTURE.md`](docs/CODEBASE_STRUCTURE.md)  
**Resume guide:** [`docs/RESUME_GUIDE.md`](docs/RESUME_GUIDE.md)  
**JobSync and the importer:** [`docs/JOBSYNC_IMPORTER.md`](docs/JOBSYNC_IMPORTER.md)  
**Roadmap, research notes and phase briefs (moved to Notion):** [Planning docs](#planning-docs)

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Backend runtime | Java (Amazon Corretto in Docker) | 21 |
| Backend framework | Spring Boot | 4.1 |
| Backend ORM | Spring Data JPA + Hibernate | 7.4 (resolved by Boot 4.1) |
| Database | Supabase Postgres (backend only) | — |
| JWT | jjwt | 0.13 |
| API docs | springdoc-openapi | 3.2 |
| Frontend framework | Next.js (App Router) | 16 |
| UI library | React | 19 |
| Language | TypeScript | 5 (`frontend`), 6 (`apps/*`) |
| Styling | Tailwind CSS | 4 |
| Animation | Framer Motion | 14 |
| Node.js | CI runs 22; `frontend/Dockerfile` uses `node:20-alpine` | 22 / 20 |
| Package manager | pnpm | 9 |
| Backend tests | JUnit + Mockito + JaCoCo; Testcontainers (PostgreSQL 15) for persistence | — |
| Frontend tests | Vitest + React Testing Library | — |
| Container | Docker (multi-stage) | — |
| Frontend hosting | Vercel | — |
| Backend hosting | Railway (deployed; used by the production site) | — |
| Kafka demo service | Spring Boot + Apache Kafka (KRaft) on Railway, Supabase Postgres | separate repo |

---

## Local Development

The frontend needs no backend: without `BACKEND_URL` it serves content from
`frontend/src/content`.

```bash
git clone https://github.com/justcallmepratt/personal-web-app.git
cd personal-web-app/frontend
pnpm install
pnpm dev                            # Next.js on :3000
```

The other apps run the same way from their own directories: `apps/admin`
(`BACKEND_URL=http://localhost:8080 pnpm dev`, <http://localhost:3001/admin>) and
`apps/kafka` (`KAFKA_DEMO_URL=http://localhost:<port> pnpm dev`,
<http://localhost:3002/kafka>).

Full stack (Postgres + API + frontend reading from the API). Set `JWT_SECRET` and
`ADMIN_PASSWORD_HASH` in `.env` first (see `.env.example`); compose refuses to start
without them rather than fall back to a known default:

```bash
docker compose up --build
```

Running the API outside Docker:

```bash
cp backend/.env.example backend/.env   # fill in SUPABASE_DB_PASSWORD and JWT_SECRET
cd backend && ./run-dev.sh             # Spring Boot on :8080
```

`run-dev.sh` sources `backend/.env` but does not set `SPRING_PROFILES_ACTIVE`, so the
application's default profile (`dev`, Supabase Postgres) applies. It also hard-codes an
x86_64 Corretto 21 path, which fails on Apple Silicon ("Bad CPU type in executable");
there, use an arm64 JDK 21 and run `./mvnw spring-boot:run` yourself, or use Docker.

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for production configuration.

---

## Running Tests

```bash
# Backend — tests; JaCoCo report in backend/target/site/jacoco/
cd backend && ./mvnw -B test

# Backend — also builds the JAR and enforces the JaCoCo coverage gate (what CI runs)
cd backend && ./mvnw -B verify

# Backend — only the PostgreSQL persistence tests (needs Docker)
cd backend && ./mvnw -B test -Dtest=PostgresPersistenceTest

# Frontend (and likewise apps/admin, apps/kafka)
cd frontend && pnpm test

# Frontend with coverage (report in frontend/coverage/index.html)
cd frontend && pnpm test:coverage
```

**What needs Docker.** Most backend tests are Mockito unit tests and `@WebMvcTest`
slices and need only a JDK 21. `PostgresPersistenceTest` starts a throwaway
`postgres:15-alpine` container with Testcontainers, creates the schema by running
`supabase/init.sql` unchanged, and boots the application with Hibernate in `validate`
mode; it then round-trips every entity and calls every repository query. It needs a
running Docker daemon. Without one it is **skipped** with the reason "Docker is not
available" and the rest of the suite still runs; CI fails the build if it is skipped
there. To try another server version: `-Dpostgres.image=postgres:17-alpine`.

The `test` profile's H2 database cannot create the `JSONB` tables (Hibernate logs the
failed DDL and carries on), so `ResumeApplicationTests` only proves the context starts.
Anything that must hold against the real schema belongs in `PostgresPersistenceTest`.

**Coverage gates.**

- Backend: `backend/pom.xml` fails the `verify` phase if bundle instruction coverage
  is below 95% (`ResumeApplication` and `SeedRunner` excluded). CI runs `mvn verify`,
  so the gate is enforced on every pull request.
- Frontend (not enforced by CI): `frontend/vitest.config.ts` sets thresholds of 95% lines, functions and
  statements and 90% branches. They apply only to `pnpm test:coverage`; CI runs
  `pnpm test`.

---

## Project Structure

```
personal-web-app/
├── backend/
│   ├── src/main/java/com/resume/
│   │   ├── config/         GlobalExceptionHandler, SecurityConfig, CorsConfig, OpenApiConfig
│   │   ├── controller/     Profile, Project, Experience, Contact, Admin
│   │   ├── dto/            ContactRequest, ApiResponse, LoginRequest
│   │   ├── model/          Profile, Project, Experience, Message, Skill
│   │   ├── repository/     Spring Data JPA repositories
│   │   ├── security/       JwtFilter, JwtUtil
│   │   └── service/        Profile, Project, Experience, Contact, EmailValidation, RateLimit
│   ├── src/test/           JUnit tests
│   ├── railway.toml        Railway build and health check
│   └── Dockerfile          Multi-stage: Maven build → Corretto 21 runtime
├── frontend/               The public site (Vercel project `frontend`)
│   ├── src/app/            App Router pages; api/contact and api/kafka are route handlers
│   ├── src/components/     layout/, sections/, ui/
│   ├── src/content/        Profile, projects, experience, certifications, research (edit to update the site)
│   ├── src/lib/            api.ts (content source), contact.ts, github.ts, kafka.ts, site.ts, types.ts
│   ├── src/test/           Vitest + RTL tests
│   ├── public/research/    The research papers as PDFs
│   ├── microfrontends.json Vercel microfrontends config: this app, and admin at /admin
│   ├── vercel.json         Security headers
│   └── Dockerfile          Multi-stage: pnpm build → standalone output
├── apps/
│   ├── admin/              Admin sign-in and message inbox (/admin/*), Vercel project admin
│   └── kafka/              Kafka demo as a micro-frontend, not deployed
├── docs/
│   ├── DEPLOYMENT.md       How the site is deployed, configured, and what is outstanding
│   ├── CODEBASE_STRUCTURE.md
│   ├── JOBSYNC_IMPORTER.md JobSync locally, and the importer that proposes skill suggestions
│   └── RESUME_GUIDE.md     How the resume is written and checked for ATS parsers
├── tools/jobsync-importer/ Local command-line importer (Node 22, no dependencies)
├── supabase/init.sql       Database schema (local Docker dev; applied to Supabase)
├── .github/workflows/      ci, codeql, docker-build, release, dependabot-auto-merge, stale, summary
├── docker-compose.yml      Local Postgres + API + frontend
├── .env.example            Environment variables, documented
└── SECURITY.md
```

---

## API Reference

Served by the Spring Boot backend (deployed on Railway; called by the production site).
Interactive docs at `/swagger-ui/index.html` on a running instance; health at
`/actuator/health`.

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/profile` | public | Developer profile + skills |
| `GET` | `/api/projects` | public | All projects (`?featured=true` to filter) |
| `GET` | `/api/projects/{id}` | public | Single project |
| `GET` | `/api/experience` | public | Work history |
| `POST` | `/api/contact` | public | Send contact message |
| `GET` | `/api/contact/validate-email` | public | Check an email address |
| `POST` | `/api/admin/auth/login` | — | Returns JWT; 503 until `ADMIN_PASSWORD_HASH` is set; 429 after too many failures |
| `GET` | `/api/admin/messages` | JWT | Contact message inbox |
| `PATCH` | `/api/admin/messages/{id}/read` | JWT | Toggle read status |

The frontend also has its own `POST /api/contact` route handler, which relays to the
API when `BACKEND_URL` is set and otherwise sends mail itself.

Two more route handlers serve the Kafka demo and relay to the Kafka demo service when
`KAFKA_DEMO_URL` is set (503 otherwise):

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/kafka/produce` | Publish one record (`sid`, optional `key`, `message`) |
| `GET` | `/api/kafka/messages?sid=…` | Records the consumer has stored for that browser session |

---

## Planning docs

Planning and history docs moved to Notion on 2026-11-24, under
[Night City Dev — Planning archive](https://app.notion.com/p/4225bf59b8cc810b8729ec796f9b2c73),
so they don't drift next to the code. They are kept as history and not updated; the last
repo versions are at commit
[`176f030`](https://github.com/justcallmepratt/personal-web-app/tree/176f030/docs).

| Was in the repo | Notion page |
|---|---|
| `docs/ROADMAP.md` | [Roadmap](https://app.notion.com/p/4225bf59b8cc81c2a80cd113cd9d99d8): phase status, the owner's decisions, security follow-ups |
| `docs/RESEARCH.md` | [Research notes](https://app.notion.com/p/4225bf59b8cc813c91bdcc6d5fca7af4): the findings behind the roadmap |
| `docs/HOW_IT_WAS_BUILT.md` | [How This Project Was Built](https://app.notion.com/p/4225bf59b8cc8147abb9f348eaa0eed0): the May 2026 build narrative |
| `docs/agents/ORCHESTRATOR.md` | [Agent Orchestrator](https://app.notion.com/p/4225bf59b8cc81048b5ed761aa03ceaf): the phase index and each phase's status |
| `docs/agents/phase-*.md` | Phase briefs [7 — Visual polish](https://app.notion.com/p/4225bf59b8cc81b2aad9fc179d0d7d36), [8 — Analytics](https://app.notion.com/p/4225bf59b8cc81e28b8bdfdac38e6587), [9 — Spotify player](https://app.notion.com/p/4225bf59b8cc81f785bcf5ef7a6ee370), [10 — Credits page](https://app.notion.com/p/4225bf59b8cc81e3a553ee5d7c7d7344), [11 — Job application tracker](https://app.notion.com/p/4225bf59b8cc8162a492c59a3c29992f), [12 — Market research engine](https://app.notion.com/p/4225bf59b8cc81bfaa5edb942251b2b5), [13 — Resume auto-updater](https://app.notion.com/p/4225bf59b8cc81d480b0f9be6c67241a), [14 — LinkedIn sync](https://app.notion.com/p/4225bf59b8cc81b8be94ff0ea1668971), [15 — GitHub benchmarking](https://app.notion.com/p/4225bf59b8cc81b8a91aeee2df0e38ab), [16 — Pro dev dashboard](https://app.notion.com/p/4225bf59b8cc81f7be8cd220a6a65984), [17 — Cloud production deploy](https://app.notion.com/p/4225bf59b8cc81a7b78bf1184b4afdef) |

What is still outstanding is in [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md#outstanding-work).

---

## Contributing

1. Fork and clone
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Run the checks before pushing:
   - Backend: `cd backend && ./mvnw -B verify`
   - Frontend, and likewise `apps/admin` and `apps/kafka`:
     `cd frontend && pnpm exec tsc --noEmit && pnpm lint && pnpm test && pnpm build`
4. Open a PR against `main`. The CI jobs `Backend — Java 21 / Maven`,
   `Frontend — Node 22 / pnpm` and `Admin — Node 22 / pnpm` are required and must pass
   before merging.

Report security issues as described in [`SECURITY.md`](SECURITY.md), not in public issues.
