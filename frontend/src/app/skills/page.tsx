import SkillsChart from '@/components/sections/SkillsChart'
import GlitchText from '@/components/ui/GlitchText'
import { api } from '@/lib/api'
import { pageMetadata } from '@/lib/site'

export const metadata = pageMetadata({
  title: 'Skills // Loadout',
  description: 'Languages, frameworks and tools grouped by area, filterable by category.',
  path: '/skills',
})

export default async function SkillsPage() {
  const profile = await api.getProfile().catch(() => null)
  const skills = profile?.skills ?? []

  return (
    <section className="max-w-6xl mx-auto px-4 py-10 md:py-16">
      <h1 className="font-[var(--font-display)] text-2xl sm:text-3xl mb-6 sm:mb-8 tracking-wider">
        <GlitchText text="// LOADOUT" />
      </h1>
      {skills.length === 0 ? (
        <p className="text-cp-red font-[var(--font-mono)]">{'// Loadout empty //'}</p>
      ) : (
        <SkillsChart skills={skills} />
      )}
    </section>
  )
}
