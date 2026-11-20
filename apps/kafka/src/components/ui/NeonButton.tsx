import { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from 'react'

type Accent = 'red' | 'yellow' | 'teal'
const colors: Record<Accent, string> = {
  red: '#C5003C',
  yellow: '#F3E600',
  teal: '#55EAD4',
}

interface Common {
  accent?: Accent
  children: ReactNode
  /** Extra Tailwind classes — e.g. "w-full justify-center" for full-width mobile buttons */
  className?: string
}

type AsButton = Common & ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined }
type AsLink   = Common & AnchorHTMLAttributes<HTMLAnchorElement>  & { href: string }
type Props = AsButton | AsLink

export default function NeonButton({ accent = 'red', children, className = '', ...rest }: Props) {
  const color = colors[accent]
  const base  = `hud-clip inline-flex items-center gap-2 px-5 py-3 min-h-[44px] text-xs uppercase tracking-[0.25em] font-[var(--font-mono)] transition-all border bg-transparent hover:bg-[color:var(--bg)] cursor-pointer ${className}`
  const style = {
    color,
    borderColor: color,
    ['--bg' as string]: `${color}22`,
    boxShadow: `0 0 12px ${color}44`,
  } as React.CSSProperties

  if ('href' in rest && rest.href) {
    return (
      <a className={base} style={style} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        ▶ {children}
      </a>
    )
  }
  return (
    <button className={base} style={style} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>
      ▶ {children}
    </button>
  )
}
