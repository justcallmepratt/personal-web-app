# 🚀 Remaining Work: Migration to GitHub Pages & GHCR

This document tracks all remaining work needed to complete the migration from Vercel/Railway to GitHub-native deployment.

---

## 📊 Status Overview

| Phase | Status | Priority | Est. Time |
|-------|--------|----------|----------|
| **1. Setup & Permissions** | 🟡 In Progress | HIGH | 15 min |
| **2. Workflow Files** | 🔴 Blocked | HIGH | 20 min |
| **3. Environment Configuration** | 🟡 Partial | HIGH | 10 min |
| **4. Testing & Validation** | 🔴 Not Started | MEDIUM | 30 min |
| **5. Deployment** | 🔴 Not Started | MEDIUM | Varies |
| **6. Cleanup & Monitoring** | 🔴 Not Started | LOW | 15 min |

---

## 🔴 Critical Issues Found

### Issue 1: YAML Indentation Error in `ci.yml` ✅ FIXED
- **Location**: `.github/workflows/ci.yml`, line 27
- **Problem**: `with:` keyword was incorrectly indented
- **Status**: ✅ Fixed in commit a044045
- **Action**: None needed

### Issue 2: GHCR Workflow Not Yet Created
- **Location**: `.github/workflows/ghcr-deploy.yml`
- **Problem**: File needs to be created manually (permission issue)
- **Status**: 🔴 BLOCKED - Cannot push files directly
- **Action**: User must create this file manually (see below)

### Issue 3: Production Docker Compose Missing
- **Location**: `docker-compose.prod.yml`
- **Problem**: File needs to be created for production deployments
- **Status**: 🔴 BLOCKED - Cannot push files directly
- **Action**: User must create this file manually (see below)

### Issue 4: Docker Build Workflow Has Auth Issues
- **Location**: `.github/workflows/docker-build.yml`
- **Problem**: Reports HTML error on GHCR push (likely permissions)
- **Status**: 🟡 Likely fixed after permissions update
- **Action**: Retest after enabling workflow permissions

---

## ✅ Phase 1: Setup & Permissions

### Action 1.1: Enable GitHub Actions Workflow Permissions
**Difficulty**: ⭐ Very Easy | **Time**: 2 min | **Status**: 🔴 NOT DONE

```bash
# Option A: Using GitHub CLI (recommended)
gh api -X PUT repos/justcallmepratt/personal-web-app/actions/permissions \
  -f default_workflow_permissions=write \
  -f can_approve_pull_request_reviews=true

# Option B: Manual UI
# 1. Go to: https://github.com/justcallmepratt/personal-web-app/settings/actions
# 2. Under "Workflow permissions"
# 3. Select "Read and write permissions"
# 4. Check "Allow GitHub Actions to create and approve pull requests"
# 5. Click "Save"
```

**Verification**:
```bash
gh api repos/justcallmepratt/personal-web-app/actions/permissions
# Should return: "default_workflow_permissions": "write"
```

---

### Action 1.2: Check GHCR Package Settings
**Difficulty**: ⭐ Very Easy | **Time**: 2 min | **Status**: 🔴 NOT DONE

Navigate to: `https://github.com/justcallmepratt?tab=packages`

Verify you can see:
- Personal access tokens option
- Package visibility settings
- Connection to GHCR

---

## 🔴 Phase 2: Create Missing Workflow Files

### Action 2.1: Create `.github/workflows/ghcr-deploy.yml`
**Difficulty**: ⭐ Easy | **Time**: 5 min | **Status**: 🔴 NOT DONE

**Steps**:
1. Create file: `.github/workflows/ghcr-deploy.yml`
2. Copy content from the file provided in this PR description
3. Commit with message: `ci: add GHCR deployment workflow`

**File Location**: See the workflow content in the section below or copy from the PR diff

---

### Action 2.2: Create `docker-compose.prod.yml`
**Difficulty**: ⭐ Easy | **Time**: 5 min | **Status**: 🔴 NOT DONE

**Steps**:
1. Create file: `docker-compose.prod.yml` in repository root
2. Copy content from the file provided in this PR description
3. Commit with message: `devops: add production docker-compose configuration`

**File Location**: See the docker-compose content in the section below or copy from the PR diff

---

## 🟡 Phase 3: Environment Configuration

### Action 3.1: Create Repository Secrets
**Difficulty**: ⭐⭐ Easy | **Time**: 5 min | **Status**: 🔴 NOT DONE

```bash
# Generate secure values first
# JWT_SECRET: 32+ character random string
# ADMIN_PASSWORD_HASH: Use online bcrypt tool or:
#   $(echo 'your-password' | docker run --rm -i alpine/fluentd sh -c 'echo "require 'bcrypt'; puts BCrypt::Password.create(STDIN.read.chomp)"')

# Then set secrets
gh secret set JWT_SECRET --repo justcallmepratt/personal-web-app
gh secret set ADMIN_PASSWORD_HASH --repo justcallmepratt/personal-web-app
gh secret set MAIL_USER --repo justcallmepratt/personal-web-app
gh secret set MAIL_PASS --repo justcallmepratt/personal-web-app
gh secret set BACKEND_URL --repo justcallmepratt/personal-web-app
gh secret set DB_PASSWORD --repo justcallmepratt/personal-web-app
```

**Verification**:
```bash
gh secret list --repo justcallmepratt/personal-web-app
```

---

### Action 3.2: Create Repository Variables
**Difficulty**: ⭐⭐ Easy | **Time**: 3 min | **Status**: 🔴 NOT DONE

