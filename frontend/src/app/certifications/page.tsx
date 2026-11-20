import CertificationsList from '@/components/sections/CertificationsList'
import GlitchText from '@/components/ui/GlitchText'
import { api } from '@/lib/api'
import { pageMetadata } from '@/lib/site'

export const metadata = pageMetadata({
  title: 'Certifications',
  description: 'Certifications and course certificates held by Pratham Sachan, with the issuer of each.',
  path: '/certifications',
})

export default async function CertificationsPage() {
  const items = await api.getCertifications().catch(() => [])
  return (
    <section className="max-w-6xl mx-auto px-4 py-10 md:py-16">
      <h1 className="font-[var(--font-display)] text-2xl sm:text-3xl mb-6 sm:mb-8 tracking-wider">
        <GlitchText text="// CERTIFICATIONS" />
      </h1>
      {items.length === 0 ? (
        <p className="text-cp-red font-[var(--font-mono)]">{'// No certifications loaded //'}</p>
      ) : (
        <CertificationsList items={items} />
      )}
    </section>
  )
}
