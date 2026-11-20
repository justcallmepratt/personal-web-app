'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

const links = [
  { href: '/',           label: 'HOME'       },
  { href: '/experience', label: 'EXPERIENCE' },
  { href: '/projects',   label: 'PROJECTS'   },
  { href: '/skills',     label: 'SKILLS'     },
  { href: '/certifications', label: 'CERTIFICATIONS' },
  { href: '/contact',    label: 'CONTACT'    },
]

const MOBILE_MENU_ID = 'mobile-menu'

export default function Navbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const toggleRef = useRef<HTMLButtonElement>(null)

  // Escape closes the mobile menu and hands focus back to its toggle.
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        toggleRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  return (
    <header className="sticky top-0 z-40 backdrop-blur bg-cp-dark/80 border-b border-cp-border">
      <nav aria-label="Primary">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/"
            aria-label="Pratham Sachan, home"
            className="inline-flex items-center min-h-6 font-[var(--font-display)] text-cp-yellow text-sm tracking-[0.3em]"
          >
            <span aria-hidden="true">◆&nbsp;</span>PS//SYS
          </Link>

          {/* Hamburger — min 44 × 44 px touch target */}
          <button
            ref={toggleRef}
            type="button"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls={MOBILE_MENU_ID}
            className="md:hidden flex items-center justify-center min-w-[44px] min-h-[44px] text-cp-red text-xs uppercase tracking-widest"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? '✕' : '≡ MENU'}
          </button>

          {/* Six links: tighter spacing between md and lg so the row fits at 768 px */}
          <ul className="hidden md:flex items-center gap-3 lg:gap-6 text-xs uppercase tracking-[0.15em] lg:tracking-[0.25em] font-[var(--font-mono)]">
            {links.map((l) => {
              const active = pathname === l.href
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    aria-current={active ? 'page' : undefined}
                    className={`relative px-1 py-1 transition-colors ${
                      active ? 'text-cp-red' : 'text-cp-text hover:text-cp-red'
                    }`}
                  >
                    {active && <span aria-hidden="true" className="mr-1 text-cp-red">▮</span>}
                    {l.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>

        {/* Mobile drawer — 44 px min touch targets per link */}
        {open && (
          <ul id={MOBILE_MENU_ID} className="md:hidden border-t border-cp-red-deep bg-cp-panel">
            {links.map((l) => {
              const active = pathname === l.href
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    aria-current={active ? 'page' : undefined}
                    onClick={() => setOpen(false)}
                    className={`flex items-center min-h-[52px] px-4 focus-visible:-outline-offset-4 text-xs uppercase tracking-widest border-b border-cp-border transition-colors ${
                      active ? 'text-cp-red' : 'text-cp-text active:text-cp-red'
                    }`}
                  >
                    {active && <span aria-hidden="true" className="mr-2 text-cp-red">▮</span>}
                    {l.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </nav>
    </header>
  )
}
