# Phase 10 — Citation / Credits Page Agent

> **Status and caveats (2026-11-20)**
> **Done 2026-11-20 as WP-C.** `/credits` (data in `frontend/src/lib/credits.ts`), a `Footer` component with the short disclaimer, and a sitemap entry. The page lists only what is in the code; Its Railway entry still says the API is not live; that text predates the Railway deployment. The Spotify, Amplitude and navbar steps below were dropped (see the roadmap); the link is in the footer. The original brief follows for reference.
> **Roadmap (2026-11-20):** Done (WP-C). See [`docs/ROADMAP.md`](../ROADMAP.md) and [`docs/RESEARCH.md`](../RESEARCH.md).

## Objective
Build a `/credits` route that cites all tech, design, music, fonts, and hosting used
in the project. Styled with the CP2077 design system.

## Prerequisites
None.

## Steps

### 1. Create `frontend/src/app/credits/page.tsx`
Server component. No API calls needed — data is static.

### 2. Add "CREDITS" to Navbar
In `frontend/src/components/layout/Navbar.tsx`, add to the `links` array:
```ts
{ href: '/credits', label: 'CREDITS' }
```

### 3. Page structure
Each section is a `HUDChrome` card with `accent="teal"|"yellow"|"red"` alternating.

```
// CREDITS & CITATIONS

▰ TECH STACK
  - Next.js 16 (MIT) · Vercel
  - Spring Boot 3.5 (Apache 2.0) · VMware/Broadcom
  - Tailwind CSS 4 (MIT) · Tailwind Labs
  - Framer Motion 12 (MIT) · Framer
  - Supabase (Apache 2.0) · Supabase Inc.
  - Railway (proprietary SaaS) · Railway Corp.
  … (full list from package.json + pom.xml)

▰ DESIGN LANGUAGE
  - Cyberpunk 2077 · Neo Militarism aesthetic · CD PROJEKT RED
  - Inspiration: brittanychiang.com, leerob.io, rauno.me

▰ MUSIC
  - "The Rebel Path" · Refused · Cyberpunk 2077 OST
  - © 2020 CD PROJEKT RED · Spotify embed used under Spotify's embed policy

▰ FONTS
  - Orbitron · Matt McInerney · SIL OFL · Google Fonts
  - Share Tech Mono · Igino Marini · SIL OFL · Google Fonts
  - Rajdhani · Indian Type Foundry · SIL OFL · Google Fonts

▰ TOOLING
  - GitHub Actions CI/CD
  - JaCoCo 0.8.12 (ECL 2.0)
  - Vitest 4 (MIT)
  - Amplitude Analytics (proprietary SaaS)
  - Docker (Apache 2.0)
```

### 4. Data structure
Define a typed `credits.ts` file with the citations data:
```ts
// frontend/src/lib/credits.ts
export type CreditEntry = { name: string; role: string; license?: string; url: string }
export type CreditSection = { title: string; accent: 'red'|'yellow'|'teal'; items: CreditEntry[] }
export const CREDITS: CreditSection[] = [ ... ]
```

### 5. Metadata
```ts
export const metadata = { title: 'Credits // Citations' }
```

### 6. Tests
`frontend/src/test/app/credits.test.tsx`:
- Renders "CREDITS" heading
- All section titles present
- Spotify music credit present
- At least one tech entry links to an external URL

## Acceptance criteria
- [ ] `/credits` route renders without error
- [ ] All 5 sections visible
- [ ] Navbar includes CREDITS link
- [ ] `pnpm test` passes
- [ ] Mobile layout looks correct (single column)

## Files to create/modify
```
frontend/src/app/credits/page.tsx           NEW
frontend/src/lib/credits.ts                 NEW
frontend/src/components/layout/Navbar.tsx   MODIFY (add link)
frontend/src/test/app/credits.test.tsx      NEW
```
