import HUDChrome from '@/components/layout/HUDChrome'
import GlitchText from '@/components/ui/GlitchText'
import type { Accent } from '@/lib/theme'
import {
  creditSections,
  DISCLAIMER_FULL,
  GUIDELINE_CHECKED,
  GUIDELINE_NAME,
  GUIDELINE_UPDATED,
  GUIDELINE_URL,
  OFL_TEXT_URL,
  THIRD_PARTY_ASSETS_NOTE,
  type CreditEntry,
} from '@/lib/credits'
import { pageMetadata } from '@/lib/site'

export const metadata = pageMetadata({
  title: 'Credits // Citations',
  description:
    'Frameworks, fonts, hosting and licences behind this site, and a note that it is an unofficial Cyberpunk 2077 fan work.',
  path: '/credits',
})

const accents: Accent[] = ['teal', 'yellow', 'red']
const linkClass = 'underline underline-offset-4 hover:text-cp-teal'

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  )
}

function Entry({ item }: { item: CreditEntry }) {
  return (
    <li className="py-1">
      <ExternalLink href={item.url}>{item.name}</ExternalLink>
      <span className="text-cp-muted"> · {item.role}</span>
      {item.licence && (
        <span className="text-cp-muted">
          {' · '}
          {item.licenceUrl ? <ExternalLink href={item.licenceUrl}>{item.licence}</ExternalLink> : item.licence}
        </span>
      )}
    </li>
  )
}

function SectionHeading({ id, accent, children }: { id: string; accent: Accent; children: React.ReactNode }) {
  const colour = accent === 'red' ? 'text-cp-red' : accent === 'yellow' ? 'text-cp-yellow' : 'text-cp-teal'
  return (
    <h2 id={id} className={`mb-2 text-xs uppercase tracking-[0.2em] font-[var(--font-mono)] ${colour}`}>
      <span aria-hidden="true">▰ </span>
      {children}
    </h2>
  )
}

export default function CreditsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 md:py-16 space-y-8">
      <h1 className="font-[var(--font-display)] text-2xl sm:text-3xl tracking-wider">
        <GlitchText text="// CREDITS" />
      </h1>

      <section aria-labelledby="disclaimer">
        <SectionHeading id="disclaimer" accent="red">Unofficial fan work</SectionHeading>
        <HUDChrome accent="red">
          <p className="font-semibold">{DISCLAIMER_FULL}</p>
          <p className="mt-3">
            The look of this site is inspired by the Cyberpunk 2077 universe. It is a personal portfolio. {THIRD_PARTY_ASSETS_NOTE}
          </p>
          <p className="mt-3">
            The wording follows the{' '}
            <ExternalLink href={GUIDELINE_URL}>{GUIDELINE_NAME}</ExternalLink>, which asks for fan content to be clearly
            marked as unofficial and not endorsed. The page shows “Last updated on {GUIDELINE_UPDATED}”; this site
            re-read it on {GUIDELINE_CHECKED}. This is a statement of fact, not legal advice, and it does not claim
            any licence or permission from CD PROJEKT RED.
          </p>
        </HUDChrome>
      </section>

      {creditSections.map((section, i) => (
        <section key={section.id} aria-labelledby={section.id}>
          <SectionHeading id={section.id} accent={accents[i % accents.length]}>{section.title}</SectionHeading>
          <HUDChrome accent={accents[i % accents.length]}>
            {section.intro && <p className="mb-2 text-cp-muted">{section.intro}</p>}
            <ul>
              {section.items.map((item) => (
                <Entry key={item.name} item={item} />
              ))}
            </ul>
            {section.id === 'fonts' && (
              <p className="mt-3 text-cp-muted">
                Licence text: <ExternalLink href={OFL_TEXT_URL}>SIL Open Font License 1.1</ExternalLink>.
              </p>
            )}
          </HUDChrome>
        </section>
      ))}
    </div>
  )
}
