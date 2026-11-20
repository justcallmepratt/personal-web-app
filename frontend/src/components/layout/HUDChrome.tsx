import { ReactNode } from 'react'
import { accents, type Accent } from '@/lib/theme'

interface Props {
  children: ReactNode
  title?: string
  accent?: Accent
  className?: string
}

export default function HUDChrome({ children, title, accent = 'red', className = '' }: Props) {
  const { line, text } = accents[accent]
  return (
    <div
      className={`hud-clip relative bg-[#111318] border ${className}`}
      style={{ borderColor: line, boxShadow: `0 0 0 1px ${line}22, 0 0 24px ${line}11` }}
    >
      {title && (
        <div
          className="px-4 py-2 text-xs uppercase tracking-[0.2em] border-b font-[var(--font-mono)]"
          style={{ borderColor: `${line}44`, color: text }}
        >
          <span aria-hidden="true">▰ </span>
          {title}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  )
}
