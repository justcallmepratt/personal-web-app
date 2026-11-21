import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import Navbar from '@/components/layout/Navbar'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}))

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}))

describe('Navbar', () => {
  it('renders logo', () => {
    render(<Navbar />)
    expect(screen.getByRole('link', { name: 'Pratham Sachan, home' })).toHaveAttribute('href', '/')
  })

  it('links to the certifications page', () => {
    render(<Navbar />)
    expect(screen.getByRole('link', { name: 'CERTIFICATIONS' })).toHaveAttribute('href', '/certifications')
  })

  it('links to the resume page', () => {
    render(<Navbar />)
    expect(screen.getByRole('link', { name: 'RESUME' })).toHaveAttribute('href', '/resume')
  })

  it('links to the admin app, in the row and in the mobile menu', async () => {
    render(<Navbar />)
    expect(screen.getByRole('link', { name: 'ADMIN' })).toHaveAttribute('href', '/admin')
    await userEvent.click(screen.getByRole('button', { name: /open menu/i }))
    const admin = screen.getAllByRole('link', { name: 'ADMIN' })
    expect(admin).toHaveLength(2)
    for (const a of admin) expect(a).toHaveAttribute('href', '/admin')
  })

  it('opens mobile menu on hamburger click', async () => {
    render(<Navbar />)
    const hamburger = screen.getByRole('button', { name: /open menu/i })
    await userEvent.click(hamburger)
    // After click the mobile menu links appear
    const homeLinks = screen.getAllByRole('link', { name: /home/i })
    expect(homeLinks.length).toBeGreaterThan(0)
  })

  it('closes mobile menu on link click', async () => {
    render(<Navbar />)
    const hamburger = screen.getByRole('button', { name: /open menu/i })
    await userEvent.click(hamburger)

    // Find the mobile HOME link (in the dropdown) and click it
    const mobileLinks = screen.getAllByRole('link', { name: /home/i })
    // The last one should be the mobile drawer link
    await userEvent.click(mobileLinks[mobileLinks.length - 1])

    // Menu should close - hamburger should say "Open menu" again
    expect(screen.getByRole('button', { name: /open menu/i })).toBeInTheDocument()
  })

  it('is a labelled navigation landmark that contains the mobile menu', async () => {
    render(<Navbar />)
    const nav = screen.getByRole('navigation', { name: /primary/i })
    const hamburger = screen.getByRole('button', { name: /open menu/i })
    expect(hamburger).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(hamburger)
    expect(hamburger).toHaveAttribute('aria-expanded', 'true')
    const menu = document.getElementById(hamburger.getAttribute('aria-controls') as string)
    expect(menu).not.toBeNull()
    expect(nav).toContainElement(menu)
  })

  it('Escape closes the mobile menu and returns focus to the toggle', async () => {
    render(<Navbar />)
    await userEvent.click(screen.getByRole('button', { name: /open menu/i }))
    await userEvent.tab()
    await userEvent.keyboard('{Escape}')
    const hamburger = screen.getByRole('button', { name: /open menu/i })
    expect(hamburger).toHaveAttribute('aria-expanded', 'false')
    expect(hamburger).toHaveFocus()
  })

  it('marks the current page with aria-current and hides the decorative marker', () => {
    render(<Navbar />)
    const current = screen.getAllByRole('link', { current: 'page' })
    expect(current.length).toBeGreaterThan(0)
    for (const link of current) expect(link).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'EXPERIENCE' })).not.toHaveAttribute('aria-current')
    for (const marker of screen.getAllByText('▮')) expect(marker).toHaveAttribute('aria-hidden', 'true')
  })

  it('shows active indicator on current route', () => {
    // usePathname is mocked to return '/', so HOME should be active (has ▮)
    render(<Navbar />)
    // The desktop nav shows an active indicator ▮ before the HOME link text
    const activeIndicators = screen.getAllByText('▮')
    expect(activeIndicators.length).toBeGreaterThan(0)
  })
})
