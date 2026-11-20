import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ExperienceTimeline from '@/components/sections/ExperienceTimeline'
import type { Experience } from '@/lib/types'

function makeExperience(overrides: Partial<Experience> = {}): Experience {
  return {
    id: 1,
    company: 'Arasaka',
    role: 'Senior Engineer',
    location: 'Night City',
    startDate: '2024-03-01',
    endDate: null,
    current: true,
    description: 'Leading core platform team.',
    highlights: ['Cut deploy time 40%'],
    technologies: ['Java', 'Kubernetes'],
    sortOrder: 1,
    ...overrides,
  }
}

describe('ExperienceTimeline', () => {
  it('renders all experience items', () => {
    const items = [
      makeExperience({ id: 1, company: 'Arasaka' }),
      makeExperience({ id: 2, company: 'Militech', role: 'Backend Engineer', current: false, endDate: '2024-02-28', startDate: '2022-01-01' }),
    ]
    render(<ExperienceTimeline items={items} />)
    expect(screen.getByText('@ Arasaka')).toBeInTheDocument()
    expect(screen.getByText('@ Militech')).toBeInTheDocument()
  })

  it('renders company names', () => {
    render(<ExperienceTimeline items={[makeExperience()]} />)
    expect(screen.getByText(/Arasaka/)).toBeInTheDocument()
  })

  it('renders role titles', () => {
    render(<ExperienceTimeline items={[makeExperience()]} />)
    expect(screen.getByText('Senior Engineer')).toBeInTheDocument()
  })

  it('formats first-of-month dates without shifting the month', () => {
    render(<ExperienceTimeline items={[makeExperience()]} />)
    expect(screen.getByText(/Mar 2024/i)).toBeInTheDocument()
  })

  it('shows PRESENT for current position', () => {
    render(<ExperienceTimeline items={[makeExperience({ current: true, endDate: null })]} />)
    expect(screen.getByText(/PRESENT/)).toBeInTheDocument()
  })
})
