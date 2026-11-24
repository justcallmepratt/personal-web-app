import HUDChrome from '@/components/layout/HUDChrome'
import { formatIsoDate } from '@/lib/dates'
import type { Research } from '@/lib/types'

const isHttpUrl = (url: string | undefined): url is string => !!url && /^https?:\/\//i.test(url)

interface Props {
  items: Research[]
}

/** Research papers as cards: title, context, co-authors, summary and an optional link. */
export default function ResearchList({ items }: Props) {
  return (
    <ul className="grid md:grid-cols-2 gap-6">
      {items.map((r) => {
        const date = formatIsoDate(r.date)
        return (
          <li key={r.id}>
            <HUDChrome accent="teal" title={date ?? 'Research'} className="h-full">
              <article className="space-y-3">
                <h2 className="font-[var(--font-display)] text-lg text-cp-yellow tracking-wider">
                  {r.title}
                </h2>
                {r.context && (
                  <p className="text-cp-teal text-sm uppercase tracking-widest">{r.context}</p>
                )}
                {r.coAuthors && r.coAuthors.length > 0 && (
                  <p className="text-xs text-cp-text/80">With {r.coAuthors.join(', ')}</p>
                )}
                <p className="text-sm text-cp-text/80">{r.summary}</p>
                {isHttpUrl(r.url) && (
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center min-h-6 text-xs text-cp-yellow hover:underline"
                  >
                    <span aria-hidden="true">▶&nbsp;</span>READ PAPER
                    <span className="sr-only">: {r.title} (opens in a new tab)</span>
                  </a>
                )}
              </article>
            </HUDChrome>
          </li>
        )
      })}
    </ul>
  )
}
