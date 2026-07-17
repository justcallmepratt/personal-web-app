# 🏗️ Codebase Structure Guide — For AI Agents

This document is **machine-readable** and designed for AI agents to understand the repo layout without manual exploration.

---

## Backend — Spring Boot 3.5 (Java 21)

### Package Layout

```
com.resume/
├── ResumeApplication.java            → @SpringBootApplication entry point
├── SeedRunner.java                   → Dev data seeding (runs on startup if SPRING_PROFILES_ACTIVE=dev)
│
├── config/
│   ├── SecurityConfig.java           → @Configuration: JWT filter chain, CORS, auth roles
│   ├── CorsConfig.java               → @Configuration: allowed origins (localhost:3000, prod frontend)
│   ├── GlobalExceptionHandler.java   → @RestControllerAdvice: centralized error responses
│   └── OpenApiConfig.java            → Springdoc-OpenAPI Swagger configuration
│
├── controller/
│   ├── ProfileController.java        → GET /api/profile, PUT /api/profile (public + admin)
│   ├── ProjectController.java        → GET /api/projects, GET /api/projects/{id} (public)
│   ├── ExperienceController.java     → GET /api/experience (public)
│   ├── ContactController.java        → POST /api/contact (public, rate-limited)
│   ├── AdminController.java          → POST /api/admin/auth/login (JWT auth)
│   ├── MessageController.java        → GET/PATCH /api/admin/messages/** (JWT protected)
│   └── JobApplicationController.java → POST/GET/PATCH /api/admin/jobs/** (JWT protected, Phase 11)
│
├── service/
│   ├── ProfileService.java           → Get/update profile; validates fields
│   ├── ProjectService.java           → Get all/single projects; @Cacheable(120s TTL)
│   ├── ExperienceService.java        → Get all experiences; sort by date DESC
│   ├── ContactService.java           → Send contact emails; rate limit check
│   ├── MessageService.java           → Inbox CRUD; marks as read
│   ├── AdminService.java             → Login validation; JWT token generation
│   └── JobApplicationService.java    → Job tracker CRUD (Phase 11)
│
├── repository/
│   ├── ProfileRepository.java        → JpaRepository<Profile, Long>
│   ├── ProjectRepository.java        → JpaRepository<Project, Long> + custom queries
│   ├── ExperienceRepository.java     → JpaRepository<Experience, Long>
│   ├── MessageRepository.java        → JpaRepository<Message, Long>
│   ├── ContactLogRepository.java     → JpaRepository<ContactLog, Long> (rate limiting)
│   └── JobApplicationRepository.java → JpaRepository<JobApplication, Long>
│
├── model/
│   ├── Profile.java                  → @Entity: name, email, bio, skills (List<String>)
│   ├── Project.java                  → @Entity: title, description, techStack, demoUrl, repoUrl, featured
│   ├── Experience.java               → @Entity: company, role, startDate, endDate, description
│   ├── Message.java                  → @Entity: sender, email, message, read status, createdAt
│   ├── ContactLog.java               → @Entity: for rate limiting (email, lastContactAt)
│   └── JobApplication.java           → @Entity: company, role, status, appliedAt, salary (Phase 11)
│
├── dto/
│   ├── ApiResponse.java              → Generic<T> for all JSON responses
│   ├── ContactRequest.java           → name, email, message (POST /api/contact)
│   ├── LoginRequest.java             → password (POST /api/admin/auth/login)
│   ├── LoginResponse.java            → token, expiresIn (response)
│   ├── ProfileUpdateRequest.java     → Subset of Profile fields for updates
│   └── ResumeSuggestion.java         → Phase 13: field, current, suggested, confidence
│
└── security/
    ├── JwtUtil.java                  → Token generation, validation, claims extraction
    ├── JwtFilter.java                → OncePerRequestFilter: validates bearer tokens
    └── SecurityConstants.java        → JWT_SECRET, EXPIRATION_MS (from .env)
```

### Key Design Rules for Agents

1. **All endpoints return `ApiResponse<T>`** — even errors:
   ```java
   {
     "success": false,
     "message": "error description",
     "data": null
   }
   ```

2. **JWT auth flow**:
   - POST `/api/admin/auth/login` with password → returns token
   - Token in header: `Authorization: Bearer <token>`
   - Decoded in `JwtFilter` → attached to `SecurityContext`
   - Admin endpoints check role via `@PreAuthorize("hasRole('ADMIN')")`

3. **Rate limiting**: Contact endpoint uses `ContactLog` table — if email contacted in last 60s, return 429

4. **Transactions**: All service methods with DB writes use `@Transactional`

5. **No validation in controller**: All validation in service layer

