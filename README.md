# 🌆 Night City Dev — Cyberpunk Personal Portfolio

[![CI](https://github.com/justcallmepratt/personal-web-app/actions/workflows/ci.yml/badge.svg)](https://github.com/justcallmepratt/personal-web-app/actions/workflows/ci.yml)
[![CodeQL](https://github.com/justcallmepratt/personal-web-app/actions/workflows/codeql.yml/badge.svg)](https://github.com/justcallmepratt/personal-web-app/actions/workflows/codeql.yml)
[![Java](https://img.shields.io/badge/Java-21-ED8B00?style=flat&logo=openjdk)](https://openjdk.org/projects/jdk/21/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.1-6DB33F?style=flat&logo=springboot)](https://spring.io/projects/spring-boot)
[![Next.js](https://img.shields.io/badge/Next.js-16-000?style=flat&logo=nextdotjs)](https://nextjs.org)
[![Tailwind](https://img.shields.io/badge/Tailwind-4-38BDF8?style=flat&logo=tailwindcss)](https://tailwindcss.com)
[![Vercel](https://img.shields.io/badge/Frontend-Vercel-000?style=flat&logo=vercel)](https://vercel.com)


A full-stack personal portfolio styled after the **CP2077 Neo Militarism** aesthetic.

Today one Next.js app (`frontend/`) is deployed on Vercel. A second one, the `admin`
micro-frontend in `apps/admin` (login and message inbox), is built but not deployed
yet; see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md#admin-app). A third, `apps/kafka`, is
the live Kafka demo as its own micro-frontend, also built but not deployed; the demo
currently runs from `frontend/` ([details](docs/DEPLOYMENT.md#kafka-app)). The Spring Boot REST API
in `backend/` is built and tested in CI but **is not deployed yet**, so the live site
serves the content kept in the repo (`frontend/src/content`). When `BACKEND_URL` is
set, pages read the API on the server and fall back to that same content if it is
unavailable.

The site also hosts a **live Apache Kafka demo** at `/projects/kafka`: a visitor sends a
record, it goes through a real broker and a Spring Boot consumer on Railway, is stored
in Supabase, and shows up on the page. The service is a separate repo,
[Kafka-Producer-Consumer-Demo](https://github.com/justcallmepratt/Kafka-Producer-Consumer-Demo);
this repo holds the page and the relay routes. See
[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md#kafka-live-demo).

**Live:** https://justcallmepratt.dev  
**Kafka live demo:** https://justcallmepratt.dev/projects/kafka  
**Deployment and configuration:** [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)  
**Code layout:** [`docs/CODEBASE_STRUCTURE.md`](docs/CODEBASE_STRUCTURE.md)  
**Roadmap (prioritised plan for the remaining phases):** [`docs/ROADMAP.md`](docs/ROADMAP.md)  
**Research behind the roadmap (site review, third-party limits):** [`docs/RESEARCH.md`](docs/RESEARCH.md)  
**How the original version was built (historical):** [`docs/HOW_IT_WAS_BUILT.md`](docs/HOW_IT_WAS_BUILT.md)

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
| Language | TypeScript | 5 |
| Styling | Tailwind CSS | 4 |
| Animation | Framer Motion | 12 |
| Node.js | CI runs 22; `frontend/Dockerfile` uses `node:20-alpine` | 22 / 20 |
| Package manager | pnpm | 9 |
| Backend tests | JUnit + Mockito + JaCoCo; Testcontainers (PostgreSQL 15) for persistence | — |
| Frontend tests | Vitest + React Testing Library | — |
| Container | Docker (multi-stage) | — |
| Frontend hosting | Vercel | — |
| Backend hosting | Railway (not live yet) | — |
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

Full stack (Postgres + API + frontend reading from the API):

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

# Frontend
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
├── frontend/
│   ├── src/app/            App Router pages; api/contact/route.ts is the contact handler
│   ├── src/components/     layout/, sections/, ui/
│   ├── src/content/        Profile, projects, experience (edit to update the site)
│   ├── src/lib/            api.ts (content source), contact.ts (validation, rate limit, SMTP), types.ts
│   ├── src/test/           Vitest + RTL tests
│   ├── vercel.json         Security headers
│   └── Dockerfile          Multi-stage: pnpm build → standalone output
├── docs/
│   ├── DEPLOYMENT.md       How the site is deployed and configured (current)
│   ├── CODEBASE_STRUCTURE.md
│   ├── HOW_IT_WAS_BUILT.md Historical build narrative (May 2026)
│   ├── VALIDATION.md       Old validation snapshot (May 2026)
│   └── agents/             Unbuilt design briefs
├── supabase/init.sql       Schema for local Docker dev
├── .github/workflows/      ci, codeql, docker-build, release, dependabot-auto-merge, stale, summary
├── docker-compose.yml      Local Postgres + API + frontend
├── .env.example            Environment variables, documented
└── SECURITY.md
```

---

## API Reference

Served by the Spring Boot backend (not deployed yet). Interactive docs at
`/swagger-ui/index.html` on a running instance.

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/profile` | public | Developer profile + skills |
| `GET` | `/api/projects` | public | All projects (`?featured=true` to filter) |
| `GET` | `/api/projects/{id}` | public | Single project |
| `GET` | `/api/experience` | public | Work history |
| `POST` | `/api/contact` | public | Send contact message |
| `GET` | `/api/contact/validate-email` | public | Check an email address |
| `POST` | `/api/admin/auth/login` | — | Returns JWT |
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

## Roadmap

From [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md#roadmap):

1. Live on the domain: done.
2. Backend on Railway, using the existing Supabase project as its database.
3. Monorepo: move `frontend/` to `apps/web`, extract shared UI and API types.
4. `admin` micro-frontend: login and inbox are built (`apps/admin`); deploying it and the job tracker remain.

[`docs/agents/`](docs/agents/) holds design briefs for further features (analytics,
credits page, job tracker, market research and others). They are unbuilt, mostly
predate the current hosting setup, and carry a status note at the top of each file.

---

## Contributing

1. Fork and clone
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Run the checks before pushing:
   - Backend: `cd backend && ./mvnw -B verify`
   - Frontend: `cd frontend && pnpm exec tsc --noEmit && pnpm lint && pnpm test && pnpm build`
4. Open a PR against `main`. The CI jobs `Backend — Java 21 / Maven` and
   `Frontend — Node 22 / pnpm` are required and must pass before merging.

Report security issues as described in [`SECURITY.md`](SECURITY.md), not in public issues.
