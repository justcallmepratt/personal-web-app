# Phase 8 — Amplitude Analytics Agent

> **Status and caveats (2026-11-20)**
> Not started. The Amplitude key that was in this file has been replaced with a placeholder; there is no analytics code in the repo.
> No longer holds: the key was "already set in Vercel" via CLI (not verified), and `NEXT_PUBLIC_AMPLITUDE_API_KEY` is no longer in `.env.example`.

## Objective
Wire Amplitude into the frontend so every meaningful user interaction is tracked.
Create an Amplitude dashboard with key metrics.

## Prerequisites
None.

## Environment variables needed
| Var | Value | Where |
|---|---|---|
| `NEXT_PUBLIC_AMPLITUDE_API_KEY` | `<your-amplitude-api-key>` | Vercel build env + `.env.local` |

## Steps

### 1. Install SDK
```bash
cd frontend
pnpm add @amplitude/analytics-browser
```

### 2. Create `frontend/src/lib/analytics.ts`
```ts
'use client'
import * as amplitude from '@amplitude/analytics-browser'

const API_KEY = process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY ?? ''

export function initAmplitude() {
  if (!API_KEY || typeof window === 'undefined') return
  amplitude.init(API_KEY, { defaultTracking: true })
}

export const track = amplitude.track.bind(amplitude)
```

### 3. Call `initAmplitude()` in `frontend/src/app/layout.tsx`
- Import and call in the RootLayout client component wrapper
- Must be a `'use client'` component — create `frontend/src/components/layout/AmplitudeProvider.tsx`

### 4. Track these events

| Event name | Where fired | Properties |
|---|---|---|
| `page_viewed` | Every route change | `{ page: pathname, referrer }` |
| `cv_downloaded` | NeonButton "Download CV" click | `{ source: 'hero' }` |
| `contact_submitted` | ContactForm successful POST | `{ subject_length: number }` |
| `project_link_clicked` | NeonCard DEMO or REPO link | `{ project_title, link_type: 'demo'|'repo' }` |
| `skill_filter_changed` | SkillsChart filter button | `{ category: string }` |
| `experience_viewed` | ExperienceTimeline scrollIntoView | `{ company, role }` |

### 5. Add Amplitude Vercel env var
Run via Vercel CLI (already done — key set as `NEXT_PUBLIC_AMPLITUDE_API_KEY`).

### 6. Tests
Create `frontend/src/test/lib/analytics.test.ts`:
- Test `initAmplitude()` does nothing when `API_KEY` is empty
- Test `initAmplitude()` calls `amplitude.init` when key present (mock amplitude)
- Test `track` re-exports amplitude.track

## Acceptance criteria
- [ ] `pnpm test` passes
- [ ] `pnpm build` passes
- [ ] Visiting `http://localhost:3000` fires an Amplitude event (check browser Network tab → amplitude.com/2/httpapi)
- [ ] Amplitude dashboard at app.amplitude.com shows events

## Files to create/modify
```
frontend/src/lib/analytics.ts           NEW
frontend/src/components/layout/AmplitudeProvider.tsx  NEW
frontend/src/app/layout.tsx             MODIFY (wrap with AmplitudeProvider)
frontend/src/components/ui/NeonButton.tsx MODIFY (add onClick track for CV)
frontend/src/components/sections/ContactForm.tsx MODIFY (track on success)
frontend/src/components/ui/NeonCard.tsx  MODIFY (track link clicks)
frontend/src/components/sections/SkillsChart.tsx MODIFY (track filter)
frontend/src/test/lib/analytics.test.ts  NEW
```
