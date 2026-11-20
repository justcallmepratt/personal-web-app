import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import SkillsChart from '@/components/sections/SkillsChart'
import type { Skill } from '@/lib/types'

// Mock framer-motion
vi.mock('framer-motion', () => ({
  useReducedMotion: () => false,
  motion: {
    div: ({ children, style, className }: React.HTMLAttributes<HTMLDivElement>) => (
      <div style={style} className={className}>{children}</div>
    ),
  },
}))

const skills: Skill[] = [
  { name: 'React', category: 'Frontend', level: 90 },
  { name: 'Next.js', category: 'Frontend', level: 85 },
  { name: 'Java', category: 'Backend', level: 88 },
  { name: 'Docker', category: 'DevOps', level: 72 },
]

describe('SkillsChart', () => {
  it('renders all skill categories present in the data', () => {
    render(<SkillsChart skills={skills} />)
    // Each category appears twice: its filter button and its panel title
    // (the title's decorative glyph is now a separate aria-hidden span).
    for (const category of ['Frontend', 'Backend', 'DevOps']) {
      expect(screen.getAllByText(category)).toHaveLength(2)
    }
    // "Other" has no skills in the data: only its filter button is shown.
    expect(screen.getAllByText('Other')).toHaveLength(1)
  })

  it('renders filter buttons', () => {
    render(<SkillsChart skills={skills} />)
    expect(screen.getByRole('button', { name: /^All$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Frontend$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Backend$/i })).toBeInTheDocument()
  })

  it('clicking Frontend filter shows only Frontend skills', async () => {
    render(<SkillsChart skills={skills} />)
    await userEvent.click(screen.getByRole('button', { name: /^Frontend$/i }))
    expect(screen.getByText('React')).toBeInTheDocument()
    expect(screen.getByText('Next.js')).toBeInTheDocument()
    expect(screen.queryByText('Java')).not.toBeInTheDocument()
    expect(screen.queryByText('Docker')).not.toBeInTheDocument()
  })

  it('exposes the active filter with aria-pressed inside a labelled group', async () => {
    render(<SkillsChart skills={skills} />)
    expect(screen.getByRole('group', { name: /filter skills/i })).toBeInTheDocument()
    const all = screen.getByRole('button', { name: /^All$/i })
    const frontend = screen.getByRole('button', { name: /^Frontend$/i })
    expect(all).toHaveAttribute('aria-pressed', 'true')
    expect(frontend).toHaveAttribute('aria-pressed', 'false')

    await userEvent.click(frontend)
    expect(all).toHaveAttribute('aria-pressed', 'false')
    expect(frontend).toHaveAttribute('aria-pressed', 'true')
  })

  it('clicking All shows all skills', async () => {
    render(<SkillsChart skills={skills} />)
    // First filter to Frontend
    await userEvent.click(screen.getByRole('button', { name: /^Frontend$/i }))
    // Then reset to All
    await userEvent.click(screen.getByRole('button', { name: /^All$/i }))
    expect(screen.getByText('React')).toBeInTheDocument()
    expect(screen.getByText('Java')).toBeInTheDocument()
    expect(screen.getByText('Docker')).toBeInTheDocument()
  })
})
