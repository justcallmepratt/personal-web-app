// The public site's navigation, repeated here so admin pages look like part of
// the same site and every page has a way back. The public pages are served by
// another app (see frontend/microfrontends.json), so these are plain anchors:
// a full page load, never client-side routing. Keep the list in step with
// frontend/src/components/layout/Navbar.tsx.

const siteLinks = [
  { href: '/', label: 'HOME' },
  { href: '/experience', label: 'EXPERIENCE' },
  { href: '/projects', label: 'PROJECTS' },
  { href: '/skills', label: 'SKILLS' },
  { href: '/certifications', label: 'CERTIFICATIONS' },
  { href: '/resume', label: 'RESUME' },
  { href: '/contact', label: 'CONTACT' },
]

const linkClass = 'px-1 py-1 whitespace-nowrap transition-colors'

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-cp-border bg-cp-dark/80 backdrop-blur print:hidden">
      <nav aria-label="Site" className="mx-auto flex min-h-14 max-w-6xl flex-wrap items-center gap-x-6 gap-y-1 px-4 py-2">
        <a
          href="/"
          aria-label="Pratham Sachan, home"
          className="inline-flex min-h-6 shrink-0 items-center font-[family-name:var(--font-display)] text-sm tracking-[0.3em] text-cp-yellow"
        >
          <span aria-hidden="true">◆&nbsp;</span>PS//SYS
        </a>

        {/* Wraps onto more lines on narrow screens instead of needing a menu button. */}
        <ul className="ml-auto flex flex-wrap items-center gap-x-3 gap-y-1 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.15em] xl:gap-x-6 xl:tracking-[0.25em]">
          {siteLinks.map((l) => (
            <li key={l.href}>
              <a href={l.href} className={`${linkClass} text-cp-text hover:text-cp-red`}>
                {l.label}
              </a>
            </li>
          ))}
          <li>
            <a href="/admin" aria-current="true" className={`${linkClass} text-cp-red`}>
              <span aria-hidden="true" className="mr-1">▮</span>
              ADMIN
            </a>
          </li>
        </ul>
      </nav>
    </header>
  )
}
