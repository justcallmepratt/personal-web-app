# Agent Orchestrator — Night City Dev Portfolio

## Purpose
This document is the entry point for any agent or sub-agent working on this project.
Read this first. Then read the phase file for your assigned task.

---

## Project snapshot

| Layer | Tech | Live URL |
|---|---|---|
| Frontend | Next.js 16 · React 19 · Tailwind 4 | https://frontend-liard-theta-28.vercel.app |
| Backend | Spring Boot 3.5 · Java 21 · JPA | https://personal-web-app-backend-production.up.railway.app |
| Database | Railway Postgres (internal) | postgres-hhrc.railway.internal:5432 |
| Analytics DB | Supabase Postgres | nxqiuqlwyjimioosaiio.supabase.co |
| Repo | GitHub | https://github.com/justcallmepratt/personal-web-app |

## Local dev
```bash
cd backend && ./run-dev.sh   # :8080, loads backend/.env
cd frontend && pnpm dev      # :3000
```

## Architecture conventions
- **Backend package root:** `com.resume`
- **Frontend src root:** `frontend/src/`
- **All API routes** follow `/api/{resource}` (public) or `/api/admin/{resource}` (JWT-protected)
- **DB changes** → always use `mcp__supabase__apply_migration` for Supabase; use JPA migration + Flyway or manual SQL for Railway Postgres
- **Tailwind tokens** are CSS-first (`@theme` in `globals.css`): `cp-red`, `cp-teal`, `cp-yellow`, `cp-dark`, `cp-panel`, `cp-border`, `cp-muted`, `cp-text`
- **HUDChrome** wraps every data panel; accepts `accent="red|yellow|teal"`
- **NeonButton** for all CTAs; supports `className="w-full justify-center"` for mobile full-width
- **Test requirement:** every new backend class ≥ 95% JaCoCo; every new frontend component has a Vitest test in `frontend/src/test/`
- **Commit format:** `feat(phase-N): description` with `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>` trailer

## Dependency graph
```
Phase 7  (polish)        — no deps
Phase 8  (analytics)     — no deps
Phase 9  (spotify)       — no deps
Phase 10 (citations)     — no deps
Phase 11 (job-tracker)   — no deps
Phase 12 (market)        — no deps
Phase 13 (resume-upd)    — needs Phase 12
Phase 14 (linkedin)      — no deps
Phase 15 (benchmark)     — no deps
Phase 16 (pro-dev)       — needs Phase 12 + Phase 15
Phase 17 (prod-deploy)   — needs Phase 8 (analytics key)
```

## Parallel execution batches
```
Batch A (run together): 7, 8, 9, 10
Batch B (run together): 11, 12, 14, 15
Batch C (run after B):  13, 16
Batch D (run last):     17
```

## Phase index
| File | Phase | Status |
|---|---|---|
| `phase-07-polish.md` | Visual polish | pending |
| `phase-08-analytics.md` | Amplitude analytics | pending |
| `phase-09-spotify.md` | Spotify player | pending |
| `phase-10-citations.md` | Credits page | pending |
| `phase-11-job-tracker.md` | Job application tracker | pending |
| `phase-12-market-research.md` | Market research engine | pending |
| `phase-13-resume-updater.md` | Resume auto-updater | pending |
| `phase-14-linkedin.md` | LinkedIn sync | pending |
| `phase-15-benchmarking.md` | GitHub benchmarking | pending |
| `phase-16-pro-dev.md` | Pro dev dashboard | pending |
| `phase-17-production.md` | Cloud production deploy | pending |
