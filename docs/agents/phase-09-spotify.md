# Phase 9 — Spotify Integration Agent

> **Status and caveats (2026-11-20)**
> Not started. Frontend-only; `NEXT_PUBLIC_SPOTIFY_TRACK_ID` was removed from `.env.example` and would need adding back.
> No Railway assumptions.
> **Roadmap (2026-11-20):** Dropped. Logged-out visitors get a ~30 s preview, and the music and brand question is open. If revived: click-to-load only, after asking CD PROJEKT RED. See [`docs/ROADMAP.md`](../ROADMAP.md) and [`docs/RESEARCH.md`](../RESEARCH.md).

## Objective
Embed the Cyberpunk 2077 OST track "The Rebel Path" by Refused in the hero section.
User clicks once to play — browser autoplay policy means we cannot autoplay on load.

## Prerequisites
None.

## Environment variables
| Var | Value | Where |
|---|---|---|
| `NEXT_PUBLIC_SPOTIFY_TRACK_ID` | `5HTHMQ8wMAlF6cEo6bx0aL` | `.env.local` + Vercel |

## Steps

### 1. Create `frontend/src/components/ui/SpotifyPlayer.tsx`
```tsx
'use client'
// Renders a collapsed Spotify embed. On click it expands and loads the iframe.
// Spotify embed docs: https://developer.spotify.com/documentation/embeds
```
Props:
```ts
interface Props {
  trackId: string          // Spotify track ID
  collapsed?: boolean      // initial state, default true
}
```
Implementation:
- Collapsed state: show a small HUDChrome panel with track name + ▶ PLAY button
- Expanded state: render the Spotify iframe embed
  ```html
  <iframe
    src="https://open.spotify.com/embed/track/{trackId}?utm_source=generator&theme=0"
    width="100%" height="152" frameBorder="0" allow="autoplay; clipboard-write;
    encrypted-media; fullscreen; picture-in-picture" loading="lazy"
  />
  ```
- On first click: set expanded=true (iframe loads + Spotify autoplays within the iframe)
- Pulse effect: `animate-pulse` on the HUDChrome border while `isPlaying` state is true
- `isPlaying` detected via `window.message` events from the Spotify embed iframe

### 2. Mount in `HeroSection.tsx`
- Add below the button row, above the System Profile card on desktop
- Full width on mobile, constrained to `md:col-span-2` on desktop
- Track ID from `process.env.NEXT_PUBLIC_SPOTIFY_TRACK_ID`

### 3. Styling
- Collapsed: `HUDChrome accent="red"` with `▶ THE REBEL PATH · REFUSED` label
- Expanded: `HUDChrome accent="red"` with neon-pulse border animation while playing
- Font: `font-[var(--font-mono)] text-xs uppercase tracking-widest`

### 4. Add env var to Vercel
```bash
echo "5HTHMQ8wMAlF6cEo6bx0aL" | npx vercel env add NEXT_PUBLIC_SPOTIFY_TRACK_ID production --yes
```

### 5. Tests
`frontend/src/test/components/ui/SpotifyPlayer.test.tsx`:
- Renders collapsed state by default with track label
- Clicking ▶ expands the component
- Iframe is not in DOM when collapsed
- Iframe is in DOM when expanded with correct src

## Acceptance criteria
- [ ] `pnpm test` passes
- [ ] In collapsed state: small panel shows track name and play button
- [ ] After one click: Spotify iframe loads and music plays
- [ ] No autoplay on initial page load (no sound before user interaction)

## Files to create/modify
```
frontend/src/components/ui/SpotifyPlayer.tsx     NEW
frontend/src/components/sections/HeroSection.tsx MODIFY
frontend/.env.local                              MODIFY (add track ID)
frontend/src/test/components/ui/SpotifyPlayer.test.tsx NEW
```
