# Phase 11 — Job Application Tracker Agent

> **Dropped (2026-11-20). Do not build this.**
> The owner decided to use an existing open-source tracker, [JobSync](https://github.com/Gsync/jobsync) (MIT, self-hosted with Docker), instead of a custom one. It runs separately from this site and is not part of this repository. Work on this phase was started and abandoned the same day; nothing was committed, so no job controller, model, table or `/admin` pages exist. The brief below is kept for the record only.
>
> **Earlier status and caveats (2026-11-20)**
> Not started. No job controller, model or `/admin` pages exist.
> No longer holds: Railway Postgres (the only database is Supabase), Flyway, `ddl-auto: update` (the repo uses `validate`; add tables to `supabase/init.sql`), and admin pages inside the public app (the plan is a separate `admin` micro-frontend).
> **Roadmap (2026-11-20):** After the backend is live, and only if the owner will use it (WP-K). Table goes in `supabase/init.sql`; pages go in `apps/admin`; fix the H2/JSONB test gap first. See [`docs/ROADMAP.md`](../ROADMAP.md) and [`docs/RESEARCH.md`](../RESEARCH.md).

## Objective
Admin-only Kanban board to track job applications through their lifecycle.

## Prerequisites
None (standalone).

## DB migration (Railway Postgres via Spring Boot)
Add to `backend/src/main/resources/db/migration/` — use Flyway OR apply via Spring's
`application-dev.yml` `ddl-auto: update` (acceptable since Railway Postgres uses create-drop parity).

Alternative: add to SeedRunner or apply manually.

```sql
CREATE TABLE IF NOT EXISTS job_applications (
    id           BIGSERIAL PRIMARY KEY,
    company      TEXT NOT NULL,
    role         TEXT NOT NULL,
    url          TEXT,
    source       TEXT DEFAULT 'Direct',           -- LinkedIn | Referral | Direct | Recruiter
    status       TEXT NOT NULL DEFAULT 'Bookmarked', -- see below
    applied_at   DATE,
    last_updated TIMESTAMP NOT NULL DEFAULT now(),
    notes        TEXT,
    salary_min   INTEGER,
    salary_max   INTEGER,
    currency     CHAR(3) DEFAULT 'USD'
);
-- Status values: Bookmarked | Applied | Phone Screen | Technical | Final | Offer | Rejected | Ghosted
CREATE INDEX IF NOT EXISTS idx_jobs_status ON job_applications(status);
CREATE INDEX IF NOT EXISTS idx_jobs_updated ON job_applications(last_updated DESC);
```

## Backend

### Entity: `com.resume.model.JobApplication`
Fields match the schema above. Use `@Column(name="applied_at")` etc.

### Repository: `com.resume.repository.JobApplicationRepository`
```java
List<JobApplication> findAllByOrderByLastUpdatedDesc();
List<JobApplication> findByStatusOrderByLastUpdatedDesc(String status);
```

### Service: `com.resume.service.JobApplicationService`
Methods: `create`, `listAll`, `listByStatus`, `updateStatus`, `update`, `delete`
All methods `@Transactional`.

### Controller: `com.resume.controller.JobController`
Prefix: `/api/admin/jobs` (JWT protected automatically via SecurityConfig).
```
POST   /api/admin/jobs              create
GET    /api/admin/jobs              list all (optional ?status= filter)
GET    /api/admin/jobs/{id}         get one
PATCH  /api/admin/jobs/{id}         full update
PATCH  /api/admin/jobs/{id}/status  quick status update { status: string }
DELETE /api/admin/jobs/{id}         delete
GET    /api/admin/jobs/stats        counts per status column
```

### DTO: `com.resume.dto.JobApplicationRequest`
Record with `@NotBlank` on company and role.

## Frontend

### Route: `frontend/src/app/admin/jobs/page.tsx`
Client component (`'use client'`) — requires auth token from localStorage/cookie.

### Layout
- Status columns as horizontal scroll on mobile, grid on desktop
- Each column: `HUDChrome` with status name as title, accent:
  - `Bookmarked` → teal · `Applied` → yellow · `Phone Screen` / `Technical` / `Final` → yellow
  - `Offer` → teal · `Rejected` / `Ghosted` → red
- Each card: company name, role, date applied, salary range, source badge

### Add/Edit modal
- HUDChrome overlay with `TerminalInput` fields
- Triggered by ▶ ADD button and card click

### Stats bar
- Above Kanban: `HUDChrome` row showing count per active status

### API client
Create `frontend/src/lib/jobs-api.ts` with typed fetch wrappers to
`/api/admin/jobs` using the stored JWT token.

## Tests
```
backend/src/test/java/com/resume/service/JobApplicationServiceTest.java  NEW
backend/src/test/java/com/resume/controller/JobControllerTest.java        NEW
frontend/src/test/app/admin/jobs.test.tsx                                 NEW
```

## Acceptance criteria
- [ ] Backend: `mvn test` passes with ≥ 95% coverage on new classes
- [ ] Frontend: `pnpm test` passes
- [ ] POST `/api/admin/jobs` with valid JWT creates a record
- [ ] GET `/api/admin/jobs` returns the created record
- [ ] PATCH `/api/admin/jobs/{id}/status` updates status
- [ ] UI renders kanban columns for all 8 statuses

## Files to create/modify
```
backend/src/main/java/com/resume/model/JobApplication.java          NEW
backend/src/main/java/com/resume/repository/JobApplicationRepository.java NEW
backend/src/main/java/com/resume/service/JobApplicationService.java  NEW
backend/src/main/java/com/resume/dto/JobApplicationRequest.java      NEW
backend/src/main/java/com/resume/controller/JobController.java       NEW
frontend/src/app/admin/jobs/page.tsx                                 NEW
frontend/src/lib/jobs-api.ts                                         NEW
frontend/src/test/...                                                 NEW
```
