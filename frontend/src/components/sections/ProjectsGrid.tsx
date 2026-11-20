import NeonCard from '@/components/ui/NeonCard'
import type { Project } from '@/lib/types'

interface Props {
  projects: Project[]
  /** Heading level for card titles; pass 3 when the grid sits under an h2. */
  headingLevel?: 2 | 3
}

export default function ProjectsGrid({ projects, headingLevel = 2 }: Props) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((p) => (
        <NeonCard key={p.id} project={p} headingLevel={headingLevel} />
      ))}
    </div>
  )
}
