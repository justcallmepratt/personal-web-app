> **Historical:** this describes the original May 2026 build and is not current. See [DEPLOYMENT.md](DEPLOYMENT.md) for how the site is deployed today.

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
