import { readFileSync } from 'node:fs'
import path from 'node:path'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import SkipLink, { MAIN_CONTENT_ID } from '@/components/layout/SkipLink'
import ExperienceTimeline from '@/components/sections/ExperienceTimeline'
import ProjectsGrid from '@/components/sections/ProjectsGrid'
import HUDChrome from '@/components/layout/HUDChrome'
import NeonButton from '@/components/ui/NeonButton'
import { accents } from '@/lib/theme'
import type { Experience, Project } from '@/lib/types'

const css = readFileSync(path.resolve(__dirname, '../../app/globals.css'), 'utf8')

// ── WCAG contrast helpers ───────────────────────────────────────────────────
function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}
function token(name: string) {
  const match = css.match(new RegExp(`--color-${name}:\\s*(#[0-9A-Fa-f]{6});`))
  if (!match) throw new Error(`token ${name} not found in globals.css`)
  return match[1]
}

// Every surface text is drawn on: page, cp-panel, and the HUD panel.
const BACKGROUNDS = ['#000000', token('cp-panel'), '#111318']

describe('colour contrast (WCAG AA)', () => {
  it.each(['cp-text', 'cp-teal', 'cp-yellow', 'cp-red', 'cp-muted'])(
    'text token %s is at least 4.5:1 on every background',
    (name) => {
      for (const bg of BACKGROUNDS) {
        expect(contrast(token(name), bg)).toBeGreaterThanOrEqual(4.5)
      }
    },
  )

  it('field borders are at least 3:1 on every background', () => {
    for (const bg of BACKGROUNDS) {
      expect(contrast(token('cp-border-strong'), bg)).toBeGreaterThanOrEqual(3)
    }
  })

  it('the deep red is kept for fills only and the inline accent text colours pass', () => {
    expect(token('cp-red-deep').toUpperCase()).toBe('#C5003C')
    expect(accents.red.text.toUpperCase()).toBe(token('cp-red').toUpperCase())
    for (const { text } of Object.values(accents)) {
      for (const bg of BACKGROUNDS) {
        expect(contrast(text, bg)).toBeGreaterThanOrEqual(4.5)
      }
    }
  })

  it('accent text uses the text colour while borders keep the line colour', () => {
    const { container } = render(<HUDChrome title="Panel"><span>x</span></HUDChrome>)
    const panel = container.firstElementChild as HTMLElement
    expect(panel.style.borderColor).toBe('rgb(197, 0, 60)')
    expect((panel.firstElementChild as HTMLElement).style.color).toBe('rgb(255, 46, 87)')

    render(<NeonButton>Go</NeonButton>)
    const button = screen.getByRole('button', { name: 'Go' })
    expect(button.style.color).toBe('rgb(255, 46, 87)')
    expect(button.style.borderColor).toBe('rgb(197, 0, 60)')
  })
})

describe('globals.css motion and focus rules', () => {
  const reduced = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'))

  it('has a reduced-motion block that stops animations and transitions', () => {
    expect(css).toContain('@media (prefers-reduced-motion: reduce)')
    expect(reduced).toMatch(/animation-duration:\s*0\.01ms\s*!important/)
    expect(reduced).toMatch(/animation-iteration-count:\s*1\s*!important/)
    expect(reduced).toMatch(/transition-duration:\s*0\.01ms\s*!important/)
  })

  it('removes the glitch copies and the cursor blink under reduced motion', () => {
    expect(reduced).toMatch(/\.glitch-text::before,\s*\.glitch-text::after\s*\{[^}]*content:\s*none/)
    expect(reduced).toMatch(/\.terminal-cursor::after\s*\{[^}]*animation:\s*none/)
  })

  it('defines a visible :focus-visible outline and never removes outlines globally', () => {
    expect(css).toMatch(/:focus-visible\s*\{[^}]*outline:\s*2px solid var\(--color-cp-focus\)/)
    expect(css).not.toMatch(/outline:\s*(none|0)\s*;/)
  })

  it('hides decorative generated content from assistive tech', () => {
    expect(css).toContain('content: attr(data-text) / "";')
    expect(css).toContain('content: "▍" / "";')
  })
})

describe('SkipLink', () => {
  it('links to the main content landmark', () => {
    render(<SkipLink />)
    const link = screen.getByRole('link', { name: 'Skip to content' })
    expect(link).toHaveAttribute('href', `#${MAIN_CONTENT_ID}`)
    expect(link).toHaveClass('skip-link')
  })

  it('is hidden by transform (not display) so it stays focusable, and shows on focus', () => {
    expect(css).toMatch(/\.skip-link\s*\{[^}]*transform:\s*translateY\(-200%\)/)
    expect(css).toMatch(/\.skip-link:focus\s*\{[^}]*transform:\s*translateY\(0\)/)
    expect(css).not.toMatch(/\.skip-link\s*\{[^}]*display:\s*none/)
  })
})

describe('heading order', () => {
  const project: Project = {
    id: 1, title: 'Alpha', description: 'd', longDescription: '', tags: ['t'], stack: [],
    demoUrl: 'https://example.test/demo', repoUrl: 'https://example.test/repo', imageUrl: '',
    featured: false, sortOrder: 1, createdAt: '2026-01-01',
  }
  const job: Experience = {
    id: 1, company: 'Acme', role: 'Engineer', location: '', startDate: '2024-01-01', endDate: null,
    current: true, description: 'd', highlights: [], technologies: [], sortOrder: 1,
  }

  it('project cards are h2 directly under a page h1 (the /projects page)', () => {
    render(<ProjectsGrid projects={[project]} />)
    expect(screen.getByRole('heading', { level: 2, name: 'Alpha' })).toBeInTheDocument()
  })

  it('project cards are h3 under a section h2 (home page featured list)', () => {
    render(<ProjectsGrid projects={[project]} headingLevel={3} />)
    expect(screen.getByRole('heading', { level: 3, name: 'Alpha' })).toBeInTheDocument()
  })

  it('experience roles are h2', () => {
    render(<ExperienceTimeline items={[job]} />)
    expect(screen.getByRole('heading', { level: 2, name: 'Engineer' })).toBeInTheDocument()
  })

  it('card links name their project and say they open a new tab; glyphs are hidden', () => {
    render(<ProjectsGrid projects={[project]} />)
    expect(screen.getByRole('link', { name: 'DEMO: Alpha (opens in a new tab)' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'REPO: Alpha (opens in a new tab)' })).toBeInTheDocument()
  })
})
