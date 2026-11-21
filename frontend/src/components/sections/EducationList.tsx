import HUDChrome from '@/components/layout/HUDChrome'
import { formatIsoDate } from '@/lib/dates'
import type { Education } from '@/lib/types'

const isHttpUrl = (url: string | undefined): url is string => !!url && /^https?:\/\//i.test(url)

/** A diploma picture may be a file under public/ ("/diplomas/bs.jpg") or an https address. */
const isImageSrc = (src: string | undefined): src is string =>
  !!src && (/^https:\/\//i.test(src) || (src.startsWith('/') && !src.startsWith('//')))

/**
 * Degrees and diplomas. Only `degree` and `institution` are required; the
 * year, minor, honours, link and picture each appear only when the entry has
 * one. Headings are h3: the list sits under an "Education" h2.
 */
export default function EducationList({ items }: { items: Education[] }) {
  return (
    <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((e) => {
        const year = formatIsoDate(e.year)
        return (
          <li key={e.id}>
            <HUDChrome accent="yellow" title={year ?? 'Degree'} className="h-full">
              <div className="space-y-2">
                <h3 className="font-[var(--font-display)] text-lg text-cp-yellow tracking-wider break-words">
                  {e.degree}
                </h3>
                <p className="text-cp-teal text-sm uppercase tracking-widest break-words">{e.institution}</p>
                {e.school && <p className="text-sm text-cp-text/90 break-words">{e.school}</p>}
                {e.minor && <p className="text-sm text-cp-text/90 break-words">Minor: {e.minor}</p>}
                {e.honours && <p className="text-sm text-cp-text/90 break-words">Honours: {e.honours}</p>}
                {isImageSrc(e.imageUrl) && (
                  // A plain <img>: the picture is optional and rarely viewed, so
                  // it is not worth an image-optimisation function on Vercel.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={e.imageUrl}
                    alt={`Diploma: ${e.degree}, ${e.institution}`}
                    loading="lazy"
                    className="w-full h-auto border border-cp-border"
                  />
                )}
                {isHttpUrl(e.url) && (
                  <a
                    href={e.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center min-h-6 text-xs text-cp-yellow hover:underline"
                  >
                    <span aria-hidden="true">▶&nbsp;</span>VIEW DETAILS
                    <span className="sr-only">: {e.degree} (opens in a new tab)</span>
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
