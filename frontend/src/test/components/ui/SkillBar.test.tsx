import { render, screen } from '@testing-library/react'
import { afterEach, describe, it, expect, vi } from 'vitest'
import SkillBar from '@/components/ui/SkillBar'
import type { Skill } from '@/lib/types'

// Stands in for the OS "reduce motion" setting that useReducedMotion reads.
const motionPreference = vi.hoisted(() => ({ reduced: false }))

// Mock framer-motion to avoid animation issues in jsdom
vi.mock('framer-motion', () => ({
  useReducedMotion: () => motionPreference.reduced,
  motion: {
    div: ({ children, style, className, transition }: React.HTMLAttributes<HTMLDivElement> & {
      transition?: { duration?: number }
    }) => (
      <div data-testid="motion-bar" data-duration={transition?.duration} style={style} className={className}>
        {children}
      </div>
    ),
  },
}))

function makeSkill(name: string, level: number, category: Skill['category'] = 'Backend'): Skill {
  return { name, level, category }
}

describe('SkillBar', () => {
  it('renders skill name', () => {
    render(<SkillBar skill={makeSkill('React', 90)} />)
    expect(screen.getByText('React')).toBeInTheDocument()
  })

  it('renders skill level', () => {
    render(<SkillBar skill={makeSkill('React', 90)} />)
    expect(screen.getByText('090%')).toBeInTheDocument()
  })

  it('applies red color for level > 70', () => {
    render(<SkillBar skill={makeSkill('Java', 85)} />)
    // Text uses the AA-contrast red; the bar fill keeps the deep red.
    expect(screen.getByText('085%')).toHaveStyle({ color: '#FF2E57' })
    expect(screen.getByTestId('motion-bar')).toHaveStyle({ backgroundColor: '#C5003C' })
  })

  it('applies yellow color for level between 40 and 70', () => {
    render(<SkillBar skill={makeSkill('Docker', 60)} />)
    expect(screen.getByText('060%')).toHaveStyle({ color: '#F3E600' })
  })

  it('applies teal color for level < 40', () => {
    render(<SkillBar skill={makeSkill('Rust', 30)} />)
    expect(screen.getByText('030%')).toHaveStyle({ color: '#55EAD4' })
  })

  it('renders the animated bar div', () => {
    render(<SkillBar skill={makeSkill('TypeScript', 88)} />)
    expect(screen.getByTestId('motion-bar')).toBeInTheDocument()
  })

  describe('reduced motion', () => {
    afterEach(() => {
      motionPreference.reduced = false
    })

    it('animates the bar over 1.2s by default', () => {
      render(<SkillBar skill={makeSkill('TypeScript', 88)} />)
      expect(screen.getByTestId('motion-bar')).toHaveAttribute('data-duration', '1.2')
    })

    it('skips the animation when the user prefers reduced motion', () => {
      motionPreference.reduced = true
      render(<SkillBar skill={makeSkill('TypeScript', 88)} />)
      expect(screen.getByTestId('motion-bar')).toHaveAttribute('data-duration', '0')
    })
  })
})
