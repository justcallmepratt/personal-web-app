import HUDChrome from '@/components/layout/HUDChrome'
import { formatIsoDate } from '@/lib/dates'
import type { Certification } from '@/lib/types'

/**
 * Formats an ISO date at the precision it was written with: '2023' stays a
 * year, '2023-05' and '2023-05-14' become "May 2023". Anything else is not
 * shown, so a typo never renders as "Invalid Date".
 */
export function formatCertDate(date: string | undefined): string | null {
  return formatIsoDate(date)
}

const isHttpUrl = (url: string | undefined): url is string => !!url && /^https?:\/\//i.test(url)

interface Props {
  items: Certification[]
  /** 2 when the cards sit directly under the page's h1, 3 under a section h2. */
  headingLevel?: 2 | 3
}

export default function CertificationsList({ items, headingLevel = 2 }: Props) {
  const Heading = `h${headingLevel}` as const
  return (
    <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((c) => {
        const date = formatCertDate(c.date)
        return (
          <li key={c.id}>
            <HUDChrome accent="teal" title={date ?? 'Certification'} className="h-full">
              <div className="space-y-2">
                <Heading className="font-[var(--font-display)] text-lg text-cp-yellow tracking-wider">
                  {c.name}
                </Heading>
                <p className="text-cp-teal text-sm uppercase tracking-widest">{c.issuer}</p>
                {c.credentialId && (
                  <p className="text-xs font-[var(--font-mono)] text-cp-text/80 break-all">
                    Credential ID: {c.credentialId}
                  </p>
                )}
                {isHttpUrl(c.url) && (
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center min-h-6 text-xs text-cp-yellow hover:underline"
                  >
                    <span aria-hidden="true">▶&nbsp;</span>VIEW CREDENTIAL
                    <span className="sr-only">: {c.name} (opens in a new tab)</span>
                  </a>
                )}
              </div>
            </HUDChrome>
          </li>
        )
      })}
    </ul>
  )
}
