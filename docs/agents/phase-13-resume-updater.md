# Phase 13 — Resume Auto-Updater Agent

> **Status and caveats (2026-11-20)**
> Not started; depends on Phase 12. Admin pages would live in the planned `admin` micro-frontend, not the public app.
> No longer holds: the Vercel redeploy hook (deployment is Vercel's Git integration; no CI deploy jobs or secrets) and Railway-based apply flow.
> **Roadmap (2026-11-20):** Dropped. The redeploy hook is unnecessary (the site re-renders hourly) and market-driven edits to a public résumé invite overstating. See [`docs/ROADMAP.md`](../ROADMAP.md) and [`docs/RESEARCH.md`](../RESEARCH.md).

## Objective
Compare your current `profile` in Supabase against market skill insights from Phase 12.
Generate structured suggestions, let you review them, then apply accepted ones directly
to Supabase and trigger a Vercel redeploy.

## Prerequisites
**Phase 12 must be complete** — `market_insights` table must exist and contain data.

## Backend

### `com.resume.dto.ResumeSuggestion`
```java
public record ResumeSuggestion(
    String field,          // "skills", "tagline", "bio", "techStack"
    String current,        // current value (serialised)
    String suggested,      // suggested value
    String reason,         // human-readable explanation
    double confidence      // 0.0–1.0
) {}
```

### `com.resume.service.ResumeUpdateService`
```java
public List<ResumeSuggestion> generateSuggestions() {
    Profile profile = profileService.get();
    List<MarketInsight> insights = marketRepo.findTopByRoleQuery("software engineer", 20);
    // Compare profile.skills vs top market skills
    // Build suggestions for missing high-confidence skills
    // Suggest tagline update if "Night City Developer" doesn't mention top tech
    return suggestions;
}

@Transactional
public Profile applySuggestions(List<ResumeSuggestion> accepted) {
    // Apply each accepted suggestion to the profile entity
    // Log each change to resume_change_log
    // Save and return updated profile
}
```

### Supabase migration (change log)
```sql
CREATE TABLE IF NOT EXISTS resume_change_log (
    id          BIGSERIAL PRIMARY KEY,
    field       TEXT NOT NULL,
    old_value   TEXT,
    new_value   TEXT,
    applied_at  TIMESTAMP NOT NULL DEFAULT now(),
    confidence  NUMERIC(3,2)
);
```

### Controller endpoints
```
GET  /api/admin/resume/suggestions  → List<ResumeSuggestion>
POST /api/admin/resume/apply        → body: List<ResumeSuggestion> (accepted ones only)
                                     → returns updated Profile
GET  /api/admin/resume/changelog    → List of past changes
```

### Vercel redeploy trigger
After applying suggestions, call Vercel Deploy Hook (set `VERCEL_DEPLOY_HOOK_URL` env var):
```java
restTemplate.postForEntity(vercelDeployHookUrl, null, String.class);
```
Create a Vercel Deploy Hook at: Vercel dashboard → Project → Settings → Git → Deploy Hooks

## Frontend
Route: `frontend/src/app/admin/resume/page.tsx`

Layout:
- Left panel: current profile data (read-only view)
- Right panel: suggestions list
- Each suggestion: field name, current value, suggested value, confidence badge, Accept/Dismiss buttons
- "Apply All Accepted" primary action → calls POST /api/admin/resume/apply
- Change log accordion below
- After apply: success toast + note that live site will redeploy in ~60s

## Tests
```
backend/.../service/ResumeUpdateServiceTest.java
backend/.../controller/ResumeUpdateControllerTest.java
```

## Acceptance criteria
- [ ] `GET /api/admin/resume/suggestions` returns suggestions when market data exists
- [ ] `POST /api/admin/resume/apply` updates the Supabase profile row
- [ ] Change log records every field change
- [ ] Vercel redeploy triggered (or gracefully skipped if hook URL not set)
- [ ] `pnpm test` + `mvn test` ≥ 95%
