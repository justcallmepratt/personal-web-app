# Agent instructions

Portfolio site at <https://justcallmepratt.dev>. This file is for coding agents working in this repo; [README.md](README.md) and [docs/](docs/) have the full picture.

## Layout

| Path | What | Stack |
|------|------|-------|
| `frontend/` | The public site | Next.js 16, pnpm |
| `apps/admin/` | Owner inbox and content suggestions, served under `/admin` (Vercel microfrontends, `frontend/microfrontends.json`) | Next.js 16, pnpm |
| `apps/kafka/` | Live Kafka demo app | Next.js 16, pnpm |
| `backend/` | The API, on Railway | Spring Boot 4.1, Java 21, Maven |
| `supabase/` | Postgres schema: `init.sql` for a new database, `migrations/` for the existing one. Keep the two in step | PostgreSQL |
| `tools/jobsync-importer/` | CLI that files content suggestions from a JobSync backup | Node 22, no dependencies |

Next.js 16 is not the Next.js in your training data. Each app has its own `AGENTS.md`. Read `node_modules/next/dist/docs/` in that app before writing Next.js code.

## Checks

CI (`.github/workflows/ci.yml`) runs these. **Backend**, **Frontend** and **Admin** are required to merge. Run the matching set before you open a PR:

```bash
# frontend/, apps/admin/, apps/kafka/
pnpm install --frozen-lockfile && pnpm exec tsc --noEmit && pnpm lint && pnpm test && pnpm build
# backend/: unit, slice and PostgreSQL (Testcontainers, needs Docker) tests, plus the coverage gate
mvn -B verify
# tools/jobsync-importer/
npm test
```

## Rules

- **The site is public.** Never add an email address, phone number or home address to content, code, docs or commits.
- **Never commit `backend/mvnw.cmd`.** It often shows as modified, but only because of line endings.
- **Commits:** author them as Pratham Sachan with the GitHub no-reply address. Use one small PR per area, branched from `main`, and never push to `main` directly.
- **Dependencies:** prefer LTS lines (Node, Java, Spring Boot). Non-LTS libraries wait about three months after a release.
- **Tests:** every fix or feature comes with tests. Tests live in `src/test` in each app and `backend/src/test`.
- **Database:** RLS must stay on for every table (`PostgresPersistenceTest` checks this). The API connects as the owner, and Supabase's anon role must get nothing.
- **Secrets:** they live only in Railway and Vercel. `.env.example` and `docker-compose.yml` must not carry real or sample credentials.

## Reviews

- [docs/SECURITY_REVIEW.md](docs/SECURITY_REVIEW.md) is the security review. Don't repeat its findings.
- [docs/ECC_REVIEW_2026-11.md](docs/ECC_REVIEW_2026-11.md) is the code review. Check its open "Ask" items before you change those areas.
- The owner uses the ECC plugin's skills and reviewer agents on this project.
