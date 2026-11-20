# Phase 7 — Visual Polish Agent

> **Status and caveats (2026-11-20)**
> Partly done: some visual polish landed directly in the public app; the brief's checklist was not tracked. Check the current UI before redoing items.
> Still valid: animation and Lighthouse goals. No Railway or deploy assumptions.

## Objective
Complete the remaining visual animations and polish from the original design spec.
Run a Lighthouse audit and fix any failures.

## Prerequisites
None.

## Tasks

### 7-A  ExperienceTimeline scroll-reveal (Framer Motion)
File: `frontend/src/components/sections/ExperienceTimeline.tsx`

Wrap each `<li>` in a `<motion.li>`:
```tsx
<motion.li
  key={e.id}
  initial={{ opacity: 0, y: 40 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, amount: 0.2 }}
  transition={{ duration: 0.5, delay: i * 0.1 }}
>
```
Result: entries stagger in as user scrolls down.

### 7-B  Hero typewriter boot animation
File: `frontend/src/components/sections/HeroSection.tsx`

Replace the static `<p className="terminal-cursor">init: night_city.exe</p>` with a
`Typewriter` client component:

```tsx
// frontend/src/components/ui/Typewriter.tsx
'use client'
// Types out the text character by character using useState + useEffect
// Shows blinking cursor while typing, stops blinking when done
```

Props: `{ text: string; speed?: number; className?: string }`

### 7-C  Neon-pulse on active navbar link
File: `frontend/src/components/layout/Navbar.tsx`

Add `animate-neon-pulse` Tailwind class to the active link:
```tsx
className={`... ${active ? 'text-cp-red animate-[neon-pulse-red_3s_ease-in-out_infinite]' : '...'}`}
```
Add `neon-pulse-red` keyframe to `globals.css`:
```css
@keyframes neon-pulse-red {
  0%, 100% { text-shadow: 0 0 4px #C5003C44, 0 0 12px #C5003C22; }
  50%      { text-shadow: 0 0 8px #C5003C88, 0 0 24px #C5003C44; }
}
```

### 7-D  NeonCard glitch-on-hover
File: `frontend/src/components/ui/NeonCard.tsx`

Wrap project title in `<span>` with Framer Motion `whileHover`:
```tsx
<motion.h3
  whileHover={{ x: [-1, 1, -1, 0], transition: { duration: 0.2 } }}
  className="font-[var(--font-display)] text-lg text-cp-red tracking-wider cursor-pointer"
>
```

### 7-E  Particle field in hero background (canvas)
File: `frontend/src/components/ui/ParticleField.tsx` (new, `'use client'`)

- 60 small dots in `cp-border` colour moving slowly on a `<canvas>`
- Mouse proximity increases dot speed
- Render behind hero content via `absolute inset-0 -z-10`
- Disable on `prefers-reduced-motion`

### 7-F  Lighthouse audit
Run:
```bash
npx lighthouse http://localhost:3000 \
  --output=json --output-path=docs/lighthouse/local-baseline.json \
  --chrome-flags="--headless"
```

Fix any issues:
- Performance < 85: look for LCP, CLS, FID issues
- Accessibility < 90: missing alt text, color contrast (`cp-red` #C5003C on `cp-dark` #0D0D0D may fail AA — use #E0004E instead)
- Best Practices < 90: check console errors, deprecated APIs

### 7-G  Real CV + OG image
- Replace `frontend/public/cv.pdf` with actual CV (if user provides path)
- Create `frontend/public/og.png` (1200×630): cyberpunk-styled preview with name + tagline
  - Can be generated with `canvas` in a script or provided manually

## Tests
Update existing tests if component APIs change:
```
frontend/src/test/components/sections/ExperienceTimeline.test.tsx  UPDATE
frontend/src/test/components/ui/Typewriter.test.tsx               NEW
frontend/src/test/components/ui/ParticleField.test.tsx            NEW
```

## Acceptance criteria
- [ ] Experience items animate in on scroll (staggered)
- [ ] Hero boot text types out character by character
- [ ] Active nav link glows
- [ ] NeonCard titles twitch on hover
- [ ] Particles visible in hero background (no performance regression)
- [ ] Lighthouse Performance ≥ 85, Accessibility ≥ 90, Best Practices ≥ 90
- [ ] `pnpm test` passes
