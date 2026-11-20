import HUDChrome from '@/components/layout/HUDChrome'
import type { Project } from '@/lib/types'

interface Props {
  project: Project
  /** Heading level for the title: 2 directly under a page h1, 3 under a section h2. */
  headingLevel?: 2 | 3
}

const linkCls = 'inline-flex items-center min-h-6'

export default function NeonCard({ project, headingLevel = 2 }: Props) {
  const Heading = `h${headingLevel}` as const
  return (
    <div className="relative group">
      <span
        aria-hidden="true"
        className="absolute left-0 top-0 h-full w-[3px] bg-cp-red-deep z-10"
        style={{ boxShadow: '0 0 10px #FF003C' }}
      />
      <HUDChrome accent="red" title={project.featured ? 'Featured · Project' : 'Project'} className="h-full transition-all group-hover:[box-shadow:0_0_20px_#C5003C66]">
        <div className="space-y-3">
          <Heading className="font-[var(--font-display)] text-lg text-cp-red tracking-wider">
            {project.title}
          </Heading>
          <p className="text-sm text-cp-text/80">{project.description}</p>
          <div className="flex flex-wrap gap-2">
            {project.tags.map((t) => (
              <span
                key={t}
                className="text-[10px] uppercase tracking-widest px-2 py-0.5 border border-cp-teal/40 text-cp-teal/90"
              >
                {t}
              </span>
            ))}
          </div>
          <div className="flex gap-3 pt-2 text-xs">
            {project.demoUrl && (
              <a
                href={project.demoUrl}
                target="_blank"
                rel="noreferrer"
                className={`${linkCls} text-cp-yellow hover:underline`}
              >
                <span aria-hidden="true">▶&nbsp;</span>DEMO
                <span className="sr-only">: {project.title} (opens in a new tab)</span>
              </a>
            )}
            {project.repoUrl && (
              <a
                href={project.repoUrl}
                target="_blank"
                rel="noreferrer"
                className={`${linkCls} text-cp-text hover:text-cp-red`}
              >
                <span aria-hidden="true">▶&nbsp;</span>REPO
                <span className="sr-only">: {project.title} (opens in a new tab)</span>
              </a>
            )}
          </div>
        </div>
      </HUDChrome>
    </div>
  )
}
