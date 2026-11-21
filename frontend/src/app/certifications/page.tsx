import CertificationsList from '@/components/sections/CertificationsList'
import EducationList from '@/components/sections/EducationList'
import GlitchText from '@/components/ui/GlitchText'
import { api } from '@/lib/api'
import { pageMetadata } from '@/lib/site'

export const metadata = pageMetadata({
  title: 'Certifications',
  description: 'Certifications, course certificates and degrees held by Pratham Sachan, with the issuer of each.',
  path: '/certifications',
})

const sectionHeading = 'font-[var(--font-mono)] text-sm uppercase tracking-[0.3em] text-cp-teal mb-4 sm:mb-6'

export default async function CertificationsPage() {
  const [items, education] = await Promise.all([
    api.getCertifications().catch(() => []),
    api.getEducation().catch(() => []),
  ])
  return (
    <div className="max-w-6xl mx-auto px-4 py-10 md:py-16 space-y-12">
      <h1 className="font-[var(--font-display)] text-2xl sm:text-3xl tracking-wider">
        <GlitchText text="// CERTIFICATIONS" />
      </h1>

      <section aria-labelledby="certifications-heading">
        <h2 id="certifications-heading" className={sectionHeading}>Certifications</h2>
        {items.length === 0 ? (
          <p className="text-cp-red font-[var(--font-mono)]">{'// No certifications loaded //'}</p>
        ) : (
          <CertificationsList items={items} headingLevel={3} />
        )}
      </section>

      {/* Degrees and diplomas, from the same `education` content as the resume.
          Left out entirely when there are none. */}
      {education.length > 0 && (
        <section aria-labelledby="education-heading">
          <h2 id="education-heading" className={sectionHeading}>Education</h2>
          <EducationList items={education} />
        </section>
      )}
    </div>
  )
}
