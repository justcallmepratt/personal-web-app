# 🌆 Night City Dev — Cyberpunk Personal Portfolio

[![CI](https://github.com/justcallmepratt/personal-web-app/actions/workflows/ci.yml/badge.svg)](https://github.com/justcallmepratt/personal-web-app/actions/workflows/ci.yml)
[![CodeQL](https://github.com/justcallmepratt/personal-web-app/actions/workflows/codeql.yml/badge.svg)](https://github.com/justcallmepratt/personal-web-app/actions/workflows/codeql.yml)
[![Java](https://img.shields.io/badge/Java-21-ED8B00?style=flat&logo=openjdk)](https://openjdk.org/projects/jdk/21/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5-6DB33F?style=flat&logo=springboot)](https://spring.io/projects/spring-boot)
[![Next.js](https://img.shields.io/badge/Next.js-16-000?style=flat&logo=nextdotjs)](https://nextjs.org)
[![Tailwind](https://img.shields.io/badge/Tailwind-4-38BDF8?style=flat&logo=tailwindcss)](https://tailwindcss.com)
[![Railway](https://img.shields.io/badge/Backend-Railway-0B0D0E?style=flat&logo=railway)](https://railway.app)
[![Vercel](https://img.shields.io/badge/Frontend-Vercel-000?style=flat&logo=vercel)](https://vercel.com)

A full-stack personal portfolio styled after the **CP2077 Neo Militarism** aesthetic.
Spring Boot REST API + Next.js App Router frontend, deployed on Railway + Vercel with Supabase Postgres.

**Live:** https://frontend-liard-theta-28.vercel.app  
**API:** https://personal-web-app-backend-production.up.railway.app  
**Swagger UI:** https://personal-web-app-backend-production.up.railway.app/swagger-ui/index.html

---

## How This Project Was Built — AI-Assisted Workflow

> This project was built end-to-end using **Claude Code** (Claude Sonnet) as the primary
> engineering agent. The sections below document the exact workflow so it can be
> replicated on other projects.

### The workflow in one sentence
*Provide a machine-readable spec → agent scaffolds → you review + approve → agent iterates until green.*

---

### Step 1 — Write the spec first (not the code)

Before any code was written, a detailed `AGENT_PLAN.md` was created (see the commit history).
It specified:

- Exact tech stack with pinned versions
- Repository layout down to every filename
- Domain models with all fields and types
- REST API contract (method, path, auth, request/response)
- Frontend component contracts (props, behaviour, CSS class strategy)
- A sequential `BUILD_ORDER` with phases and checkboxes
- Decision rules for edge cases ("IF adding a MongoDB field → update BOTH Java model AND TypeScript interface")

**Key insight:** The more precise the spec, the fewer back-and-forth iterations.
The agent read the spec top-to-bottom and executed phases sequentially without needing
clarification on most decisions.

---

### Step 2 — Scaffold with real tooling, not stubs

```bash
# Backend — Spring Initializr (via curl)
curl -sS "https://start.spring.io/starter.zip?type=maven-project&language=java\
&bootVersion=3.5.0&baseDir=backend&groupId=com.resume&artifactId=resume\
&packageName=com.resume&javaVersion=21&dependencies=web,data-jpa,security,\
validation,mail,postgresql" -o backend.zip && unzip -q backend.zip

# Frontend — create-next-app
pnpm create next-app@latest frontend --ts --tailwind --app --eslint
```

The agent detected version mismatches (Spring Boot Initializr minimum changed to 3.5,
Next.js latest is 16 not 14) and flagged them before proceeding.

---

### Step 3 — Use MCP connectors instead of manual configuration

Rather than setting up databases, deployments, and secrets by hand, the agent used
MCP (Model Context Protocol) server connectors:

| Connector | What it did |
|---|---|
| **Supabase MCP** | Applied DB migrations, checked security advisors, created GIN indexes |
| **Vercel MCP** | Deployed frontend, set environment variables |
| **Railway CLI** | Created project, provisioned Postgres, set 15 env vars |
| **GitHub CLI** | Set 9 repository secrets for CI/CD |
| **Google Calendar** | Created weekly Sunday code-review recurring event |
| **Gmail** | Connected for contact-form notification monitoring |
| **Amplitude MCP** | Set up analytics (Phase 8, API key configured) |

**Key insight:** Connectors eliminate the "copy-paste env vars" problem.
The agent wrote directly to Vercel and Railway; secrets never touched a file.

---

### Step 4 — Iterative debugging loop

Every non-trivial phase ended with a smoke test:

```bash
# Backend: curl all endpoints, check status codes
curl -s http://localhost:8080/api/profile | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['name'])"
curl -s -o /dev/null -w "HTTP %{http_code}" http://localhost:8080/api/admin/messages  # expect 403

# Frontend: screenshot every page at mobile + tablet viewport
preview_resize → mobile (375px) → screenshot → preview_resize → tablet (768px) → screenshot
```

When tests or screenshots revealed issues, the agent fixed them in the same session
without user intervention unless a decision was required.

---

### Step 5 — 12-Factor compliance from the start

All configuration lived in environment variables from day one.
The agent enforced the 12-factor app methodology across all layers:

```yaml
# application.yml — all values are ${ENV_VAR:default}
server:
  port: ${PORT:8080}
  shutdown: graceful
spring:
  datasource:
    url: ${SPRING_DATASOURCE_URL}
    username: ${SPRING_DATASOURCE_USERNAME:postgres}
    password: ${SPRING_DATASOURCE_PASSWORD}
```

No secrets in files. No hardcoded URLs. `.env` files are gitignored and generated
from `.env.example` by the developer.

---

### Step 6 — GitHub Actions wired automatically

The CI/CD pipeline was written and fixed in the same session:

```
push to main
  ├── backend (Java 21 + Maven)
  │   ├── compile
  │   ├── test (H2 in-memory, @ActiveProfiles("test"))
  │   ├── package
  │   └── deploy → Railway
  └── frontend (Node 22 + pnpm)
      ├── tsc --noEmit
      ├── eslint
      ├── next build
      └── deploy → Vercel
```

When CI failed (Railway OAuth token expired, Docker build missing `BACKEND_URL` arg,
TypeScript picking up Vitest test files), the agent diagnosed the root cause from
log snippets and fixed all three in a single commit.

---

### Step 7 — 95% test coverage, enforced by CI

Tests were written to cover every layer:

**Backend — JUnit 5 + Mockito (42 tests, JaCoCo 95% gate)**
```java
// Pattern: @WebMvcTest + @AutoConfigureMockMvc(addFilters=false) for public endpoints
// Pattern: @TestPropertySource for property-driven controller logic
@WebMvcTest(ProfileController.class)
@AutoConfigureMockMvc(addFilters = false)
class ProfileControllerTest {
    @Test
    void getProfile_returns404_whenServiceReturnsNull() throws Exception {
        when(profileService.get()).thenReturn(null);
        mockMvc.perform(get("/api/profile")).andExpect(status().isNotFound());
    }
}
```

**Frontend — Vitest + React Testing Library (66 tests)**
```tsx
// Pattern: mock next/navigation, stub fetch globally in beforeEach
it('successful submission shows success message', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    json: () => Promise.resolve({ success: true, message: 'Message received.' }),
  }))
  // ... fill form, submit, assert message appears
})
```

Key lesson: `OncePerRequestFilter.doFilter()` is `final` in Spring — Mockito can't
intercept it. The fix was `@AutoConfigureMockMvc(addFilters = false)` on all
controller tests that test business logic (not security).

---

### Step 8 — Agent orchestration for future phases

Future features are specified in `docs/agents/` as self-contained agent briefs.
Each file contains: objective, prerequisites, exact SQL migrations, Java class
signatures, React route layout, test requirements, and acceptance criteria.

An orchestrator can boot any agent with a single command:
```bash
claude "Read docs/agents/ORCHESTRATOR.md then docs/agents/phase-08-analytics.md
        and implement Phase 8. Commit with feat(phase-8): prefix."
```

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Backend runtime | Amazon Corretto JDK | 21 LTS |
| Backend framework | Spring Boot | 3.5.0 |
| Backend ORM | Spring Data JPA + Hibernate | 6.6 |
| Database (primary) | Railway Postgres | 17 |
| Database (analytics) | Supabase Postgres | 17 |
| JWT | jjwt | 0.13 |
| API docs | springdoc-openapi | 2.5 |
| Frontend runtime | Node.js | 20 LTS |
| Frontend framework | Next.js (App Router) | 16 |
| Language | TypeScript | 5 |
| Styling | Tailwind CSS | 4 |
| Animation | Framer Motion | 12 |
| Package manager | pnpm | 9 |
| Backend tests | JUnit 5 + Mockito + JaCoCo | 95% gate |
| Frontend tests | Vitest + React Testing Library | 95% gate |
| Container | Docker (multi-stage) | — |
| Frontend hosting | Vercel | — |
| Backend hosting | Railway | — |
| Analytics | Amplitude | — |

---

## Local Development

```bash
# Clone
git clone https://github.com/justcallmepratt/personal-web-app.git
cd personal-web-app

# Backend
cp backend/.env.example backend/.env
# Fill in: SUPABASE_DB_PASSWORD, JWT_SECRET (openssl rand -base64 32)
cd backend && ./run-dev.sh          # Spring Boot on :8080

# Frontend (new terminal)
cd frontend
pnpm install
pnpm dev                            # Next.js on :3000
```

> **Note:** `run-dev.sh` sources `backend/.env` and sets `JAVA_HOME` to Corretto 21
> automatically. It also sets `SPRING_PROFILES_ACTIVE=dev` which runs the seed runner
> and connects to the dev database.

---

## Running Tests

```bash
# Backend — runs all 42 tests + generates JaCoCo report in backend/target/site/jacoco/
cd backend && ./mvnw -B test

# Frontend — runs all 66 tests
cd frontend && pnpm test

# Frontend with coverage report (opens in browser at frontend/coverage/index.html)
cd frontend && pnpm test:coverage
```

---

## Project Structure

```
personal-web-app/
├── backend/
│   ├── src/main/java/com/resume/
│   │   ├── config/         GlobalExceptionHandler, SecurityConfig, CorsConfig, OpenApiConfig
│   │   ├── controller/     Profile, Project, Experience, Contact, Admin, Job
│   │   ├── dto/            ContactRequest, ApiResponse, LoginRequest, ResumeSuggestion
│   │   ├── model/          Profile, Project, Experience, Message, JobApplication
│   │   ├── repository/     JPA repositories (Spring Data)
│   │   ├── security/       JwtFilter, JwtUtil
│   │   └── service/        Business logic layer
│   ├── src/test/           42 JUnit tests (95% JaCoCo coverage)
│   ├── railway.toml        Health check + restart policy
│   └── Dockerfile          Multi-stage: Maven build → Corretto 21 runtime
├── frontend/
│   ├── src/app/            Next.js App Router pages
│   ├── src/components/     layout/, sections/, ui/
│   ├── src/lib/            api.ts, types.ts, analytics.ts
│   ├── src/test/           66 Vitest + RTL tests
│   ├── vercel.json         Security headers, API rewrite proxy
│   └── Dockerfile          Multi-stage: pnpm build → standalone output
├── docs/
│   ├── agents/             Self-contained briefs for AI sub-agents (Phases 7–17)
│   └── adr/                Architecture decision records
├── supabase/init.sql       Schema for local Docker dev
├── .github/workflows/      ci.yml, docker-build.yml, codeql.yml, release.yml
├── .env.example            All env vars documented with comments
└── REMAINING_WORK.md       Planned phases + agent orchestration plan
```

---

## API Reference

Full interactive docs at `/swagger-ui/index.html` on the running backend.

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/profile` | public | Developer profile + skills |
| `GET` | `/api/projects` | public | All projects (`?featured=true` to filter) |
| `GET` | `/api/projects/{id}` | public | Single project |
| `GET` | `/api/experience` | public | Work history |
| `POST` | `/api/contact` | public | Send contact message |
| `POST` | `/api/admin/auth/login` | — | Returns JWT |
| `GET` | `/api/admin/messages` | JWT | Contact message inbox |
| `PATCH` | `/api/admin/messages/{id}/read` | JWT | Toggle read status |

---

## Planned Features

See [`REMAINING_WORK.md`](REMAINING_WORK.md) for the full roadmap and
[`docs/agents/`](docs/agents/) for ready-to-execute agent briefs covering:
- Phase 8: Amplitude analytics
- Phase 9: Spotify player ("The Rebel Path" OST)
- Phase 10: Credits / citation page
- Phase 11: Job application tracker
- Phase 12–13: Market research + resume auto-updater
- Phase 14: LinkedIn data import
- Phase 15–16: GitHub benchmarking + pro dev dashboard
- Phase 17: Production hardening (backups, uptime monitor, smoke tests)

---

## Contributing

1. Fork and clone
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Follow the coding conventions in [`docs/agents/ORCHESTRATOR.md`](docs/agents/ORCHESTRATOR.md)
4. Ensure both test suites pass: `mvn test` + `pnpm test`
5. Open a PR — CI must be green before merge
