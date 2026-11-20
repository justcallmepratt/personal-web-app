# Phase 17 — Cloud Production Deployment Agent

> **Status and caveats (2026-11-20)**
> Partly done by other means: the custom domain is live on Vercel, CI only verifies, and Vercel's Git integration deploys. The backend is deployed on Railway as `personal-web-app-api` but the site does not use it yet.
> No longer holds: Railway CLI deploys, Railway Postgres and its backups (Supabase is the only database), `NEXT_PUBLIC_API_URL` (unused; the server reads `BACKEND_URL`), the Railway deploy-hook and post-deploy smoke-test jobs in `ci.yml` (CI has no deploy jobs and the repo has no secrets), and the old `personal-web-app-backend-production` Railway address (the API now runs as `personal-web-app-api`). See `docs/DEPLOYMENT.md`.
> **Roadmap (2026-11-20):** Reduced, partly done: WP-H (keep-alive, uptime, backup notes) and WP-I (admin deploy) remain. Much of this brief is already done or obsolete. See [`docs/ROADMAP.md`](../ROADMAP.md) and [`docs/RESEARCH.md`](../RESEARCH.md).

## Objective
Fully harden the existing Railway + Vercel + Supabase deployment for production traffic.
No new hosting platforms — optimise what exists. Document every manual step precisely.

## Current state
| Layer | State | Issues to fix |
|---|---|---|
| Vercel (frontend) | ✅ Live | No custom domain; preview URLs still active |
| Railway (backend) | ✅ Live on SFO | Single instance; no autoscale config |
| Railway Postgres | ✅ Live | No backup strategy; single region |
| Supabase | ✅ Live (analytics/secondary) | RLS deny-all is correct |
| CI/CD | ✅ Auto-deploy on push | No smoke test after deploy |
| Monitoring | ❌ None | No uptime check, no error alerting |
| Custom domain | ❌ Missing | Both frontend and backend use generated URLs |
| SSL | ✅ Handled by platforms | Nothing to do |
| Secrets | ✅ Railway env vars + Vercel | Need rotation plan |

---

## Sub-tasks

### 17-A  Custom domain (manual step — agent documents, human executes)
1. Purchase domain via Vercel Domains MCP or any registrar
2. **Frontend:** Vercel project → Settings → Domains → add `yourname.dev`
3. **Backend:** Railway → Service → Settings → Networking → Custom Domain → add `api.yourname.dev`
4. Update env vars:
   - `CORS_ORIGIN` in Railway → `https://yourname.dev`
   - `NEXT_PUBLIC_SITE_URL` in Vercel → `https://yourname.dev`
   - `NEXT_PUBLIC_API_URL` in Vercel → `https://api.yourname.dev`
   - `BACKEND_URL` in Vercel → `https://api.yourname.dev`
5. Update `vercel.json` rewrite destination to `https://api.yourname.dev`
6. Trigger Vercel redeploy

### 17-B  Backend production hardening
Agent modifies `backend/src/main/resources/application.yml`:
```yaml
server:
  compression:
    enabled: true
    mime-types: application/json,text/html
    min-response-size: 1024
  http2:
    enabled: true

spring:
  jpa:
    properties:
      hibernate:
        jdbc:
          batch_size: 25
          fetch_size: 50
        order_inserts: true
        order_updates: true
```

Add production Hikari tuning to `application-docker.yml`:
```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: ${DB_POOL_SIZE:10}
      minimum-idle: 2
      connection-timeout: 20000
      idle-timeout: 300000
      max-lifetime: 600000
      keepalive-time: 60000
      leak-detection-threshold: 60000
```

Add Actuator health groups:
```yaml
management:
  health:
    db:
      enabled: true
  endpoint:
    health:
      probes:
        enabled: true      # /actuator/health/liveness + /actuator/health/readiness
      show-details: always # allow Railway health check to read details
```

### 17-C  Railway service configuration (via CLI)
Agent runs:
```bash
cd backend

# Set memory + CPU limits for Spring Boot JVM
railway variables set JAVA_TOOL_OPTIONS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:InitialRAMPercentage=50.0"

# Update railway.toml with production settings
```

Update `backend/railway.toml`:
```toml
[build]
builder = "dockerfile"
dockerfilePath = "Dockerfile"

[deploy]
healthcheckPath    = "/actuator/health/readiness"
healthcheckTimeout = 60
restartPolicyType       = "ON_FAILURE"
restartPolicyMaxRetries = 5
numReplicas = 1        # scale to 2 for prod traffic
```

### 17-D  Database backup strategy (Supabase + Railway)
Supabase (analytics DB — secondary):
- Already managed backups on M0 free tier (7-day point-in-time)
- No action needed

Railway Postgres (primary app DB):
- Railway does NOT provide automatic backups on free/hobby plans
- Agent creates `scripts/backup-db.sh`:
  ```bash
  #!/usr/bin/env bash
  # Run: bash scripts/backup-db.sh
  # Requires: RAILWAY_DB_URL env var (postgres:// connection string)
  set -e
  TIMESTAMP=$(date +%Y%m%d_%H%M%S)
  FILE="backups/railway_${TIMESTAMP}.sql"
  mkdir -p backups
  pg_dump "$RAILWAY_DB_URL" > "$FILE"
  echo "Backup saved: $FILE"
  ```
