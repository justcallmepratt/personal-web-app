import { render, screen, within } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import GitHubActivity from '@/components/sections/GitHubActivity'
import type { GitHubActivity as Activity } from '@/lib/github'

const base = { username: 'justcallmepratt', profileUrl: 'https://github.com/justcallmepratt' }

const ok: Activity = {
  ...base,
  status: 'ok',
  repos: [
    { name: 'alpha', url: 'https://github.com/justcallmepratt/alpha', description: 'First repo', language: 'Java', stars: 1, pushedAt: '2026-11-01T10:00:00Z' },
    { name: 'beta', url: 'https://github.com/justcallmepratt/beta', description: null, language: null, stars: 0, pushedAt: null },
  ],
  languages: [{ language: 'Java', count: 1, percent: 100 }],
}

describe('GitHubActivity', () => {
  it('renders a labelled section with a heading', () => {
    render(<GitHubActivity activity={ok} />)
    const section = screen.getByRole('region', { name: /github activity/i })
    expect(within(section).getByRole('heading', { level: 2 })).toBeInTheDocument()
  })

  it('lists repositories as real links with descriptive names', () => {
    render(<GitHubActivity activity={ok} />)
    const link = screen.getByRole('link', { name: /alpha, github repository/i })
    expect(link).toHaveAttribute('href', 'https://github.com/justcallmepratt/alpha')
    expect(link).toHaveAttribute('rel', expect.stringContaining('noreferrer'))
    expect(screen.getAllByRole('listitem').length).toBeGreaterThanOrEqual(2)
  })

  it('shows the push date in a <time> element with a machine-readable value', () => {
    render(<GitHubActivity activity={ok} />)
    const time = screen.getByText('1 Nov 2026')
    expect(time.tagName).toBe('TIME')
    expect(time).toHaveAttribute('datetime', '2026-11-01T10:00:00Z')
  })

  it('handles missing description, language and date without placeholders leaking', () => {
    render(<GitHubActivity activity={ok} />)
    expect(screen.getByText('No description provided.')).toBeInTheDocument()
    expect(screen.getAllByText(/last push/i)).toHaveLength(1)
  })

  it('shows a language summary computed from the listed repos', () => {
    render(<GitHubActivity activity={ok} />)
    expect(screen.getByText(/languages in these 2 repositories/i)).toBeInTheDocument()
    expect(screen.getByText(/100% \(1 repository\)/)).toBeInTheDocument()
  })

  it('omits the language summary when no repo has a language', () => {
    render(<GitHubActivity activity={{ ...ok, languages: [] }} />)
    expect(screen.queryByText(/languages in these/i)).not.toBeInTheDocument()
  })

  it.each([
    ['unavailable', /unavailable right now/i],
    ['empty', /no public repositories/i],
  ] as const)('shows a compact profile link when %s', (status, message) => {
    render(<GitHubActivity activity={{ ...base, status }} />)
    expect(screen.getByText(message)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /see justcallmepratt on github/i }))
      .toHaveAttribute('href', 'https://github.com/justcallmepratt')
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })
})
