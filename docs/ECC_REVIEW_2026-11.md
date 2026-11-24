# ECC code review — 2026-11-24

**Scope**
- `justcallmepratt/personal-web-app`: `frontend`, `apps/admin`, `apps/kafka`, `backend`, `supabase` and `tools/jobsync-importer`.
- `justcallmepratt/Athllinkmvp-DEMO`.
- Not repeated: the security review in [SECURITY_REVIEW.md](SECURITY_REVIEW.md) (#112, #113). Its items are left out here.

**Method**
1. ECC reviewer agents read the code, one area each:
   - `typescript-reviewer`, three times: the frontend; admin, kafka and the importer; Athlink.
   - `java-reviewer`
   - `database-reviewer`
   - `silent-failure-hunter`
   - `a11y-architect`
2. Every finding below was then checked by hand against the code.
3. RLS was also checked against the live database, using a read-only catalog query.
4. `ecc:harness-audit` was run.

**Status key**
- **Fixed:** fixed in a PR listed below, with tests where the code is testable.
- **Ask:** a behaviour change, a larger refactor or an owner action. Each needs approval first.
- **Note:** either known and acceptable, or a small follow-up.

## Pull requests

| PR | Area | What |
|----|------|------|
| #114 | backend | SMTP timeouts; `@Size(max = 254)` on the contact email |
| #115 | supabase | RLS on every table in `init.sql`, plus a Postgres test |
| #117 | frontend | Limiter env parsing and memory, `BACKEND_URL` trailing slash, Kafka page canonical, KafkaDemo count |
| #118 | apps/kafka | Contrast, focus ring, reduced motion, bounded limiter, KafkaDemo count |
| #120 | frontend | Contact relay falls back on a non-API 4xx; API data normalised (#8, #9) |
| #121 | backend, admin | Mark read/unread sets instead of toggling (#10) |
| Athllinkmvp-DEMO#2 | Athlink | Demo banner covered the mobile tab bars, duplicate anchor ids, scroll reset, pinned `*` versions |

## Findings, by severity

| # | Sev. | Area | Finding | Status |
|---|------|------|---------|--------|
| 1 | Medium | backend | SMTP had no timeouts, and the mail is sent inside the contact transaction. A stalled server pins a thread and a DB connection | Fixed #114 |
| 2 | Medium | supabase | `init.sql` left RLS off on `profile`, `projects`, `experience` and `messages`. The live DB is fine, with RLS and deny-all policies. A DB rebuilt from the file would expose `messages` to the anon key | Fixed #115 |
| 3 | Medium | apps/kafka | Muted text is 2.62:1 on black and red text 3.44:1. The input outline is 1.33:1 with no focus ring. No reduced-motion rules (WCAG 1.4.3, 1.4.11, 2.4.7) | Fixed #118 |
| 4 | Medium | Athlink | The fixed demo banner (`z-index: 1000`) covered the athlete and recruiter tab bars on phones | Fixed Athlink#2 |
| 5 | Medium | frontend | A blank `CONTACT_RATE_LIMIT_MAX=` became 0, so every message got 429. A typo became NaN, so there was no limit | Fixed #117 |
| 6 | Medium | frontend | A trailing slash in `BACKEND_URL` gave `//api/...`. Content then fell back silently and contact went to SMTP | Fixed #117 |
| 7 | Medium | frontend | `/projects/kafka` inherited `canonical: /projects` and the Open Graph URL from the layout | Fixed #117 |
| 8 | Medium | frontend | `relayToBackend` treats any JSON 4xx as final, including a 404, 401 or 403 from a misrouted backend. No SMTP fallback runs | Fixed #120 |
| 9 | Medium | frontend | `api.load` casts backend JSON without a shape check, so `tags: null` crashes a page. `demoUrl`, `repoUrl` and socials reach `href` unchecked, unlike `CertificationsList`, which uses `isHttpUrl` | Fixed #120 |
| 10 | Medium | backend | `PATCH /api/admin/messages/{id}/read` toggles the flag instead of setting it, so a retry or double click flips it back | Fixed #121 (sets `?read=`) |
| 11 | Medium | backend | Accepting one market suggestion supersedes the run's other `profile.techStack` suggestions, so only one skill a week can be adopted | Ask: design choice |
| 12 | Medium | backend | `MarketResearchService` and `MarketResearchJob` log only the exception class name, never the trace, so a failed run can't be diagnosed. A failed suggestion step reports "COMPLETED, 0 created" | Ask: class-name-only logging was a deliberate guard against leaking Adzuna URLs |
| 13 | Medium | admin | `NewSuggestionForm` keeps its old textarea text after `load()` refreshes the target. A proposal built on that stale value can later overwrite a newer accepted change | Ask: UI behaviour |
| 14 | Low-Med | backend | Two concurrent `accept()` calls on one field can deadlock. One locks the row then the profile, the other the profile then the row, and one gets a 500 | Ask: uncertain, needs a lock-order change |
| 15 | Low-Med | backend | The contact rate-limit slot is spent before validation. Three typos in the email domain lock the sender out for an hour | Ask |
| 16 | Low | frontend, kafka | The rate-limit maps never evicted keys | Fixed #117, #118 |
| 17 | Low | frontend, kafka | KafkaDemo's reload fetch overwrote the expected count, so "consumed" could show too early | Fixed #117, #118 |
| 18 | Low | backend | An email over 255 characters passed `@Email`, then failed on insert with a 500 | Fixed #114 |
| 19 | Low | Athlink | `#for-coaches` and `#features` were each used twice, so the header link landed on a hero card | Fixed Athlink#2 |
| 20 | Low | Athlink | The scroll position carried over between views. `clsx` and `tailwind-merge` were `"*"` | Fixed Athlink#2 |
| 21 | Low | Athlink | Onboarding goes straight to the app, so the `athlete-payment` screen is never reached | Ask: may be intentional |
| 22 | Low | backend | `GET /api/admin/messages` is unbounded and returns the JPA entity | Note |
| 23 | Low | backend | The weekly market cron is skipped if the process is down at 06:00 UTC on Monday. Scheduler shutdown interrupts a running job | Note |
| 24 | Low | backend/db | `LocalDateTime` and zone-less `TIMESTAMP` throughout. Pin the JVM and DB zones to UTC, or move to `timestamptz` and `Instant` | Ask: needs a migration |
| 25 | Low | db | Entity lengths default to 255 where the schema says 500 (`avatar_url`, `demo_url` and others). Four GIN indexes serve no query. In `market_research.sql`, `ADD COLUMN … NOT NULL` with no default can't be re-run on a non-empty table | Note |
| 26 | Low | backend/db | The JSONB list and map columns are `NOT NULL`, but the entity fields have no initialisers. Any future save that leaves one unset fails on insert. Uncertain: today's create paths set them | Note |
| 27 | Low | frontend | `SkillsChart` drops skills whose category isn't in its fixed list. `ExperienceTimeline` shows year-only dates as "Jan 2023" instead of using `formatDateRange` | Note |
| 28 | Low | frontend | Static `/projects/kafka` bakes `configured` in at build time. Fine on Vercel; a Docker deploy that sets `KAFKA_DEMO_URL` only at runtime shows the demo as offline | Note |
| 29 | Low | a11y | Main site: no `scroll-padding-top` under the sticky header (2.4.11). The Kafka record list can't take keyboard focus. The Kafka status region mounts already filled. Pipeline stages show state by colour only | Note |
| 30 | Low | importer | A `--file` run that fails part-way doesn't say how many items were filed. A stalled body read is reported as `bad_response`, not as a timeout | Note |
| 31 | Low | admin | `api/session/route.ts` re-implements `readJsonBody` and counts UTF-16 units, not bytes | Note |
| 32 | Info | frontend | `knip` finds 10 exports used only in their own file, such as `PLANNED_HEADING`, `withTimeout`, `KAFKA_LIMITS` and `socialImage`. Removing `export` is enough | Note |
| 33 | Info | live DB | Two leftover tables: `_RLS Check 2` and `_rls_trigger_check` | Ask: owner to drop |
| 34 | Info | repo | `ecc:harness-audit` scored 15/29. The root has no `CLAUDE.md` or `AGENTS.md`, and there is no `.claude/settings.json` or `.mcp.json`. Quality gates scored 10/10 | Note |

## Dropped as false positives or already handled

- **"RLS off" in the live database.** Wrong. Every table has RLS on, and the four core tables have a deny-all policy for `anon` and `authenticated`. Only `init.sql` lagged behind (#2).
- **`resume.ts` `.catch(() => [])`.** Dead code today, because `load()` never rejects.
- **The Kafka 100-record window.** This is the demo service's documented limit, not a bug in this repo.
- **Items already in `SECURITY_REVIEW.md`.** Forwarded-address trust, CSP, `Content-Length`-only body checks, JWT lifetime and CORS.

## Test gaps worth filling

- **frontend:** `app/api/kafka/produce` and `app/api/kafka/messages` have no route-handler tests; only the lib helpers do.
- **frontend:** `relayToBackend` has no test for a JSON 404, 401 or 403 (#8).
- **frontend:** `api.load` has no test against a bad payload, such as null arrays or a `javascript:` URL (#9).
- **admin:** `apps/admin/src/lib/http.ts` and `session.ts` have no direct unit tests.
- **importer:** `tools/jobsync-importer/src/zip.mjs` has no tests of its own for a damaged directory, an EOCD comment or Zip64 refusal.
- **backend:** no concurrency test for `SuggestionService.accept` (#14).
