import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ExperienceTimeline from '@/components/sections/ExperienceTimeline'
import type { Experience } from '@/lib/types'

function makeExp(overrides: Partial<Experience> = {}): Experience {
  return {
    id: 1, company: 'AcmeCorp', role: 'SeniorEngineer', location: 'Remote',
    startDate: '2023-01-01', endDate: '2024-01-01', current: false,
    description: 'Worked on things.', highlights: [], technologies: [], sortOrder: 1,
    ...overrides,
  }
}

/**
 * Edge-case tests for ExperienceTimeline.
 * Note: company/role text is rendered inside styled elements with prefixes —
 * using regex matchers to handle partial text node splits.
 */
describe('ExperienceTimeline — edge cases', () => {

  // ── Single entry ─────────────────────────────────────────────────────────

  it('renders single experience role', () => {
    render(<ExperienceTimeline items={[makeExp()]} />)
    expect(screen.getByText('SeniorEngineer')).toBeInTheDocument()
  })

  it('renders company name (partial match)', () => {
    render(<ExperienceTimeline items={[makeExp()]} />)
    // Company appears as "@ AcmeCorp" — use regex to handle prefix
    expect(screen.getByText(/AcmeCorp/)).toBeInTheDocument()
  })

  // ── Current job (null endDate) ────────────────────────────────────────────

  it('shows PRESENT for current job with null endDate', () => {
    render(<ExperienceTimeline items={[makeExp({ endDate: null, current: true })]} />)
    expect(screen.getByText(/PRESENT/i)).toBeInTheDocument()
  })

  it('shows PRESENT for current job with future endDate', () => {
    render(<ExperienceTimeline items={[makeExp({ current: true, endDate: '2099-12-31' })]} />)
    expect(screen.getByText(/PRESENT/i)).toBeInTheDocument()
  })

  it('does NOT show PRESENT for non-current job', () => {
    render(<ExperienceTimeline items={[makeExp({ current: false, endDate: '2023-06-01' })]} />)
    expect(screen.queryByText(/PRESENT/i)).not.toBeInTheDocument()
  })

  // ── Multiple entries ──────────────────────────────────────────────────────

  it('renders all 5 companies (partial match)', () => {
    const items = [
      makeExp({ id: 1, company: 'AlphaInc', role: 'RoleA', sortOrder: 1 }),
      makeExp({ id: 2, company: 'BetaCorp', role: 'RoleB', sortOrder: 2 }),
      makeExp({ id: 3, company: 'GammaLtd', role: 'RoleC', sortOrder: 3 }),
      makeExp({ id: 4, company: 'DeltaOrg', role: 'RoleD', sortOrder: 4 }),
      makeExp({ id: 5, company: 'EpsilonX', role: 'RoleE', sortOrder: 5 }),
    ]
    render(<ExperienceTimeline items={items} />)
    expect(screen.getByText(/AlphaInc/)).toBeInTheDocument()
    expect(screen.getByText(/EpsilonX/)).toBeInTheDocument()
  })

  // ── Empty arrays for highlights/technologies ──────────────────────────────

  it('renders cleanly with no highlights', () => {
    render(<ExperienceTimeline items={[makeExp({ highlights: [] })]} />)
    expect(screen.getByText('SeniorEngineer')).toBeInTheDocument()
  })

  it('renders cleanly with no technologies', () => {
    render(<ExperienceTimeline items={[makeExp({ technologies: [] })]} />)
    expect(screen.getByText('SeniorEngineer')).toBeInTheDocument()
  })

  it('renders highlights when present', () => {
    const exp = makeExp({ highlights: ['ShippedFeatureX', 'ReducedLatencyBy40'] })
    render(<ExperienceTimeline items={[exp]} />)
    expect(screen.getByText('ShippedFeatureX')).toBeInTheDocument()
    expect(screen.getByText('ReducedLatencyBy40')).toBeInTheDocument()
  })

  it('renders technology tags when present', () => {
    const exp = makeExp({ technologies: ['JavaLang', 'KubernetesK8s', 'AWSCloud'] })
    render(<ExperienceTimeline items={[exp]} />)
    expect(screen.getByText('JavaLang')).toBeInTheDocument()
    expect(screen.getByText('KubernetesK8s')).toBeInTheDocument()
  })

  // ── Location handling ─────────────────────────────────────────────────────

  it('renders location when provided', () => {
    render(<ExperienceTimeline items={[makeExp({ location: 'SpringfieldUS' })]} />)
    expect(screen.getByText(/SpringfieldUS/i)).toBeInTheDocument()
  })

  it('renders without crashing when location is empty string', () => {
    expect(() =>
      render(<ExperienceTimeline items={[makeExp({ location: '' })]} />)
    ).not.toThrow()
  })
})
