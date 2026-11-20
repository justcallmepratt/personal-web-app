import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ExperienceTimeline from '@/components/sections/ExperienceTimeline'
import type { Experience } from '@/lib/types'

function makeExperience(overrides: Partial<Experience> = {}): Experience {
  return {
    id: 1,
    company: 'Acme',
    role: 'Senior Engineer',
    location: 'Remote',
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
      makeExperience({ id: 1, company: 'Acme' }),
      makeExperience({ id: 2, company: 'Globex', role: 'Backend Engineer', current: false, endDate: '2024-02-28', startDate: '2022-01-01' }),
    ]
    render(<ExperienceTimeline items={items} />)
    expect(screen.getByText('@ Acme')).toBeInTheDocument()
    expect(screen.getByText('@ Globex')).toBeInTheDocument()
  })

  it('renders company names', () => {
    render(<ExperienceTimeline items={[makeExperience()]} />)
    expect(screen.getByText(/Acme/)).toBeInTheDocument()
  })

  it('renders role titles', () => {
    render(<ExperienceTimeline items={[makeExperience()]} />)
    expect(screen.getByText('Senior Engineer')).toBeInTheDocument()
  })

  it('formats first-of-month dates without shifting the month', () => {
    render(<ExperienceTimeline items={[makeExperience()]} />)
    expect(screen.getByText(/Mar 2024/i)).toBeInTheDocument()
  })

  it('shows only the start month for a past role with no known end date', () => {
    render(<ExperienceTimeline items={[makeExperience({ current: false, endDate: null, startDate: '2023-06-01' })]} />)
    expect(screen.getByText('Jun 2023')).toBeInTheDocument()
    expect(screen.queryByText(/PRESENT/)).not.toBeInTheDocument()
  })

  it('shows PRESENT for current position', () => {
    render(<ExperienceTimeline items={[makeExperience({ current: true, endDate: null })]} />)
    expect(screen.getByText(/PRESENT/)).toBeInTheDocument()
  })
})
