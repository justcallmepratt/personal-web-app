'use client'

import { useMemo, useState } from 'react'
import HUDChrome from '@/components/layout/HUDChrome'
import SkillBar from '@/components/ui/SkillBar'
import type { Skill } from '@/lib/types'

const CATEGORIES: Skill['category'][] = ['Frontend', 'Backend', 'DevOps', 'Business & Leadership', 'Other']
type Filter = 'All' | Skill['category']

export default function SkillsChart({ skills }: { skills: Skill[] }) {
  const [filter, setFilter] = useState<Filter>('All')

  const grouped = useMemo(() => {
    const filtered = filter === 'All' ? skills : skills.filter((s) => s.category === filter)
    return CATEGORIES.map((c) => ({
      cat: c,
      items: filtered.filter((s) => s.category === c),
    })).filter((g) => g.items.length > 0)
  }, [skills, filter])

  const filters: Filter[] = ['All', ...CATEGORIES]

  return (
    <div className="space-y-6">
      <div role="group" aria-label="Filter skills by category" className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 text-xs uppercase tracking-widest border transition-colors ${filter === f
                ? 'border-cp-teal text-cp-teal bg-cp-teal/10'
                : 'border-cp-border-strong text-cp-text hover:border-cp-teal/60'
              }`}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        {grouped.map((g) => (
          <HUDChrome key={g.cat} title={g.cat} accent="teal">
            {/* Skills with a level get a bar; skills without one are a plain list. */}
            {g.items.some((s) => s.level !== undefined) && (
              <div className="space-y-4 mb-4 last:mb-0">
                {g.items.filter((s) => s.level !== undefined).map((s) => (
                  <SkillBar key={s.name} skill={s} />
                ))}
              </div>
            )}
            {g.items.some((s) => s.level === undefined) && (
              <ul className="flex flex-wrap gap-2 font-[var(--font-mono)]">
                {g.items.filter((s) => s.level === undefined).map((s) => (
                  <li key={s.name} className="px-2 py-1 text-xs uppercase tracking-widest border border-cp-teal/40 text-cp-teal/90">
                    {s.name}
                  </li>
                ))}
              </ul>
            )}
          </HUDChrome>
        ))}
      </div>
    </div>
  )
}