---

## Frontend — Next.js 16 (TypeScript, Tailwind 4)

### Directory Layout

```
frontend/src/
├── app/
│   ├── layout.tsx                    → Root layout: metadata, providers, navbar
│   ├── page.tsx                      → Home page: hero + projects + experience + contact CTA
│   ├── error.tsx                     → Global error boundary (reconnect button)
│   ├── not-found.tsx                 → 404 page
│   │
│   ├── (public)/
│   │   ├── projects/
│   │   │   └── [id]/page.tsx         → Dynamic: /projects/{id} detail view
│   │   └── cv/
│   │       └── page.tsx              → Download CV (static PDF from public/)
│   │
│   └── (admin)/
│       ├── admin/layout.tsx          → Auth wrapper: checks JWT in localStorage
│       ├── admin/page.tsx            → Admin dashboard (inbox, quick links)
│       ├── admin/messages/page.tsx   → Message inbox, read/unread toggle
│       ├── admin/jobs/page.tsx       → Job tracker kanban (Phase 11)
│       └── admin/growth/page.tsx     → Dev dashboard (Phase 16)
│
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx                → Sticky nav: logo, menu links, theme toggle
│   │   ├── Footer.tsx                → Footer: copyright, social links
│   │   └── HUDChrome.tsx             → Neon border wrapper (CP2077 aesthetic)
│   │
│   ├── sections/
│   │   ├── HeroSection.tsx           → Title, typewriter, CTA buttons
│   │   ├── ProjectsSection.tsx       → Grid: featured projects + link to /projects
│   │   ├── ExperienceSection.tsx     → Timeline: work history (sorted DESC by date)
│   │   ├── SkillsSection.tsx         → Skill bars: filtered by search
│   │   └── ContactSection.tsx        → Form: name, email, message, send button
│   │
│   ├── ui/
│   │   ├── NeonButton.tsx            → Styled button: hover glow effect, size variants
│   │   ├── NeonCard.tsx              → Card container: border glow, hover lift
│   │   ├── SkillBar.tsx              → Horizontal bar: skill name + proficiency %
│   │   ├── TerminalInput.tsx         → Text input: monospace font, border glow
│   │   ├── Badge.tsx                 → Tech/status badge with CP2077 colors
│   │   ├── LoadingSpinner.tsx        → Rotating neon spinner
│   │   └── Toast.tsx                 → Success/error/info notifications
│   │
│   └── providers/
│       ├── AuthProvider.tsx          → useContext hook for JWT + admin check
│       └── ThemeProvider.tsx         → Dark/light theme switcher (OLED optimized)
│
├── lib/
│   ├── api.ts                        → Fetch wrapper: baseURL, auth headers, error handling
│   ├── types.ts                      → TypeScript interfaces (Profile, Project, etc.)
│   ├── analytics.ts                  → Amplitude tracking (Phase 8)
│   ├── constants.ts                  → CP2077 color palette, breakpoints
│   └── utils.ts                      → Helpers: formatDate, truncate, validators
│
└── test/
    ├── components.test.tsx           → Vitest + React Testing Library tests
    ├── api.test.ts                   → Mock fetch tests for lib/api.ts
    └── setup.ts                      → Test configuration, global mocks
```

### Key Design Rules for Agents

1. **All data fetched via `lib/api.ts`**:
   ```typescript
   const data = await api.get('/api/profile');
   // Adds: Authorization header, error handling, type casting
   ```

2. **Admin routes protected by `AuthProvider`**:
   - Checks `localStorage.jwt` on mount
   - Redirects to `/` if not authenticated
   - Refetch on window focus (token refresh)

3. **Form submissions**:
   - Handle via controlled components (state)
   - Validate before POST
   - Show toast on success/error
   - Disable button + show spinner while loading

4. **Component naming**:
   - `*Section.tsx` = full-width page sections
   - `*Card.tsx` = reusable card containers
   - `use*` = custom React hooks
   - `Provider.tsx` = context providers

5. **CSS strategy**: Tailwind 4 utility-first, no inline styles except:
   - Dynamic colors: `style={{ color: cpRed }}`
   - Dynamic sizes: `style={{ width: `${percentage}%` }}`

6. **Testing**:
   - All components: render test + one interaction test
   - All services: mock backend, test error cases
   - Target: 95% coverage (measured via Vitest)

---

## Database — Supabase Postgres 17

### Schema Overview

