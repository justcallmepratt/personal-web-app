'use client'

import { motion, useReducedMotion } from 'framer-motion'
import type { Skill } from '@/lib/types'
import { accents, type Accent } from '@/lib/theme'

function accentFor(level: number): Accent {
  if (level > 70) return 'red'
  if (level >= 40) return 'yellow'
  return 'teal'
}

export default function SkillBar({ skill }: { skill: Skill }) {
  const { line, text } = accents[accentFor(skill.level)]
  // With "reduce motion" on, the bar jumps straight to its final width. The
  // initial state stays the same either way so server and client markup match.
  const reduceMotion = useReducedMotion()
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between font-[var(--font-mono)] text-xs">
        <span className="text-cp-text">{skill.name}</span>
        <span style={{ color: text }}>{skill.level.toString().padStart(3, '0')}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden" style={{ backgroundColor: 'rgba(197,0,60,0.04)' }}>
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${skill.level}%` }}
          viewport={{ once: true, amount: 0.5 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 1.2, ease: 'easeOut' }}
          data-reduced-motion={reduceMotion ? 'true' : undefined}
          className="h-full"
          style={{ backgroundColor: line, boxShadow: `0 0 8px ${line}` }}
        />
      </div>
    </div>
  )
}
