import ResearchList from '@/components/sections/ResearchList'
import GlitchText from '@/components/ui/GlitchText'
import { api } from '@/lib/api'
import { pageMetadata } from '@/lib/site'

export const metadata = pageMetadata({
  title: 'Research',
  description: 'Research papers by Pratham Sachan, with the question each one asked and what it found.',
  path: '/research',
})

export default async function ResearchPage() {
  const items = await api.getResearch().catch(() => [])
  return (
    <section className="max-w-6xl mx-auto px-4 py-10 md:py-16">
      <h1 className="font-[var(--font-display)] text-2xl sm:text-3xl mb-6 sm:mb-8 tracking-wider">
        <GlitchText text="// RESEARCH" />
      </h1>
      {items.length === 0 ? (
        <p className="text-cp-red font-[var(--font-mono)]">{'// No research loaded //'}</p>
      ) : (
        <ResearchList items={items} />
      )}
    </section>
  )
}
