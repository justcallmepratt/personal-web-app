import { render, screen, within } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import CreditsPage from '@/app/credits/page'
import { creditSections, DISCLAIMER_FULL, GUIDELINE_URL } from '@/lib/credits'

describe('/credits page', () => {
  it('has one h1 and a heading for the disclaimer and every section', () => {
    render(<CreditsPage />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 2, name: /unofficial fan work/i })).toBeInTheDocument()
    for (const section of creditSections) {
      expect(screen.getByRole('heading', { level: 2, name: section.title })).toBeInTheDocument()
    }
  })

  it('states the unofficial disclaimer and cites the guideline page', () => {
    render(<CreditsPage />)
    expect(screen.getByText(DISCLAIMER_FULL)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Fan Content Guideline/ })).toHaveAttribute('href', GUIDELINE_URL)
    expect(document.body.textContent).toMatch(/not legal advice/i)
  })

  it('links every entry to its official site, safely, in a new tab', () => {
    render(<CreditsPage />)
    for (const section of creditSections) {
      for (const item of section.items) {
        const link = screen.getByRole('link', { name: new RegExp(`^${item.name.replace(/[()]/g, '\\$&')}`) })
        expect(link).toHaveAttribute('href', item.url)
        expect(link).toHaveAttribute('target', '_blank')
        expect(link.getAttribute('rel')).toContain('noopener')
      }
    }
  })

  it('credits the three fonts actually loaded in the layout, with their licence', () => {
    render(<CreditsPage />)
    const fonts = screen.getByRole('heading', { name: 'Fonts' }).closest('section') as HTMLElement
    for (const name of ['Orbitron', 'Rajdhani', 'Share Tech Mono']) {
      expect(within(fonts).getByRole('link', { name: new RegExp(`^${name}`) })).toBeInTheDocument()
    }
    expect(within(fonts).getAllByRole('link', { name: /OFL-1\.1/ })).toHaveLength(3)
  })

  it('describes Railway as not live and lists nothing that is not in the code', () => {
    render(<CreditsPage />)
    expect(document.body.textContent).toMatch(/Railway.*Not live yet/)
    expect(document.body.textContent).not.toMatch(/Amplitude|Spotify/i)
  })
})
