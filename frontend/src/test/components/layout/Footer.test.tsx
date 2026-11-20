import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Footer from '@/components/layout/Footer'
import { DISCLAIMER_SHORT } from '@/lib/credits'

describe('Footer', () => {
  it('is the page-level contentinfo landmark', () => {
    render(<Footer />)
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })

  it('shows the copyright year, the short disclaimer and a link to /credits', () => {
    render(<Footer year={2031} />)
    const footer = screen.getByRole('contentinfo')
    expect(footer).toHaveTextContent('© 2031')
    expect(footer).toHaveTextContent(DISCLAIMER_SHORT)
    expect(screen.getByRole('link', { name: /credits/i })).toHaveAttribute('href', '/credits')
  })

  it('defaults to the current year', () => {
    render(<Footer />)
    expect(screen.getByRole('contentinfo')).toHaveTextContent(String(new Date().getFullYear()))
  })

  it('does not claim endorsement or a licence', () => {
    render(<Footer />)
    const text = screen.getByRole('contentinfo').textContent ?? ''
    expect(text).toMatch(/not endorsed/i)
    expect(text).not.toMatch(/licensed by|official partner/i)
  })
})
