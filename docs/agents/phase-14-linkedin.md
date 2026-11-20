# Phase 14 — LinkedIn Sync Agent

> **Status and caveats (2026-11-20)**
> Not started. Upload page at `/admin/linkedin` would belong to the planned `admin` micro-frontend, not the public app.
> No Railway CLI or `NEXT_PUBLIC_API_URL` use in this brief that still applies; the browser never calls the API directly.
> **Roadmap (2026-11-20):** Drop as a feature; read the export once and update `content/index.ts` by hand (WP-E). See [`docs/ROADMAP.md`](../ROADMAP.md) and [`docs/RESEARCH.md`](../RESEARCH.md).

## Objective
Import your LinkedIn data export (ToS-compliant) and sync it to your Supabase profile
and experience tables. Also generate LinkedIn-ready copy from your existing profile data.

## Why not live API?
LinkedIn's `r_member_social` scope (read your own posts) requires Partner Program approval
(months-long review). Data Export is instant, free, and ToS-compliant.

## Data export instructions (agent documents for user)
1. LinkedIn → Me → Settings & Privacy → Data Privacy → Get a copy of your data
2. Select: Profile, Positions, Skills, Recommendations Received
3. Download ZIP (arrives in ~10 min via email)
4. Upload ZIP at `/admin/linkedin`

## Backend

### `com.resume.service.LinkedInParserService`
Accepts `MultipartFile` (ZIP):
1. Unzip in memory
2. Parse `Profile.csv` → name, headline, summary, location
3. Parse `Positions.csv` → company, title, start date, end date, description
4. Parse `Skills.csv` → skill names
5. Return `LinkedInDiff` DTO:
   ```java
   public record LinkedInDiff(
       Profile profileChanges,
       List<Experience> newExperiences,
       List<String> newSkills,
       List<String> warnings
   ) {}
   ```

### Controller
```
POST /api/admin/linkedin/import   multipart/form-data { file: ZIP }
                                  → LinkedInDiff (preview, not applied)
POST /api/admin/linkedin/apply    body: LinkedInDiff (apply to DB)
```

### Supabase migration
```sql
CREATE TABLE IF NOT EXISTS linkedin_snapshots (
    id          BIGSERIAL PRIMARY KEY,
    filename    TEXT NOT NULL,
    imported_at TIMESTAMP NOT NULL DEFAULT now(),
    raw_json    JSONB NOT NULL,   -- parsed CSV data stored for audit
    applied     BOOLEAN DEFAULT false
);
```

## LinkedIn Copy Generator (no API needed)

### `com.resume.service.LinkedInCopyService`
Uses existing profile + experience from Supabase to generate:
- `generateAboutSection()` → 3-paragraph About from bio + top 5 skills + tagline
- `generateExperiencePost(Experience e)` → LinkedIn post announcing role
- `generateProjectPost(Project p)` → LinkedIn post about a project

All return plain `String` (Markdown-formatted).

### Endpoints
```
GET /api/admin/linkedin/copy/about             → String (LinkedIn About section)
GET /api/admin/linkedin/copy/experience/{id}   → String (post draft)
GET /api/admin/linkedin/copy/project/{id}      → String (post draft)
```

## Frontend
Route: `frontend/src/app/admin/linkedin/page.tsx`

Two tabs:
1. **Import** — drag-and-drop ZIP upload zone → diff preview → Apply button
2. **Copy Generator** — select item type → generated text in a copyable TerminalInput

## Tests
```
backend/.../service/LinkedInParserServiceTest.java   (mock ZIP file parsing)
backend/.../service/LinkedInCopyServiceTest.java
backend/.../controller/LinkedInControllerTest.java
```

## Acceptance criteria
- [ ] Uploading a sample LinkedIn export ZIP returns a non-empty diff
- [ ] Applying the diff updates the Supabase profile table
- [ ] Copy generator returns text for About, experience, and project
- [ ] `pnpm test` + `mvn test` ≥ 95%
