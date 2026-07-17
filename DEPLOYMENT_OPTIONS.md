# Deployment Options: GitHub Pages & GHCR

This document outlines deployment strategies for your application using GitHub's native services and container registry.

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Deployment Options](#deployment-options)
3. [Step-by-Step Guides](#step-by-step-guides)
4. [Quick Start Commands](#quick-start-commands)
5. [Monitoring & Troubleshooting](#monitoring--troubleshooting)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                  GitHub Repository                          │
│  ┌────────────────┐              ┌──────────────────┐      │
│  │  GitHub Pages  │◄─────────────┤  GitHub Actions  │      │
│  │  (Frontend)    │              │  (CI/CD)         │      │
│  └────────────────┘              └──────────────────┘      │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ Build & Push
                          ▼
            ┌──────────────────────────┐
            │ GitHub Container Registry│
            │        (GHCR)            │
            │  - Backend Image         │
            │  - Frontend Image        │
            └──────────────────────────┘
                          │
            ┌─────────────┴─────────────┐
            ▼                           ▼
    ┌──────────────┐         ┌──────────────────┐
    │ Docker Host  │         │ GitHub Pages     │
    │ (VPS/Cloud)  │         │ (Static Export)  │
    │              │         │                  │
    │ - Backend    │         │ - Frontend       │
    │ - Frontend   │         │ - Static Files   │
    │ - Postgres   │         └──────────────────┘
    └──────────────┘
```

---

## Deployment Options

### Option 1: GitHub Pages (Frontend Only)

**Best for:** Static-friendly Next.js sites, minimal backend needs

**Pros:**
- Free (GitHub Pages included)
- Zero infrastructure management
- Automatic SSL/HTTPS
- Fast CDN delivery

**Cons:**
- Frontend only (no dynamic backend hosting)
- Requires static export (`next export`)
- Limited to 1GB repo size
- No server-side rendering

**Setup Time:** 5 minutes

---

### Option 2: Docker Host + GHCR (Recommended)

**Best for:** Full-stack applications, self-managed infrastructure

**Pros:**
- Control over both frontend and backend
- Use any infrastructure (VPS, cloud, on-prem)
- Database in same environment
- Scalable and flexible

**Cons:**
- You manage the server
- SSL/security is your responsibility
- Requires infrastructure cost (VPS ~$5-20/month)

**Setup Time:** 30 minutes

---

### Option 3: Kubernetes (Advanced)

**Best for:** High availability, auto-scaling, complex deployments

**Pros:**
- Auto-scaling
- Self-healing
- Rolling updates
- Multi-node clusters

**Cons:**
- Complex setup
- Steep learning curve
- Higher infrastructure cost

**Setup Time:** 2-4 hours

---

## Step-by-Step Guides

### 🟦 Option 1A: GitHub Pages (Static Export)

#### Step 1: Verify Next.js Static Export Config
Edit `frontend/next.config.js`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // Enable static export
  images: {
    unoptimized: true, // Required for static export
  },
};

module.exports = nextConfig;
```

#### Step 2: Enable GitHub Pages
1. Go to **Settings** → **Pages**
2. Under **Build and deployment**:
   - **Source**: Deploy from a branch
   - **Branch**: `main`
   - **Folder**: `/ (root)` or `/docs` (if you export there)
3. Click **Save**

#### Step 3: Update Frontend Build Output
Modify `frontend/package.json`:
```json
{
  "scripts": {
    "build": "next build && next export -o out",
    "export": "next export -o out"
  }
}
```

#### Step 4: Add GitHub Pages Deploy Step
Create `.github/workflows/pages.yml`:
```yaml
name: Deploy Frontend to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: '22'
      - uses: pnpm/action-setup@v6
        with:
          version: 9
      
      - name: Install dependencies
        working-directory: frontend
        run: pnpm install --frozen-lockfile
      
      - name: Build
        working-directory: frontend
        run: pnpm build
      
      - name: Upload artifacts
        uses: actions/upload-pages-artifact@v3
        with:
          path: 'frontend/out'
      
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

#### Step 5: Verify Deployment
- Push to `main`
- Check Actions tab for workflow completion
- Visit `https://justcallmepratt.github.io/personal-web-app`

---

### 🐳 Option 2: Docker Host on VPS (DigitalOcean/Linode/AWS)

#### Step 1: Provision a VPS
Examples:
- **DigitalOcean Droplet**: Ubuntu 24.04, 2GB RAM, $6/month
- **Linode**: 2GB Nanode, ~$12/month
- **AWS EC2**: t3.micro (free tier eligible)

#### Step 2: Install Docker & Docker Compose
```bash
ssh root@your-vps-ip

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify
docker --version
docker-compose --version
```

#### Step 3: Create Production Secrets File
```bash
# On your local machine
cat > .env.production <<EOF
DB_PASSWORD=your-secure-password-here
JWT_SECRET=your-jwt-secret-key-min-32-chars
ADMIN_PASSWORD_HASH=\$2a\$12\$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj8lLxKQZK.
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-password
CORS_ORIGIN=https://your-domain.com
NEXT_PUBLIC_API_URL=https://api.your-domain.com
NEXT_PUBLIC_SITE_NAME=V // Night City Dev
NEXT_PUBLIC_SITE_URL=https://your-domain.com
EOF
```

#### Step 4: Deploy
```bash
# Copy files to VPS
scp docker-compose.prod.yml root@your-vps-ip:/app/docker-compose.yml
scp .env.production root@your-vps-ip:/app/.env

# Connect and start
ssh root@your-vps-ip
cd /app

# Login to GHCR first
docker login ghcr.io -u justcallmepratt

# Start services
docker-compose -f docker-compose.yml up -d

# Verify
docker-compose ps
```

#### Step 5: Set Up Reverse Proxy (nginx/Caddy)
```bash
# Install Caddy (auto SSL)
sudo apt update && sudo apt install -y caddy

# Create Caddyfile
sudo tee /etc/caddy/Caddyfile <<EOF
your-domain.com {
  reverse_proxy localhost:3000
}

api.your-domain.com {
  reverse_proxy localhost:8080
}
EOF

# Start Caddy
sudo systemctl restart caddy
```

#### Step 6: Set Up Backups
```bash
# Daily database backup script
cat > /app/backup.sh <<'EOF'
#!/bin/bash
BACKUP_DIR="/app/backups"
mkdir -p $BACKUP_DIR
docker exec personal-web-app-postgres pg_dump -U postgres personal_web_app | \
  gzip > $BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql.gz
EOF

chmod +x /app/backup.sh

# Add to crontab
crontab -e
# Add: 0 2 * * * /app/backup.sh
```

---

### 🟦 Option 2B: Docker Host on Render.com (PaaS)

#### Step 1: Create Web Service on Render
1. Go to [render.com](https://render.com)
2. Click **New +** → **Web Service**
3. Connect your GitHub repo
4. Set configuration:
   - **Name**: `personal-web-app-backend`
   - **Environment**: `Docker`
   - **Plan**: `Free` or `Starter ($12/month)`
5. Click **Create Web Service**

#### Step 2: Set Environment Variables
1. Go to **Environment** tab
2. Add all variables from `.env.production`
3. Restart service

#### Step 3: Add Database
1. Click **New +** → **PostgreSQL**
2. Set configuration:
   - **Name**: `personal-web-app-db`
   - **Plan**: `Free` (limited to 90 days)
3. Copy connection string to backend service env vars

---

## Quick Start Commands

### Build Images Locally
```bash
# Backend
docker build -t personal-web-app-backend ./backend

# Frontend
docker build -t personal-web-app-frontend ./frontend
```

### Run Locally with Docker Compose
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

### Pull & Run from GHCR
```bash
# Login first
docker login ghcr.io -u justcallmepratt

# Pull images
docker pull ghcr.io/justcallmepratt/personal-web-app-backend:latest
docker pull ghcr.io/justcallmepratt/personal-web-app-frontend:latest

# Run backend
docker run -d \
  -e SPRING_DATASOURCE_URL=postgresql://... \
  -p 8080:8080 \
  ghcr.io/justcallmepratt/personal-web-app-backend:latest

# Run frontend
docker run -d \
  -e NEXT_PUBLIC_API_URL=http://localhost:8080 \
  -p 3000:3000 \
  ghcr.io/justcallmepratt/personal-web-app-frontend:latest
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Update Images
```bash
# Pull latest
docker pull ghcr.io/justcallmepratt/personal-web-app-backend:latest

# Restart with new image
docker-compose up -d
```

---

## Monitoring & Troubleshooting

### Check Service Health
```bash
# Containers running
docker ps

# Logs
docker logs -f personal-web-app-backend

# Resource usage
docker stats

# Network
docker network ls
docker network inspect personal-web-app_default
```

### Common Issues

#### Backend won't connect to database
```bash
# Check Postgres is running
docker ps | grep postgres

# Check connection string format
# Should be: jdbc:postgresql://postgres:5432/personal_web_app

# Test connection from backend container
docker exec personal-web-app-backend \
  curl -I http://postgres:5432
```

#### Frontend can't reach backend
```bash
# Verify backend is healthy
curl http://localhost:8080/health

# Check CORS is configured correctly
# Backend CORS_ORIGIN should match frontend domain

# Verify NEXT_PUBLIC_API_URL is set
docker exec personal-web-app-frontend env | grep API_URL
```

#### Images failing to push to GHCR
```bash
# Check permissions
gh api repos/justcallmepratt/personal-web-app/actions/permissions

# Manually test push
docker login ghcr.io
docker tag local-image ghcr.io/justcallmepratt/personal-web-app:test
docker push ghcr.io/justcallmepratt/personal-web-app:test
```

---

## Cost Comparison

| Option | Setup | Monthly | Maintenance |
|--------|-------|---------|-------------|
| GitHub Pages | 5 min | $0 | None |
| VPS (DigitalOcean) | 30 min | $6-20 | Moderate |
| Render.com | 15 min | $12+ | Low |
| Kubernetes | 2-4 hrs | $20+ | High |

---

## Recommended Path

1. **Start here**: Try GitHub Pages (free, no maintenance)
2. **Scale to**: VPS with Docker (control, flexibility)
3. **Optimize at scale**: Kubernetes (high availability)

---

## Next Steps

1. Choose your deployment option
2. Follow the step-by-step guide
3. Test locally with Docker Compose
4. Deploy and monitor
5. Set up backups and monitoring
