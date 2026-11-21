import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'
import Link from 'next/link'

// Small copies of the public site's primitives (frontend/src/components). They
// move to a shared package when the monorepo is set up.

type Accent = 'red' | 'yellow' | 'teal'
const colors: Record<Accent, string> = { red: '#C5003C', yellow: '#F3E600', teal: '#55EAD4' }

export function NeonButton({
  accent = 'teal',
  className = '',
  children,
  ...rest
}: { accent?: Accent } & ButtonHTMLAttributes<HTMLButtonElement>) {
  const color = colors[accent]
  return (
    <button
      {...rest}
      className={`hud-clip inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-2 border bg-transparent px-5 py-2 text-xs uppercase tracking-[0.25em] transition-all hover:bg-[color:var(--bg)] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      style={
        {
          color,
          borderColor: color,
          '--bg': `${color}22`,
          boxShadow: `0 0 12px ${color}44`,
        } as React.CSSProperties
      }
    >
      {children}
    </button>
  )
}

/** Navigation between the admin pages. Not prefetched: every page here is private and per-request. */
export function NavLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      prefetch={false}
      className="inline-flex min-h-[44px] items-center px-2 text-xs uppercase tracking-[0.25em] text-cp-teal underline-offset-4 hover:underline"
    >
      {children}
    </Link>
  )
}

export function Panel({
  title,
  accent = 'teal',
  className = '',
  children,
}: {
  title: string
  accent?: Accent
  className?: string
  children: ReactNode
}) {
  const color = colors[accent]
  return (
    <section className={`border bg-cp-panel ${className}`} style={{ borderColor: `${color}66` }}>
      <h2
        className="border-b px-4 py-2 text-[10px] uppercase tracking-[0.3em]"
        style={{ color, borderColor: `${color}33` }}
      >
        {title}
      </h2>
      <div className="p-4">{children}</div>
    </section>
  )
}

export function TerminalInput({
  label,
  ...rest
}: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block space-y-1">
      <span className="block text-xs uppercase tracking-[0.2em] text-cp-teal">› {label}</span>
      <input
        {...rest}
        className="w-full border border-cp-border bg-black px-3 py-2 text-cp-text placeholder:text-cp-muted focus:border-cp-teal focus:outline-none"
      />
    </label>
  )
}

/** Inline status line. `role="alert"` so screen readers announce failures. */
export function Notice({ tone, children }: { tone: 'error' | 'info'; children: ReactNode }) {
  const cls = tone === 'error' ? 'border-cp-red text-cp-red' : 'border-cp-yellow text-cp-yellow'
  return (
    <p role={tone === 'error' ? 'alert' : 'status'} className={`border-l-2 px-3 py-2 text-sm ${cls}`}>
      {children}
    </p>
  )
}
