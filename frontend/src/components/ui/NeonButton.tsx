import { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from 'react'
import { accents, type Accent } from '@/lib/theme'

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
  const { line, text } = accents[accent]
  const base  = `hud-clip inline-flex items-center gap-2 px-5 py-3 min-h-[44px] text-xs uppercase tracking-[0.25em] font-[var(--font-mono)] transition-all border bg-transparent hover:bg-[color:var(--bg)] cursor-pointer disabled:cursor-wait ${className}`
  const style = {
    color: text,
    borderColor: line,
    ['--bg' as string]: `${line}22`,
    boxShadow: `0 0 12px ${line}44`,
  } as React.CSSProperties
  const marker = <span aria-hidden="true">▶</span>

  if ('href' in rest && rest.href) {
    return (
      <a className={base} style={style} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {marker} {children}
      </a>
    )
  }
  return (
    <button className={base} style={style} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {marker} {children}
    </button>
  )
}