- Add `backups/` to `.gitignore`
- Agent creates GitHub Actions `db-backup.yml`:
  ```yaml
  name: DB Backup
  on:
    schedule:
      - cron: '0 2 * * *'   # daily at 02:00 UTC
  jobs:
    backup:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v6
        - run: |
            sudo apt-get install -y postgresql-client
            mkdir -p backups
            pg_dump "${{ secrets.RAILWAY_DB_URL }}" > backups/backup_$(date +%Y%m%d).sql
        - uses: actions/upload-artifact@v7
          with:
            name: db-backup-${{ github.run_number }}
            path: backups/
            retention-days: 30
  ```
  Add `RAILWAY_DB_URL` as GitHub secret (the public connection string from Railway dashboard).

### 17-E  Uptime monitoring (GitHub Actions — no extra service needed)
Create `.github/workflows/uptime.yml`:
```yaml
name: Uptime Check
on:
  schedule:
    - cron: '*/15 * * * *'   # every 15 minutes

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - name: Backend health
        run: |
          STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
            https://personal-web-app-backend-production.up.railway.app/actuator/health)
          if [ "$STATUS" != "200" ]; then
            echo "Backend DOWN: HTTP $STATUS"
            exit 1
          fi
      - name: Frontend health
        run: |
          STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
            https://frontend-liard-theta-28.vercel.app)
          [ "$STATUS" = "200" ] || exit 1
```
If either check fails, GitHub sends an email notification automatically.

### 17-F  Post-deploy smoke test in CI
Modify `.github/workflows/ci.yml` — add after `deploy-backend` and `deploy-frontend` jobs:
```yaml
smoke-test:
  name: Post-deploy smoke test
  needs: [deploy-backend, deploy-frontend]
  runs-on: ubuntu-latest
  if: github.ref == 'refs/heads/main' && github.event_name == 'push'
  steps:
    - name: Backend health
      run: |
        for i in 1 2 3; do
          STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
            ${{ secrets.BACKEND_URL }}/actuator/health)
          [ "$STATUS" = "200" ] && echo "✅ Backend healthy" && exit 0
          sleep 20
        done
        echo "❌ Backend unhealthy after 3 attempts" && exit 1

    - name: Profile API
      run: |
        curl -sf ${{ secrets.BACKEND_URL }}/api/profile | \
          python3 -c "import sys,json; d=json.load(sys.stdin); assert d['name']"
        echo "✅ /api/profile returns data"

    - name: Frontend loads
      run: |
        curl -sf ${{ vars.NEXT_PUBLIC_SITE_URL }} | grep -q "Night City" && \
          echo "✅ Frontend renders" || (echo "❌ Frontend missing data" && exit 1)
```

### 17-G  Secret rotation plan (document only — agent writes to `docs/adr/secret-rotation.md`)
```markdown
# Secret Rotation Plan

## JWT_SECRET
- Rotate every 90 days
- Update in Railway env vars → service auto-restarts
- All active sessions invalidated on rotation (acceptable for a portfolio)

## SUPABASE_DB_PASSWORD
- Rotate via Supabase Dashboard → Settings → Database → Reset password
- Update SPRING_DATASOURCE_PASSWORD in Railway
- Update backend/.env locally

## ADMIN_PASSWORD_HASH
- Generate new hash: htpasswd -bnBC 12 "" "newpassword" | tr -d ':\n'
- Update ADMIN_PASSWORD_HASH in Railway env vars

## VERCEL_TOKEN / RAILWAY_TOKEN
- Rotate via respective dashboards
- Update in GitHub repository secrets

## Amplitude API key
- Rotate via Amplitude → Settings → Projects → default → Regenerate
- Update NEXT_PUBLIC_AMPLITUDE_API_KEY in Vercel + .env.local
```

### 17-H  Performance baseline (Lighthouse — agent runs via CLI)
```bash
npx lighthouse https://frontend-liard-theta-28.vercel.app \
  --output=json --output-path=docs/lighthouse/baseline.json \
  --chrome-flags="--headless" --only-categories=performance,accessibility,best-practices,seo
```
Save report to `docs/lighthouse/baseline.json`. Agent summarises score in a markdown file.

---

## Acceptance criteria
- [ ] `/actuator/health/readiness` returns 200
- [ ] `/actuator/health/liveness` returns 200
- [ ] `ci.yml` smoke-test job passes after deploy
- [ ] `db-backup.yml` workflow runs and uploads artifact
- [ ] `uptime.yml` workflow created (first run passes)
- [ ] `docs/adr/secret-rotation.md` created
- [ ] Lighthouse performance ≥ 85, accessibility ≥ 90
- [ ] No console errors on frontend

## Files to create/modify
```
backend/src/main/resources/application.yml        MODIFY
backend/src/main/resources/application-docker.yml MODIFY
backend/railway.toml                              MODIFY
.github/workflows/db-backup.yml                  NEW
.github/workflows/uptime.yml                     NEW
.github/workflows/ci.yml                         MODIFY (smoke test job)
scripts/backup-db.sh                             NEW
docs/adr/secret-rotation.md                      NEW
docs/lighthouse/baseline.json                    NEW (generated)
```

## Manual steps (agent cannot perform — human must do)
1. Add custom domain in Vercel dashboard
2. Add custom domain in Railway dashboard
3. Add `RAILWAY_DB_URL` as GitHub secret (get from Railway dashboard → Postgres → Connect)
4. Update `CORS_ORIGIN`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_API_URL`, `BACKEND_URL` env vars
