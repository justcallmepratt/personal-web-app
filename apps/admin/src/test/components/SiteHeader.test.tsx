import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import SiteHeader from '@/components/SiteHeader'

describe('SiteHeader', () => {
  it('links back to the public site from the logo and the Home link', () => {
    render(<SiteHeader />)
    const nav = screen.getByRole('navigation', { name: 'Site' })
    expect(within(nav).getByRole('link', { name: 'Pratham Sachan, home' })).toHaveAttribute('href', '/')
    expect(within(nav).getByRole('link', { name: 'HOME' })).toHaveAttribute('href', '/')
  })

  it('lists the public pages and marks Admin as the current section', () => {
    render(<SiteHeader />)
    const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href'))
    expect(hrefs).toEqual([
      '/', '/', '/experience', '/projects', '/skills', '/certifications', '/resume', '/contact', '/admin',
    ])
    expect(screen.getByRole('link', { name: 'ADMIN' })).toHaveAttribute('aria-current', 'true')
  })
})
