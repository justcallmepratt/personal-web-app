# Migration Guide: Vercel/Railway to GitHub Pages & Container Registry

This guide walks you through migrating your application from **Vercel (frontend)** and **Railway (backend)** to **GitHub-native hosting** using GitHub Container Registry (GHCR) and GitHub Pages.

## Overview

### Current Setup (Vercel + Railway)
- **Frontend**: Hosted on Vercel (Next.js)
- **Backend**: Hosted on Railway (Spring Boot API)
- **Database**: Railway Postgres
- **CI/CD**: GitHub Actions (builds + deploys to external services)

### New Setup (GitHub-native)
- **Frontend**: GitHub Pages (static Next.js export) + Docker image in GHCR
- **Backend**: Docker container in GHCR (deployable to any Docker host)
- **Database**: Self-hosted Postgres or managed external service
- **CI/CD**: GitHub Actions (builds + pushes to GHCR, deploys to Pages)

---

## Migration Steps

### Phase 1: Set Up GitHub Container Registry (GHCR)

#### 1a. Enable GHCR Push Permissions
1. Go to **Settings** → **Actions** → **General**
2. Under **Workflow permissions**, select **Read and write permissions**
3. Check **Allow GitHub Actions to create and approve pull requests**
4. Save

#### 1b. Create a Personal Access Token (PAT) for Docker Login
```bash
gh auth token  # Use your existing GitHub CLI login, or:
# Go to GitHub.com → Settings → Developer settings → Personal access tokens (classic)
# Create a token with scopes: repo, write:packages, read:packages
export GITHUB_TOKEN=ghp_xxxxxxxxxxxx
```

#### 1c. Test Docker Login
```bash
echo $GITHUB_TOKEN | docker login ghcr.io -u justcallmepratt --password-stdin
```

---

### Phase 2: Update CI/CD Workflows

#### 2a. Replace Current Deployment Jobs

**Old Flow:**
```
Build → Deploy to Railway (backend)
Build → Deploy to Vercel (frontend)
```

**New Flow:**
```
Build → Push to GHCR → Deploy from GHCR
```

The new workflow (`.github/workflows/ghcr-deploy.yml`) is already in place and will:
1. Build and push backend image to `ghcr.io/justcallmepratt/personal-web-app-backend`
2. Build and push frontend image to `ghcr.io/justcallmepratt/personal-web-app-frontend`
3. Optionally deploy frontend to GitHub Pages (if using static export)

---

### Phase 3: Database Migration (Optional)

#### 3a. If Using External Postgres

**Option 1: Keep Railway Postgres**
- Continue using Railway's managed Postgres
- Update connection string in backend environment variables

**Option 2: Migrate to GitHub Codespaces Database**
- Requires Codespaces Premium
- Not recommended for production

**Option 3: Use Self-Hosted Postgres**
- Docker Compose (local/VPS)
- AWS RDS, Azure Database for PostgreSQL, etc.

#### 3b. Update Backend Connection String
Set this as a secret in your GitHub repo:
```bash
gh secret set DATABASE_URL --repo justcallmepratt/personal-web-app
# Example: postgresql://user:pass@host:5432/dbname
```

---

### Phase 4: Deployment Options

#### Option A: Docker Compose on VPS
1. SSH into your VPS
2. Copy `docker-compose.yml` and `.env.production`
3. Run:
   ```bash
   docker pull ghcr.io/justcallmepratt/personal-web-app-backend:latest
   docker pull ghcr.io/justcallmepratt/personal-web-app-frontend:latest
   docker compose up -d
   ```

#### Option B: Deploy Containers Manually
```bash
# Backend
docker run -d \
  --name personal-web-app-backend \
  -e SPRING_DATASOURCE_URL=postgresql://... \
  -e SPRING_DATASOURCE_USERNAME=... \
  -e SPRING_DATASOURCE_PASSWORD=... \
  -e JWT_SECRET=... \
  -p 8080:8080 \
  ghcr.io/justcallmepratt/personal-web-app-backend:latest

# Frontend
docker run -d \
  --name personal-web-app-frontend \
  -e NEXT_PUBLIC_API_URL=http://your-backend:8080 \
  -p 3000:3000 \
  ghcr.io/justcallmepratt/personal-web-app-frontend:latest
```

