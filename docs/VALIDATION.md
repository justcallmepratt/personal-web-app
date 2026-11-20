> **Historical snapshot (2026-05-18).** This reports on a deployment that no longer exists (old Railway backend and Vercel setup). [DEPLOYMENT.md](DEPLOYMENT.md) is current; do not rely on the figures below.

# End-to-End Validation Report

**Last run:** 2026-05-18
**Method:** Local tests + live production smoke + multi-plugin verification

---

## Test suite — 241 / 241 green

| Suite | Count | Tool | Status |
|---|---|---|---|
| Backend | 129 | JUnit 5 + Mockito + JaCoCo | ✅ |
| Frontend | 112 | Vitest + React Testing Library | ✅ |
| **Total** | **241** | | ✅ |

---

## Production endpoints — confirmed live

### Backend (https://personal-web-app-backend-production.up.railway.app)

| Endpoint | Status | Sample response |
|---|---|---|
| `GET /actuator/health` | ✅ 200 | `{"status":"UP"}` |
| `GET /api/profile` | ✅ 200 | name=V, 12 skills, 3 socials |
| `GET /api/projects` | ✅ 200 | 5 projects (2 featured) |
| `GET /api/experience` | ✅ 200 | 4 entries |
| `GET /api/contact/validate-email?email=...` | ✅ 200/422 | see email validation below |
| `POST /api/contact` | ✅ 200/422/429 | see rate limiting below |
| `GET /api/admin/messages` (no JWT) | ✅ 403 | correctly blocked |

### Frontend (https://frontend-liard-theta-28.vercel.app)

| Check | Status |
|---|---|
| Page renders | ✅ |
| Hero data populated | ✅ |
| Projects + Featured Ops visible | ✅ |
| Navbar links present | ✅ |
| OLED bg (#000000) | ✅ |

---

## Email anti-phishing — 3-layer defence (LIVE)

```
GET /api/contact/validate-email?email=user@mailinator.com
→ 422 {"success":false,"message":"Disposable or throwaway email addresses are not accepted."}

GET /api/contact/validate-email?email=user@test.com
→ 422 {"success":false,"message":"The email domain has no mail server."}

GET /api/contact/validate-email?email=user@gmail.com
→ 200 {"success":true,"message":"Email looks good."}
```

---

## Rate limiting — IP-based sliding window (LIVE)

```
5 rapid POSTs to /api/contact from same IP:
  Req 1: HTTP 200 ✅
  Req 2: HTTP 200 ✅
  Req 3: HTTP 200 ✅
  Req 4: HTTP 429 ← rate-limited
  Req 5: HTTP 429 ← rate-limited
```

Config: 3 submissions / 1 hour window per IP. Override via `CONTACT_RATE_LIMIT_MAX` + `CONTACT_RATE_LIMIT_WINDOW` env vars.

---

## Open Dependabot PRs (2026-05-18)

| PR | Update | Type | Action |
|---|---|---|---|
| #2 | Spring Boot 3.5 → 4.0.6 | major | manual review — read [Spring Boot 4 migration guide](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-4.0-Migration-Guide) |
| #5 | next-react group (Next 16 → ?, React 19 → ?) | major | manual review |
| #10 | TypeScript 5.9 → 6.0 | major | manual review |
| #12 | springdoc 2.5 → 3.0 | major | manual review |
| #13 | @types/node 25.6 → 25.8 | minor | auto-merge eligible (rebase pending) |
| #14 | tailwind group | minor | auto-merge eligible (rebase pending) |

---

## Connectors validated (16 total)

| Connector | Status | Confirmed working |
|---|---|---|
| Supabase | ✅ | migrations, advisors, SQL |
| Vercel | ✅ | env vars, deploy, runtime logs (via CLI) |
| Railway | ✅ | deploy, logs, env vars (via CLI) |
| Google Calendar | ✅ | recurring event created |
| Gmail | ✅ | read + label scope |
| Notion | ✅ | docs + pitch deck + this report |
| Amplitude | ✅ | tracking plan ready (Phase 8 will wire SDK) |
| Chrome Preview | ✅ | screenshots at any viewport |
| Google Drive | ✅ | read access |
| GitHub (ecc plugin) | ✅ | PR list, issues, statuses, code search |
| Context7 (ecc plugin) | ✅ | library docs lookup |
| Memory (knowledge graph) | ✅ | available for cross-session memory |
| Playwright (ecc plugin) | ⚙️ needs Chrome extension | use Chrome Preview instead |
| Slack | 🔗 OAuth pending | URL shared in session |
| GitHub Copilot | 🔗 OAuth pending | requires Copilot subscription |
| Figma (Dev Mode MCP) | ⚙️ needs desktop app setting | one-time enable in Figma desktop |

---

## Outstanding user actions

| # | Action | Effort | Unblocks |
|---|---|---|---|
| 1 | Railway dashboard → Service → Settings → Deploy Hooks → Add → `gh secret set RAILWAY_DEPLOY_HOOK_URL` | 2 min | automated backend deploys in CI |
| 2 | Vercel dashboard → Project → Settings → General → Root Directory = `frontend` | 30 sec | simplifies CI back to `vercel --prod` (no prebuild dance) |
| 3 | Gmail → Settings → Filters → subject `[Resume Contact]` → label `Night City Dev / Contacts` | 1 min | auto-organises inbound contact emails |
| 4 | Open Slack OAuth URL from session and authorize | 1 min | enables deploy notifications |
| 5 | Figma desktop → Preferences → Enable Dev Mode MCP Server | 30 sec | unlocks design token extraction for Phase 7 |
| 6 | Manually merge or close major PRs #2, #5, #10, #12 after reading migration guides | varies | clears Dependabot backlog |
