import type { PlannedProject } from '@/lib/types'

export const PLANNED_HEADING = 'In the works'
export const PLANNED_NOTE = 'Planned projects. Nothing here is built yet.'

/**
 * Ideas with no code yet. Styled apart from the project cards on purpose
 * (dashed, muted, no accent glow, no links) so they never read as shipped
 * work. Renders nothing when there are none.
 */
export default function PlannedProjects({ items }: { items: PlannedProject[] }) {
  if (items.length === 0) return null
  return (
    <section aria-labelledby="planned-projects-heading" className="mt-14 sm:mt-16">
      <h2
        id="planned-projects-heading"
        className="font-[var(--font-display)] text-xl sm:text-2xl tracking-wider text-cp-text"
      >
        {'// '}{PLANNED_HEADING.toUpperCase()}
      </h2>
      <p className="mt-2 mb-6 text-sm font-[var(--font-mono)] text-cp-muted">{PLANNED_NOTE}</p>
      <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((p) => (
          <li key={p.id} className="border border-dashed border-cp-border-strong p-4">
            <p className="text-[10px] uppercase tracking-widest font-[var(--font-mono)] text-cp-muted">
              Planned
            </p>
            <h3 className="mt-1 font-[var(--font-display)] text-base tracking-wider text-cp-text">
              {p.name}
            </h3>
            <p className="mt-2 text-sm text-cp-text/80">{p.goal}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
