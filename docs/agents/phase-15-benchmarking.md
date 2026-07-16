# Phase 15 — Developer Benchmarking Agent

## Objective
Use GitHub public API to compare your developer profile against a set of peer developers.
Results shown on a public `/benchmark` page — no auth required.

## Prerequisites
None.

## Environment variables
| Var | Value | Notes |
|---|---|---|
| `GITHUB_USERNAME` | `justcallmepratt` | Your GitHub handle |
| `GITHUB_TOKEN` | (optional) | Raises rate limit 60→5000/hr |
| `BENCHMARK_PEERS` | `torvalds,gaearon,addyosmani,kentcdodds,tj` | Comma-separated handles |

## DB migration (Supabase)
```sql
CREATE TABLE IF NOT EXISTS github_benchmarks (
    id           BIGSERIAL PRIMARY KEY,
    username     TEXT NOT NULL UNIQUE,
    is_self      BOOLEAN NOT NULL DEFAULT false,
    repos        INTEGER,
    stars        INTEGER,
    forks        INTEGER,
    top_language TEXT,
    languages    JSONB DEFAULT '{}',   -- {"TypeScript": 45, "Java": 30, ...} percentages
    followers    INTEGER,
    account_age_days INTEGER,
    fetched_at   TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bench_user ON github_benchmarks(username);
```

## Backend

### `com.resume.service.GitHubBenchmarkService`
GitHub API calls (use `RestTemplate` or `WebClient`):
- `GET https://api.github.com/users/{username}` → repos, followers, created_at
- `GET https://api.github.com/users/{username}/repos?per_page=100&sort=updated` → stars, forks, languages

### `com.resume.controller.BenchmarkController`
```
GET /api/profile/benchmark   → returns BenchmarkResult (public, no JWT)
POST /api/admin/benchmark/refresh  → re-fetches all peers (admin JWT)
POST /api/admin/benchmark/peers    → add a peer username
```

`BenchmarkResult` DTO:
```java
public record BenchmarkResult(
    GitHubStats self,
    List<GitHubStats> peers,
    Map<String, Double> percentiles  // {"stars": 0.72, "repos": 0.45, ...}
) {}
```

## Frontend
Route: `frontend/src/app/benchmark/page.tsx` (public, RSC)

Layout:
- Hero: "// DEVELOPER BENCHMARK" with your GitHub avatar
- Radar chart (Recharts or Chart.js via `react-chartjs-2`): axes = repos, stars, followers, account_age, language_diversity
- Your position vs peer median highlighted in `cp-teal`
- Language breakdown: horizontal bar chart
- Peers table: anonymised by default (show avatar + rank, not username)
- "Add to Navbar" optional — link from Skills page

## Tests
```
backend/.../service/GitHubBenchmarkServiceTest.java  (mock HTTP calls)
backend/.../controller/BenchmarkControllerTest.java
frontend/src/test/app/benchmark.test.tsx
```

## Acceptance criteria
- [ ] `GET /api/profile/benchmark` returns data without auth
- [ ] Percentile scores present for all metrics
- [ ] Frontend renders radar chart
- [ ] Cache TTL 7 days (no re-fetch within 7 days)
- [ ] `pnpm test` + `mvn test` pass ≥ 95%
