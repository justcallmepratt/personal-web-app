import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import HeroSection from '@/components/sections/HeroSection'
import type { Profile } from '@/lib/types'

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ href, children, className }: {
    href: string
    children: React.ReactNode
    className?: string
  }) => <a href={href} className={className}>{children}</a>,
}))

function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: 1,
    name: 'Test Person',
    tagline: 'Backend Developer',
    bio: 'Full-stack engineer',
    email: 'person@example.test',
    location: 'Testville, TS',
    avatarUrl: '',
    cvUrl: '/cv.pdf',
    techStack: ['Java', 'React'],
    socials: { linkedin: 'https://linkedin.example.test/in/person' },
    skills: [],
    updatedAt: '2024-01-01T00:00:00',
    ...overrides,
  }
}

describe('HeroSection', () => {
  it('renders PROFILE NOT FOUND when profile is null', () => {
    render(<HeroSection profile={null} />)
    expect(screen.getByText(/PROFILE NOT FOUND/i)).toBeInTheDocument()
  })

  it('renders profile name when profile is given', () => {
    render(<HeroSection profile={makeProfile()} />)
    expect(screen.getByText('Test Person')).toBeInTheDocument()
  })

  it('renders profile tagline', () => {
    render(<HeroSection profile={makeProfile()} />)
    expect(screen.getByText(/Backend Developer/)).toBeInTheDocument()
  })

  it('renders all 3 action buttons', () => {
    render(<HeroSection profile={makeProfile()} />)
    expect(screen.getByRole('link', { name: /view projects/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /download cv/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /contact/i })).toBeInTheDocument()
  })

  it('links the CV button to the configured file', () => {
    render(<HeroSection profile={makeProfile({ cvUrl: '/cv.pdf' })} />)
    expect(screen.getByRole('link', { name: /download cv/i })).toHaveAttribute('href', '/cv.pdf')
  })

  it('hides the CV button when no CV is configured, keeping the other two', () => {
    render(<HeroSection profile={makeProfile({ cvUrl: '' })} />)
    expect(screen.queryByRole('link', { name: /download cv/i })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /view projects/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /contact/i })).toBeInTheDocument()
  })

  it('shows the email row only when an email is set', () => {
    const { unmount } = render(<HeroSection profile={makeProfile()} />)
    expect(screen.getByText('Comm')).toBeInTheDocument()
    expect(screen.getByText('person@example.test')).toBeInTheDocument()
    unmount()
    render(<HeroSection profile={makeProfile({ email: '' })} />)
    expect(screen.queryByText('Comm')).not.toBeInTheDocument()
  })

  it('renders social links when socials present', () => {
    render(<HeroSection profile={makeProfile()} />)
    expect(screen.getByRole('link', { name: /linkedin/i })).toHaveAttribute('href', 'https://linkedin.example.test/in/person')
  })

  it('carries no persona copy', () => {
    const { container } = render(<HeroSection profile={makeProfile()} />)
    expect(container.textContent).not.toMatch(/night.?city/i)
  })
})