```sql
-- Profiles (public.profile)
id BIGSERIAL PRIMARY KEY
name VARCHAR(255) NOT NULL
email VARCHAR(255) NOT NULL UNIQUE
bio TEXT
skills TEXT[] (array of skill strings)
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP DEFAULT NOW()

-- Projects (public.project)
id BIGSERIAL PRIMARY KEY
title VARCHAR(255) NOT NULL
description TEXT
tech_stack TEXT[] (comma-sep or JSON)
demo_url VARCHAR(2048)
repo_url VARCHAR(2048)
featured BOOLEAN DEFAULT FALSE
created_at TIMESTAMP
updated_at TIMESTAMP

-- Experience (public.experience)
id BIGSERIAL PRIMARY KEY
company VARCHAR(255) NOT NULL
role VARCHAR(255) NOT NULL
start_date DATE NOT NULL
end_date DATE (nullable for current)
description TEXT
created_at TIMESTAMP
updated_at TIMESTAMP

-- Messages (public.message)
id BIGSERIAL PRIMARY KEY
sender_name VARCHAR(255) NOT NULL
sender_email VARCHAR(255) NOT NULL
message TEXT NOT NULL
read BOOLEAN DEFAULT FALSE
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP

-- Contact Log (public.contact_log) — rate limiting
id BIGSERIAL PRIMARY KEY
email VARCHAR(255) NOT NULL
last_contact_at TIMESTAMP
contact_count_1h INT DEFAULT 1

-- Job Applications (public.job_application) — Phase 11
id BIGSERIAL PRIMARY KEY
company VARCHAR(255) NOT NULL
role VARCHAR(255) NOT NULL
status VARCHAR(50) (Bookmarked/Applied/Phone Screen/…)
applied_at TIMESTAMP
salary_min INT
salary_max INT
currency VARCHAR(10)
notes TEXT
created_at TIMESTAMP
updated_at TIMESTAMP
```

### Indexes & Performance

- PK indexes on all `id` fields (auto)
- UNIQUE on `profile.email`
- GIN index on `profile.skills` for array search
- Index on `experience.start_date` for sorting
- Index on `message.created_at` for ordering

---

## Environment Variables

### Backend (`.env`, sourced by `run-dev.sh`)

```bash
# Database
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/resume
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=<password>

# Server
PORT=8080
SPRING_PROFILES_ACTIVE=dev|test|docker

# JWT
JWT_SECRET=<32+ char random string>
JWT_EXPIRATION_MS=86400000  # 24h

# Admin
ADMIN_PASSWORD_HASH=<bcrypt hash>

# Email (SMTP)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=<your-email@gmail.com>
MAIL_PASS=<app-password>
MAIL_FROM=noreply@portfolio.com
```

### Frontend (`.env.local`, used by Next.js)

```bash
# API
NEXT_PUBLIC_API_URL=http://localhost:8080   # dev
# NEXT_PUBLIC_API_URL=https://api.prod.com  # prod

# Feature flags
NEXT_PUBLIC_FEATURE_ANALYTICS=true
NEXT_PUBLIC_FEATURE_SPOTIFY=false  # Phase 9

# Analytics (Phase 8)
NEXT_PUBLIC_AMPLITUDE_API_KEY=<key>

# Spotify (Phase 9)
NEXT_PUBLIC_SPOTIFY_TRACK_ID=5HTHMQ8wMAlF6cEo6bx0aL
```

---

## CI/CD Workflows

### `.github/workflows/ci.yml` — Main Deployment

```
On: push to main
├── Backend Job
│   ├── Checkout
│   ├── Setup JDK 21
│   ├── Maven compile + test (H2 in-memory DB)
│   ├── Maven package (JAR)
│   └── Deploy to Railway (via deploy hook or CLI)
│
└── Frontend Job
    ├── Checkout
    ├── Setup Node 20
    ├── pnpm install
    ├── TypeScript check (tsc --noEmit)
    ├── ESLint check
    ├── Next.js build
    └── Deploy to Vercel (via CLI)
```

### `.github/workflows/docker-build.yml` — GHCR Images

```
On: push to main, manual trigger
├── Build Backend image (Dockerfile: Maven build → Corretto 21 runtime)
├── Build Frontend image (Dockerfile: pnpm build → Next.js standalone)
└── Push both to GHCR (ghcr.io/justcallmepratt/...)
```

---

## How Agents Should Navigate

1. **Understanding a module**: Read the package layout above, then fetch the specific files
2. **Adding a new endpoint**: 
   - Add route in controller
   - Add service method
   - Add repository query if needed
   - Add DTO if needed
   - Test with mock in Vitest
3. **Updating the database**:
   - Create Supabase migration
   - Update model in Java
   - Update type in TypeScript
   - Run full test suite
4. **Deployment changes**:
   - Update workflows in `.github/workflows/`
   - Test locally: `docker compose up`
   - Commit and verify CI passes
