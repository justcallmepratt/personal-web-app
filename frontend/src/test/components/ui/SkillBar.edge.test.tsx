import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import SkillBar from '@/components/ui/SkillBar'

/**
 * Edge-case tests for SkillBar.
 * Note: Framer Motion doesn't run animations in jsdom, so we test rendered
 * level text and colour via the percentage label (which mirrors the colour logic).
 */
describe('SkillBar — edge cases', () => {
  // ── Level display: padding to 3 digits ───────────────────────────────────

  it('level 0 displays as "000%"', () => {
    render(<SkillBar skill={{ name: 'Zero', category: 'Other', level: 0 }} />)
    expect(screen.getByText('000%')).toBeInTheDocument()
  })

  it('level 5 displays as "005%"', () => {
    render(<SkillBar skill={{ name: 'Five', category: 'Other', level: 5 }} />)
    expect(screen.getByText('005%')).toBeInTheDocument()
  })

  it('level 39 displays as "039%"', () => {
    render(<SkillBar skill={{ name: 'Low', category: 'Other', level: 39 }} />)
    expect(screen.getByText('039%')).toBeInTheDocument()
  })

  it('level 40 displays as "040%"', () => {
    render(<SkillBar skill={{ name: 'Mid', category: 'Frontend', level: 40 }} />)
    expect(screen.getByText('040%')).toBeInTheDocument()
  })

  it('level 70 displays as "070%"', () => {
    render(<SkillBar skill={{ name: 'Mid', category: 'Backend', level: 70 }} />)
    expect(screen.getByText('070%')).toBeInTheDocument()
  })

  it('level 71 displays as "071%"', () => {
    render(<SkillBar skill={{ name: 'High', category: 'Backend', level: 71 }} />)
    expect(screen.getByText('071%')).toBeInTheDocument()
  })

  it('level 100 displays as "100%"', () => {
    render(<SkillBar skill={{ name: 'Max', category: 'Frontend', level: 100 }} />)
    expect(screen.getByText('100%')).toBeInTheDocument()
  })

  // ── Colour correctness: verify via computed style on the % label span ─────
  // The label span uses `style={{ color }}` — same colour as the bar.

  it('level < 40 uses teal colour on label', () => {
    const { container } = render(<SkillBar skill={{ name: 'Low', category: 'Other', level: 0 }} />)
    const label = container.querySelector('span[style]') as HTMLElement
    // teal = rgb(85, 234, 212)
    expect(label?.style.color).toBe('rgb(85, 234, 212)')
  })

  it('level 40–70 uses yellow colour on label', () => {
    const { container } = render(<SkillBar skill={{ name: 'Mid', category: 'Frontend', level: 55 }} />)
    const label = container.querySelector('span[style]') as HTMLElement
    // yellow = rgb(243, 230, 0)
    expect(label?.style.color).toBe('rgb(243, 230, 0)')
  })

  it('level > 70 uses red colour on label', () => {
    const { container } = render(<SkillBar skill={{ name: 'High', category: 'Backend', level: 90 }} />)
    const label = container.querySelector('span[style]') as HTMLElement
    // red = rgb(255, 46, 87)
    expect(label?.style.color).toBe('rgb(255, 46, 87)')
  })

  // ── Boundary thresholds (exact values) ───────────────────────────────────

  it('level 40 exactly uses yellow (not teal)', () => {
    const { container } = render(<SkillBar skill={{ name: 'Boundary', category: 'Frontend', level: 40 }} />)
    const label = container.querySelector('span[style]') as HTMLElement
    expect(label?.style.color).toBe('rgb(243, 230, 0)')
    expect(label?.style.color).not.toBe('rgb(85, 234, 212)')
  })

  it('level 70 exactly uses yellow (not red)', () => {
    const { container } = render(<SkillBar skill={{ name: 'Boundary', category: 'Backend', level: 70 }} />)
    const label = container.querySelector('span[style]') as HTMLElement
    expect(label?.style.color).toBe('rgb(243, 230, 0)')
    expect(label?.style.color).not.toBe('rgb(255, 46, 87)')
  })

  it('level 71 uses red (not yellow)', () => {
    const { container } = render(<SkillBar skill={{ name: 'Boundary', category: 'Backend', level: 71 }} />)
    const label = container.querySelector('span[style]') as HTMLElement
    expect(label?.style.color).toBe('rgb(255, 46, 87)')
    expect(label?.style.color).not.toBe('rgb(243, 230, 0)')
  })

  // ── Name rendering ────────────────────────────────────────────────────────

  it('renders skill name', () => {
    render(<SkillBar skill={{ name: 'TypeScript', category: 'Frontend', level: 88 }} />)
    expect(screen.getByText('TypeScript')).toBeInTheDocument()
  })

  it('renders skill name for all categories', () => {
    const categories = ['Frontend', 'Backend', 'DevOps', 'Other'] as const
    categories.forEach(cat => {
      const { unmount } = render(<SkillBar skill={{ name: `${cat}Skill`, category: cat, level: 50 }} />)
      expect(screen.getByText(`${cat}Skill`)).toBeInTheDocument()
      unmount()
    })
  })
})