#### Option C: GitHub Pages (Frontend Only)
1. Enable GitHub Pages in repo settings
2. Select **Deploy from a branch** → **main** → **/root** (or **/docs**)
3. Frontend will be built as static export and deployed to `https://justcallmepratt.github.io/personal-web-app`

---

### Phase 5: Remove Old Deployment Secrets

Once migration is complete:

```bash
# Remove Railway secrets
gh secret delete RAILWAY_DEPLOY_HOOK_URL --repo justcallmepratt/personal-web-app
gh secret delete RAILWAY_TOKEN --repo justcallmepratt/personal-web-app
gh secret delete RAILWAY_SERVICE_ID --repo justcallmepratt/personal-web-app

# Remove Vercel secrets
gh secret delete VERCEL_TOKEN --repo justcallmepratt/personal-web-app
gh secret delete VERCEL_ORG_ID --repo justcallmepratt/personal-web-app
gh secret delete VERCEL_PROJECT_ID --repo justcallmepratt/personal-web-app
```

---

## Configuration Files

### Backend Environment Variables (.env.production)
```env
SPRING_PROFILES_ACTIVE=production
SPRING_DATASOURCE_URL=postgresql://user:pass@db-host:5432/dbname
SPRING_DATASOURCE_USERNAME=user
SPRING_DATASOURCE_PASSWORD=pass
JWT_SECRET=your-secret-key
ADMIN_PASSWORD_HASH=$2a$12$...
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-password
CORS_ORIGIN=https://your-frontend-url
```

### Frontend Environment Variables (.env.production)
```env
NEXT_PUBLIC_API_URL=https://your-backend-url
NEXT_PUBLIC_SITE_NAME=V // Night City Dev
NEXT_PUBLIC_SITE_URL=https://your-frontend-url
```

---

## Verification Checklist

- [ ] GHCR permissions enabled in Actions settings
- [ ] New workflow file (`.github/workflows/ghcr-deploy.yml`) active
- [ ] Docker images building successfully in CI
- [ ] Images pushing to GHCR without auth errors
- [ ] Images deployable (test locally or on target host)
- [ ] Database connection string configured
- [ ] Frontend & backend environment variables set
- [ ] Old deployment secrets cleaned up
- [ ] GitHub Pages enabled (if using static export)

---

## Troubleshooting

### Images not pushing to GHCR?
- Check workflow permissions: **Settings** → **Actions** → **General** → **Workflow permissions** = "Read and write"
- Verify GHCR login: `docker login ghcr.io -u justcallmepratt`
- Check image names in workflow match expected format

### Backend container won't start?
- Check database connection string: `SPRING_DATASOURCE_URL`
- Verify JWT_SECRET and ADMIN_PASSWORD_HASH are set
- Review container logs: `docker logs personal-web-app-backend`

### Frontend not serving correctly?
- Ensure NEXT_PUBLIC_API_URL is set correctly
- Check if Next.js is built in production mode
- Verify CORS_ORIGIN on backend matches frontend URL

---

## Rollback Plan

If migration fails, you can quickly revert:

1. Keep old Railway/Vercel deployments live during transition
2. Update CI workflow to continue deploying to both (old + new)
3. Monitor new GHCR deployments for 48 hours
4. Once stable, remove old deployment steps

---

## Additional Resources

- [GitHub Container Registry Docs](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Docker Compose Docs](https://docs.docker.com/compose/)
- [Spring Boot Docker Guide](https://spring.io/guides/gs/spring-boot-docker/)
- [Next.js Docker Guide](https://nextjs.org/docs/deployment/docker)
