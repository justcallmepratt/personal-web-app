import ExperienceTimeline from '@/components/sections/ExperienceTimeline'
import GlitchText from '@/components/ui/GlitchText'
import { api } from '@/lib/api'
import { pageMetadata } from '@/lib/site'

export const metadata = pageMetadata({
  title: 'Experience // Career Log',
  description: 'Career log: roles, responsibilities, highlights and the technologies used in each.',
  path: '/experience',
})

export default async function ExperiencePage() {
  const items = await api.getExperience().catch(() => [])
  return (
    <section className="max-w-6xl mx-auto px-4 py-10 md:py-16">
      <h1 className="font-[var(--font-display)] text-2xl sm:text-3xl mb-8 sm:mb-12 tracking-wider text-center">
        <GlitchText text="// CAREER LOG" />
      </h1>
      {items.length === 0 ? (
        <p className="text-cp-red text-center font-[var(--font-mono)]">{'// No log entries //'}</p>
      ) : (
        <ExperienceTimeline items={items} />
      )}
    </section>
  )
}
