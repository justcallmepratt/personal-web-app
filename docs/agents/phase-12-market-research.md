# Phase 12 — Market Research Engine Agent

> **Replaced (2026-11-21).** This brief was not built as written. What exists instead is the weekly market research described in [`docs/CODEBASE_STRUCTURE.md`](../CODEBASE_STRUCTURE.md#market-research-weekly-suggestions-only) and [`docs/DEPLOYMENT.md`](../DEPLOYMENT.md#market-research-run-the-migration-before-merging): weekly, allow-listed companies only, counts only (no listings, salaries or `market_insights` table), and results arrive as suggestions the owner accepts or rejects. Nothing below is current.
>
> **Status and caveats (2026-11-20)**
> Not started. Needs the `ADZUNA_*` variables, which were removed from `.env.example`.
> No longer holds: admin pages inside the public app (planned `admin` micro-frontend instead) and any Railway/`ddl-auto` assumptions about the schema.
> **Roadmap (2026-11-20):** Wanted, not started (WP-L); the backend is deployed but the admin app and site integration come first: weekly pull, `@Scheduled` with sleeping off or a Railway cron service, admin-only. Adzuna limits unconfirmed. Databricks is an optional offline exercise. See [`docs/ROADMAP.md`](../ROADMAP.md) and [`docs/RESEARCH.md`](../RESEARCH.md).

## Objective
Nightly job pulls real job listings via Adzuna API, extracts required skills,
stores insights in Supabase, and exposes a `/api/admin/market/insights` endpoint.

## Prerequisites
None (but Phase 13 depends on this).

## Environment variables needed
| Var | Source |
|---|---|
| `ADZUNA_APP_ID` | https://developer.adzuna.com (free, 250 calls/day) |
| `ADZUNA_APP_KEY` | Same registration |
| `ADZUNA_COUNTRY` | `us` (default) |

## DB migration (Supabase — use mcp__supabase__apply_migration)
```sql
CREATE TABLE IF NOT EXISTS market_insights (
    id           BIGSERIAL PRIMARY KEY,
    role_query   TEXT NOT NULL,             -- search term used (e.g. "software engineer")
    skill        TEXT NOT NULL,             -- extracted skill (e.g. "Kubernetes")
    frequency    INTEGER NOT NULL DEFAULT 1, -- occurrences in job listings
    avg_salary   INTEGER,                   -- average salary across matching jobs
    job_count    INTEGER,                   -- total listings analysed
    fetched_at   TIMESTAMP NOT NULL DEFAULT now(),
    expires_at   TIMESTAMP NOT NULL         -- now() + 24h
);
CREATE INDEX IF NOT EXISTS idx_insights_role  ON market_insights(role_query);
CREATE INDEX IF NOT EXISTS idx_insights_skill ON market_insights(skill);
CREATE INDEX IF NOT EXISTS idx_insights_exp   ON market_insights(expires_at);
```

## Backend

### `com.resume.service.MarketResearchService`
```java
@Service
public class MarketResearchService {
    // fetchInsights(String roleQuery): calls Adzuna, parses descriptions, extracts skills
    // getTopSkills(String roleQuery): reads from market_insights (not expired)
    // purgeExpired(): deletes rows where expires_at < now()
}
```

Adzuna API call:
```
GET https://api.adzuna.com/v1/api/jobs/{country}/search/1
    ?app_id={APP_ID}&app_key={APP_KEY}
    &what={role_query}&results_per_page=50&content-type=application/json
```

Skill extraction: simple keyword frequency count against a curated skill dictionary
(Java, Spring Boot, Kubernetes, Docker, React, TypeScript, Python, AWS, GCP, Azure,
PostgreSQL, Redis, Kafka, GraphQL, REST, CI/CD, Terraform, etc.)

### `com.resume.controller.MarketController`
```
GET /api/admin/market/insights?role={query}  → top 20 skills + job count + avg salary
POST /api/admin/market/refresh               → triggers immediate fetch (ignores cache)
```

### Scheduled refresh
```java
@Scheduled(cron = "0 0 2 * * *")  // 02:00 UTC daily
public void scheduledRefresh() { ... }
```
Enable scheduling in main app: `@EnableScheduling` on `ResumeApplication`.

## Frontend
Route: `frontend/src/app/admin/market/page.tsx`
- Radar/bar chart: top 10 market skills vs your skills (from `/api/profile`)
- Salary band table per role
- "Skill gaps" highlighted in `cp-red`
- Last refreshed timestamp + manual Refresh button

## Tests
```
backend/src/test/java/com/resume/service/MarketResearchServiceTest.java
backend/src/test/java/com/resume/controller/MarketControllerTest.java
```
Mock the Adzuna HTTP call with `MockRestServiceServer` or `WireMock`.

## Acceptance criteria
- [ ] `POST /api/admin/market/refresh` returns list of skills
- [ ] Skills are stored in Supabase `market_insights` table
- [ ] Second call within 24h returns cached data (no Adzuna call)
- [ ] `pnpm test` passes
- [ ] `mvn test` passes ≥ 95% coverage on new classes
