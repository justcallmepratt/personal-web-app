# Agent Orchestrator — Night City Dev Portfolio

## Purpose
This document is the entry point for any agent or sub-agent working on this project.
Read this first. Then read the phase file for your assigned task.

---

## Project snapshot

| Layer | Tech | Live URL |
|---|---|---|
| Frontend | Next.js 16 · React 19 · Tailwind 4 | https://justcallmepratt.dev |
| Backend | Spring Boot 4.1 · Java 21 · JPA | deployed on Railway (https://personal-web-app-api-production.up.railway.app), used by the production site; `api.justcallmepratt.dev` not attached |
| Database | Supabase Postgres (the only database; schema in `supabase/init.sql`) | nxqiuqlwyjimioosaiio.supabase.co |
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
- **DB changes** → Supabase is the only database. Apply schema changes with `mcp__supabase__apply_migration` and mirror them in `supabase/init.sql`. There is no Flyway; Hibernate runs with `ddl-auto: validate`
- **Tailwind tokens** are CSS-first (`@theme` in `globals.css`): `cp-red`, `cp-teal`, `cp-yellow`, `cp-dark`, `cp-panel`, `cp-border`, `cp-muted`, `cp-text`
- **HUDChrome** wraps every data panel; accepts `accent="red|yellow|teal"`
- **NeonButton** for all CTAs; supports `className="w-full justify-center"` for mobile full-width
- **Test requirement:** every new backend class ≥ 95% JaCoCo; every new frontend component has a Vitest test in `frontend/src/test/`
- **Commit format:** `feat(phase-N): description` with a `Co-Authored-By` trailer for the assisting model

## Dependency graph
```
Phase 7  (polish)        — no deps
Phase 8  (analytics)     — no deps
Phase 9  (spotify)       — no deps
Phase 10 (citations)     — no deps
Phase 11 (job-tracker)   — dropped
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
Status as of 2026-11-20. Briefs predate the current hosting; see the status block at the top of each phase file.

> **Roadmap (2026-11-20):** the dependency graph and parallel batches above are superseded by [`docs/ROADMAP.md`](../ROADMAP.md), which holds the status of every phase and the owner's decisions (evidence in [`docs/RESEARCH.md`](../RESEARCH.md)).

| File | Phase | Status |
|---|---|---|
| `phase-07-polish.md` | Visual polish | partly done (WP-A, WP-B shipped; real CV, custom 404, Lighthouse open) |
| `phase-08-analytics.md` | Amplitude analytics | decided (Vercel Web Analytics instead of Amplitude), not started |
| `phase-09-spotify.md` | Spotify player | dropped |
| `phase-10-citations.md` | Credits page | done (WP-C) |
| `phase-11-job-tracker.md` | Job application tracker | dropped (JobSync is used instead) |
| `phase-12-market-research.md` | Market research engine | replaced: built as the weekly market research that only proposes suggestions (WP-L, 2026-11-21) |
| `phase-13-resume-updater.md` | Resume auto-updater | dropped |
| `phase-14-linkedin.md` | LinkedIn sync | dropped |
| `phase-15-benchmarking.md` | GitHub benchmarking | done as the GitHub activity section (WP-G); the brief itself is superseded |
| `phase-16-pro-dev.md` | Pro dev dashboard | dropped |
| `phase-17-production.md` | Cloud production deploy | reduced, partly done (domain, Git deploys, CI, Railway deployment; keep-alive, uptime, backups and admin deploy open; see `docs/DEPLOYMENT.md`) |
