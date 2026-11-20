import Link from 'next/link'
import ProjectsGrid from '@/components/sections/ProjectsGrid'
import GlitchText from '@/components/ui/GlitchText'
import { api } from '@/lib/api'

export const metadata = { title: 'Projects // Night City Ops' }

export default async function ProjectsPage() {
  const projects = await api.getProjects().catch(() => [])
  return (
    <section className="max-w-6xl mx-auto px-4 py-10 md:py-16">
      <h1 className="font-[var(--font-display)] text-2xl sm:text-3xl mb-6 sm:mb-8 tracking-wider">
        <GlitchText text="// PROJECTS" />
      </h1>
      <Link
        href="/projects/kafka"
        className="inline-flex items-center min-h-[44px] mb-6 text-sm uppercase tracking-[0.2em] font-[var(--font-mono)] text-cp-teal hover:underline"
      >
        ▶ Live demo: Apache Kafka producer / consumer
      </Link>
      {projects.length === 0 ? (
        <p className="text-cp-red font-[var(--font-mono)]">{'// No projects loaded //'}</p>
      ) : (
        <ProjectsGrid projects={projects} />
      )}
    </section>
  )
}