```bash
# Variables (non-sensitive)
gh variable set NEXT_PUBLIC_SITE_NAME --repo justcallmepratt/personal-web-app -b "V // Night City Dev"
gh variable set NEXT_PUBLIC_SITE_URL --repo justcallmepratt/personal-web-app -b "https://your-frontend-domain.com"
gh variable set NEXT_PUBLIC_API_URL --repo justcallmepratt/personal-web-app -b "https://your-backend-domain.com"
```

---

## 🔴 Phase 4: Testing & Validation

### Action 4.1: Trigger Manual Workflow Run
**Difficulty**: ⭐ Very Easy | **Time**: 2 min | **Status**: 🔴 NOT DONE

```bash
# Manually trigger the GHCR deploy workflow
gh workflow run ghcr-deploy.yml --repo justcallmepratt/personal-web-app

# Monitor the run
gh run watch --repo justcallmepratt/personal-web-app
```

**Expected Results**:
- ✅ Backend image builds successfully
- ✅ Frontend image builds successfully
- ✅ Both images push to GHCR without auth errors
- ✅ Verification job pulls and validates images

---

### Action 4.2: Test Local Docker Compose
**Difficulty**: ⭐⭐ Medium | **Time**: 10 min | **Status**: 🔴 NOT DONE

```bash
# Copy production env template
cp .env.production.example .env.production

# Edit with real values
nano .env.production

# Test locally
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up --detach

# Verify services
docker ps
curl http://localhost:8080/health
curl http://localhost:3000

# Check logs
docker compose logs -f backend
docker compose logs -f frontend

# Cleanup
docker compose -f docker-compose.prod.yml down
```

---

### Action 4.3: Verify Images in GHCR
**Difficulty**: ⭐ Very Easy | **Time**: 2 min | **Status**: 🔴 NOT DONE

```bash
# List your GHCR packages
gh api user/packages --jq '.[] | select(.package_type=="container")'

# Or visit: https://github.com/justcallmepratt?tab=packages
```

---

## 🔴 Phase 5: Deployment

### Action 5.1: Choose Deployment Strategy
**Options**:
- [ ] **Option A**: GitHub Pages (frontend only) - See `DEPLOYMENT_OPTIONS.md`
- [ ] **Option B**: Docker Host on VPS - See `DEPLOYMENT_OPTIONS.md`
- [ ] **Option C**: Render.com (PaaS) - See `DEPLOYMENT_OPTIONS.md`

### Action 5.2: Follow Chosen Strategy
See detailed guides in:
- `DEPLOYMENT_OPTIONS.md` - Full deployment options
- `docs/MIGRATION_TO_GITHUB_PAGES.md` - Step-by-step migration

---

## 🔴 Phase 6: Cleanup & Monitoring

### Action 6.1: Remove Old Deployment Secrets
**Difficulty**: ⭐ Very Easy | **Time**: 2 min | **Status**: 🔴 NOT DONE

**Only after new deployment is stable for 48 hours**:

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

### Action 6.2: Disable Old Workflows
**Difficulty**: ⭐ Easy | **Time**: 3 min | **Status**: 🔴 NOT DONE

Once migration is complete, you may want to disable old deployment workflows:
1. Go to `.github/workflows/ci.yml`
2. Remove or comment out `deploy-backend` and `deploy-frontend` jobs

---

### Action 6.3: Set Up Monitoring
**Difficulty**: ⭐⭐ Medium | **Time**: 5 min | **Status**: 🔴 NOT DONE

Options for monitoring your deployments:
- [ ] GitHub Actions notifications
- [ ] Third-party monitoring (Datadog, New Relic, etc.)
- [ ] Custom health check scripts
- [ ] Status page (StatusPage.io, etc.)

---

## 📋 Quick Checklist

Complete in this order:

- [ ] **1.1** Enable GitHub Actions workflow permissions
- [ ] **1.2** Check GHCR package settings
- [ ] **2.1** Create `.github/workflows/ghcr-deploy.yml`
- [ ] **2.2** Create `docker-compose.prod.yml`
- [ ] **3.1** Create repository secrets
- [ ] **3.2** Create repository variables
- [ ] **4.1** Trigger manual workflow run
- [ ] **4.2** Test local Docker Compose
- [ ] **4.3** Verify images in GHCR
- [ ] **5.1** Choose deployment strategy
- [ ] **5.2** Follow chosen strategy
- [ ] **6.1** Remove old deployment secrets (after 48h)
- [ ] **6.2** Disable old workflows (after 48h)
- [ ] **6.3** Set up monitoring

---

## 🆘 Troubleshooting Guide

### Problem: Workflow Permissions Still Not Write
```bash
# Check current permissions
gh api repos/justcallmepratt/personal-web-app/actions/permissions

# If not write, try updating again
gh api -X PUT repos/justcallmepratt/personal-web-app/actions/permissions \
  -f default_workflow_permissions=write
```

### Problem: GHCR Push Still Failing
```bash
# Check workflow logs
gh run list --repo justcallmepratt/personal-web-app

# View full logs for a specific run
gh run view RUN_ID --repo justcallmepratt/personal-web-app --log
```

### Problem: Docker Compose Won't Start
```bash
# Validate compose file
docker compose -f docker-compose.prod.yml config

# Check for required env vars
grep -E '\$\{[A-Z_]+:' docker-compose.prod.yml

# Verify all secrets are set
gh secret list --repo justcallmepratt/personal-web-app
```

---

## 📞 Need Help?

- GitHub Docs: https://docs.github.com/en/packages/working-with-a-github-packages-registry
- Docker Docs: https://docs.docker.com/compose/
- Issue Tracker: Create an issue in this repo
