import HUDChrome from '@/components/layout/HUDChrome'
import type { Experience } from '@/lib/types'

function fmtRange(start: string, end: string | null, current: boolean) {
  const fmt = (iso: string) => {
    const d = new Date(iso)
    // Dates are date-only ISO strings, which parse as UTC; format in UTC too so
    // the month doesn't shift for viewers west of Greenwich.
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })
  }
  if (current) return `${fmt(start)} — PRESENT`
  // A past role whose end date is unknown shows its start only, never "PRESENT".
  return end ? `${fmt(start)} — ${fmt(end)}` : fmt(start)
}

export default function ExperienceTimeline({ items }: { items: Experience[] }) {
  return (
    <div className="relative max-w-4xl mx-auto px-4">
      {/* Vertical rule — left-aligned on mobile, centred on md+ */}
      <div
        aria-hidden
        className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-cp-border"
      />
      <ul className="space-y-10 sm:space-y-12">
        {items.map((e, i) => {
          const right = i % 2 === 1
          return (
            <li key={e.id} className="relative md:grid md:grid-cols-2 md:gap-10">
              {/* Diamond marker */}
              <span
                aria-hidden
                className="absolute left-4 md:left-1/2 top-4 -translate-x-1/2 w-3 h-3 rotate-45 bg-cp-teal"
                style={{ boxShadow: '0 0 12px #55EAD4' }}
              />

              {/* Card wrapper:
                  – mobile:  pl-8 (offset past the timeline rule)
                  – md left: pr-10, right card: md:col-start-2, pl-10
              */}
              <div
                className={[
                  right ? 'md:col-start-2 md:pl-10' : 'md:pr-10',
                  'pl-8 md:pl-0',
                ].join(' ')}
              >
                <HUDChrome
                  accent={e.current ? 'red' : 'teal'}
                  title={fmtRange(e.startDate, e.endDate, e.current)}
                >
                  <div className="space-y-3">
                    {/* Role + company — right-align heading block on left-side cards (md+) */}
                    <div className={!right ? 'md:text-right' : ''}>
                      {/* h2: each role sits directly under the page's h1 */}
                      <h2 className="font-[var(--font-display)] text-xl text-cp-yellow">
                        {e.role}
                      </h2>
                      <p className="text-cp-teal text-sm uppercase tracking-widest mt-1">
                        @ {e.company}
                        {e.location && (
                          <span className="text-cp-muted"> · {e.location}</span>
                        )}
                      </p>
                    </div>

                    {/* Body text always left-aligned for readability */}
                    <p className="text-cp-text/80 text-sm">{e.description}</p>

                    {e.highlights?.length > 0 && (
                      <ul className="text-sm space-y-1 text-cp-text/90 list-disc pl-5">
                        {e.highlights.map((h, idx) => (
                          <li key={idx}>{h}</li>
                        ))}
                      </ul>
                    )}

                    {e.technologies?.length > 0 && (
                      <div className={`flex flex-wrap gap-1 pt-1 ${!right ? 'md:justify-end' : ''}`}>
                        {e.technologies.map((t) => (
                          <span
                            key={t}
                            className="text-[10px] uppercase px-2 py-0.5 border border-cp-teal/40 text-cp-teal/90"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </HUDChrome>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
