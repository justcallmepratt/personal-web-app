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
  default: ({ href, children, onClick, className }: {
    href: string
    children: React.ReactNode
    onClick?: () => void
    className?: string
  }) => (
    <a href={href} onClick={onClick} className={className}>{children}</a>
  ),
}))

describe('Navbar', () => {
  it('renders logo', () => {
    render(<Navbar />)
    expect(screen.getByText(/V\/\/SYS/)).toBeInTheDocument()
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

  it('shows active indicator on current route', () => {
    // usePathname is mocked to return '/', so HOME should be active (has ▮)
    render(<Navbar />)
    // The desktop nav shows an active indicator ▮ before the HOME link text
    const activeIndicators = screen.getAllByText('▮')
    expect(activeIndicators.length).toBeGreaterThan(0)
  })
})
