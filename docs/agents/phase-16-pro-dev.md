# Phase 16 — Professional Development Dashboard Agent

> **Status and caveats (2026-11-20)**
> Not started; depends on Phases 12 and 15. Admin pages belong in the planned `admin` micro-frontend, not the public app.
> No longer holds: Railway Postgres and `ddl-auto: update` (the repo uses `validate`).
> **Roadmap (2026-11-20):** Dropped. It depends on phases 12 and 15, which are being dropped or redesigned. See [`docs/ROADMAP.md`](../ROADMAP.md) and [`docs/RESEARCH.md`](../RESEARCH.md).

## Objective
Admin-only dashboard surfacing skill gaps, learning velocity, and recommended next steps
by combining market data (Phase 12) and GitHub benchmarks (Phase 15).

## Prerequisites
- **Phase 12** complete (market_insights table populated)
- **Phase 15** complete (github_benchmarks table populated)

## Backend

### `com.resume.service.GrowthSummaryService`
```java
public GrowthSummary buildSummary() {
    // 1. Your skills (from profile)
    // 2. Top 10 market skills (from market_insights)
    // 3. Skills you have vs skills market wants → coverage %
    // 4. GitHub benchmark percentiles (from github_benchmarks)
    // 5. Learning log entries (from learning_log table)
    // → return GrowthSummary record
}
```

### Supabase migration (learning log)
```sql
CREATE TABLE IF NOT EXISTS learning_log (
    id            BIGSERIAL PRIMARY KEY,
    resource_type TEXT NOT NULL,   -- Course | Book | Cert | Project | Talk | Article
    title         TEXT NOT NULL,
    provider      TEXT,            -- Coursera, O'Reilly, YouTube, etc.
    url           TEXT,
    status        TEXT NOT NULL DEFAULT 'Planned',  -- Planned | In Progress | Completed
    completed_at  DATE,
    notes         TEXT,
    added_at      TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_log_status ON learning_log(status);
```

### Controller
```
GET  /api/admin/growth/summary     → GrowthSummary
GET  /api/admin/growth/log         → List<LearningLogEntry>
POST /api/admin/growth/log         → create entry
PATCH /api/admin/growth/log/{id}   → update status / notes
DELETE /api/admin/growth/log/{id}  → delete
```

### `GrowthSummary` DTO
```java
public record GrowthSummary(
    double skillCoveragePercent,     // % of top market skills you have
    List<String> topGapSkills,       // top 5 skills you're missing
    List<String> recommendedNext,    // 3 skills to learn based on trajectory + salary bump
    Map<String, Double> benchmarkPercentiles,  // from Phase 15
    int learningItemsCompleted,
    int learningItemsInProgress,
    LocalDate lastGithubActivity     // from benchmark data
) {}
```

## Frontend
Route: `frontend/src/app/admin/growth/page.tsx`

Four HUDChrome panels:

**Panel 1 — Skill Coverage Radar**
- Radar chart: your skills vs market top-10
- Coverage % badge in `cp-teal` if ≥ 70%, `cp-yellow` if 50–70%, `cp-red` if <50%

**Panel 2 — GitHub Activity**
- `<img src="https://ghchart.rshah.org/{username}" />` — contribution calendar
- Benchmark percentile badges (stars, repos, followers)

**Panel 3 — Learning Log Kanban**
- Three columns: Planned · In Progress · Completed
- Add card modal using TerminalInput
- Drag-to-move status (HTML5 drag events — no extra library)

**Panel 4 — Next 3 Recommended Skills**
- Cards with skill name + "Why" (market demand + salary impact from Adzuna data)
- "Add to Learning Log" button on each

## Tests
```
backend/.../service/GrowthSummaryServiceTest.java
backend/.../controller/GrowthControllerTest.java
frontend/src/test/app/admin/growth.test.tsx
```

## Acceptance criteria
- [ ] `GET /api/admin/growth/summary` returns valid GrowthSummary
- [ ] Learning log CRUD works end-to-end
- [ ] Top gap skills are computed correctly (market skills not in profile.skills)
- [ ] Frontend renders all 4 panels
- [ ] `pnpm test` + `mvn test` ≥ 95%
