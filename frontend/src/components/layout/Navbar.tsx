'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

// `external` marks a path served by another app of the microfrontends group
// (see microfrontends.json): it needs a full page load, so it renders as a
// plain <a> rather than a client-side <Link>.
const links: { href: string; label: string; external?: boolean }[] = [
  { href: '/',           label: 'HOME'       },
  { href: '/experience', label: 'EXPERIENCE' },
  { href: '/projects',   label: 'PROJECTS'   },
  { href: '/skills',     label: 'SKILLS'     },
  { href: '/certifications', label: 'CERTIFICATIONS' },
  { href: '/research', label: 'RESEARCH' },
  { href: '/resume',     label: 'RESUME'     },
  { href: '/contact',    label: 'CONTACT'    },
  // Owner-only: /admin sends anyone who is not signed in to its sign-in page.
  { href: '/admin',      label: 'ADMIN', external: true },
]

const MOBILE_MENU_ID = 'mobile-menu'

type NavLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; external?: boolean }

function NavLink({ external, href, children, ...rest }: NavLinkProps) {
  if (external) return <a href={href} {...rest}>{children}</a>
  return <Link href={href} {...rest}>{children}</Link>
}

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
    <header className="sticky top-0 z-40 backdrop-blur bg-cp-dark/80 border-b border-cp-border print:hidden">
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
            className="lg:hidden flex items-center justify-center min-w-[44px] min-h-[44px] text-cp-red text-xs uppercase tracking-widest"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? '✕' : '≡ MENU'}
          </button>

          {/* Eight links do not fit at 768 px, so the row starts at lg (1024 px),
              with tighter spacing until xl; below lg the menu button is used. */}
          <ul className="hidden lg:flex items-center gap-3 xl:gap-6 text-xs uppercase tracking-[0.15em] xl:tracking-[0.25em] font-[var(--font-mono)]">
            {links.map((l) => {
              const active = pathname === l.href
              return (
                <li key={l.href}>
                  <NavLink
                    href={l.href}
                    external={l.external}
                    aria-current={active ? 'page' : undefined}
                    className={`relative px-1 py-1 transition-colors ${
                      active ? 'text-cp-red' : 'text-cp-text hover:text-cp-red'
                    }`}
                  >
                    {active && <span aria-hidden="true" className="mr-1 text-cp-red">▮</span>}
                    {l.label}
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </div>

        {/* Mobile drawer — 44 px min touch targets per link */}
        {open && (
          <ul id={MOBILE_MENU_ID} className="lg:hidden border-t border-cp-red-deep bg-cp-panel">
            {links.map((l) => {
              const active = pathname === l.href
              return (
                <li key={l.href}>
                  <NavLink
                    href={l.href}
                    external={l.external}
                    aria-current={active ? 'page' : undefined}
                    onClick={() => setOpen(false)}
                    className={`flex items-center min-h-[52px] px-4 focus-visible:-outline-offset-4 text-xs uppercase tracking-widest border-b border-cp-border transition-colors ${
                      active ? 'text-cp-red' : 'text-cp-text active:text-cp-red'
                    }`}
                  >
                    {active && <span aria-hidden="true" className="mr-2 text-cp-red">▮</span>}
                    {l.label}
                  </NavLink>
                </li>
              )
            })}
          </ul>
        )}
      </nav>
    </header>
  )
}
