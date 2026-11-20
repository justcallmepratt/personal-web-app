import { ReactNode } from 'react'

type Accent = 'red' | 'yellow' | 'teal'

const accentMap: Record<Accent, string> = {
  red: '#C5003C',
  yellow: '#F3E600',
  teal: '#55EAD4',
}

interface Props {
  children: ReactNode
  title?: string
  accent?: Accent
  className?: string
}

export default function HUDChrome({ children, title, accent = 'red', className = '' }: Props) {
  const color = accentMap[accent]
  return (
    <div
      className={`hud-clip relative bg-[#111318] border ${className}`}
      style={{ borderColor: color, boxShadow: `0 0 0 1px ${color}22, 0 0 24px ${color}11` }}
    >
      {title && (
        <div
          className="px-4 py-2 text-xs uppercase tracking-[0.2em] border-b font-[var(--font-mono)]"
          style={{ borderColor: `${color}44`, color }}
        >
          ▰ {title}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  )
}
