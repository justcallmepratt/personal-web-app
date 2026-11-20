import HUDChrome from '@/components/layout/HUDChrome'
import type { Certification } from '@/lib/types'

/**
 * Formats an ISO date at the precision it was written with: '2023' stays a
 * year, '2023-05' and '2023-05-14' become "May 2023". Anything else is not
 * shown, so a typo never renders as "Invalid Date".
 */
export function formatCertDate(date: string | undefined): string | null {
  const match = date?.trim().match(/^(\d{4})(?:-(\d{2}))?(?:-\d{2})?$/)
  if (!match) return null
  const [, year, month] = match
  if (!month) return year
  if (Number(month) < 1 || Number(month) > 12) return null
  const d = new Date(Date.UTC(Number(year), Number(month) - 1, 1))
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })
}

const isHttpUrl = (url: string | undefined): url is string => !!url && /^https?:\/\//i.test(url)

export default function CertificationsList({ items }: { items: Certification[] }) {
  return (
    <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((c) => {
        const date = formatCertDate(c.date)
        return (
          <li key={c.id}>
            <HUDChrome accent="teal" title={date ?? 'Certification'} className="h-full">
              <div className="space-y-2">
                {/* h2: each certification sits directly under the page's h1 */}
                <h2 className="font-[var(--font-display)] text-lg text-cp-yellow tracking-wider">
                  {c.name}
                </h2>
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
