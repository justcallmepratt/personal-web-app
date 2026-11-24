import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import ResearchPage, { metadata } from '@/app/research/page'
import ResearchList from '@/components/sections/ResearchList'
import SkillsChart from '@/components/sections/SkillsChart'
import { api } from '@/lib/api'
import { profile, research } from '@/content'
import { publicRoutes } from '@/lib/site'

afterEach(() => vi.restoreAllMocks())

describe('ResearchList', () => {
  it('renders a paper with only a title and summary, without a link or "undefined"', () => {
    render(<ResearchList items={[{ id: 1, title: 'A Paper', summary: 'What it found.', sortOrder: 1 }]} />)
    expect(screen.getByRole('heading', { level: 2, name: 'A Paper' })).toBeInTheDocument()
    expect(screen.getByText('What it found.')).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.queryByText(/Invalid|undefined|null/)).not.toBeInTheDocument()
  })

  it('shows context, date, co-authors and an http link when present', () => {
    render(
      <ResearchList
        items={[{
          id: 2, title: 'Full', summary: 'S', context: 'Some Course', date: '2020-05',
          coAuthors: ['A. Person'], url: 'https://example.test/paper.pdf', sortOrder: 1,
        }]}
      />,
    )
    expect(screen.getByText('Some Course')).toBeInTheDocument()
    expect(screen.getByText('May 2020')).toBeInTheDocument()
    expect(screen.getByText('With A. Person')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'READ PAPER: Full (opens in a new tab)' }))
      .toHaveAttribute('href', 'https://example.test/paper.pdf')
  })

  it('does not render a link for a non-http URL', () => {
    render(<ResearchList items={[{ id: 3, title: 'X', summary: 'Y', url: 'javascript:alert(1)', sortOrder: 1 }]} />)
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})

describe('/research', () => {
  it('lists every paper from the content file, in sort order', async () => {
    render(await ResearchPage())
    const titles = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    expect(titles).toEqual([...research].sort((a, b) => a.sortOrder - b.sortOrder).map((r) => r.title))
  })

  it('shows a fallback when nothing loads', async () => {
    vi.spyOn(api, 'getResearch').mockRejectedValue(new Error('boom'))
    render(await ResearchPage())
    expect(screen.getByText('// No research loaded //')).toBeInTheDocument()
  })

  it('is a public route with its own metadata', () => {
    expect(publicRoutes).toContain('/research')
    expect(metadata.title).toBeDefined()
  })
})

describe('Business & Leadership skills', () => {
  it('are in the content and get their own group on the skills chart', () => {
    const business = profile.skills.filter((s) => s.category === 'Business & Leadership')
    expect(business.length).toBeGreaterThan(0)
    render(<SkillsChart skills={profile.skills} />)
    expect(screen.getByRole('button', { name: 'Business & Leadership' })).toBeInTheDocument()
    for (const s of business) expect(screen.getByText(s.name)).toBeInTheDocument()
  })
})
