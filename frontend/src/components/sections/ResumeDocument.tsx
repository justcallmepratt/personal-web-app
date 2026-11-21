import GlitchText from '@/components/ui/GlitchText'
import NeonButton from '@/components/ui/NeonButton'
import type { ResumeData, ResumeEntry, ResumeLink, ResumeSection } from '@/lib/resume'

// The resume on screen and on paper. It draws the model from lib/resume.ts and
// nothing else, exactly like the PDF does. On screen it wears the site's neon
// style; the `.resume` print rules in globals.css turn it into plain black on
// white, and `print:hidden` drops the controls.

/**
 * Shows the address itself, so the link still says where it goes on paper.
 * The accessible name adds what the address is and that it opens a new tab;
 * it starts with the label and contains the visible text.
 */
function ExternalLink({ link }: { link: ResumeLink }) {
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noreferrer"
      aria-label={`${link.label}: ${link.display} (opens in a new tab)`}
      className="inline-flex items-center min-h-6 text-cp-yellow underline underline-offset-4 decoration-cp-yellow/50 hover:decoration-cp-yellow break-all"
    >
      {link.display}
    </a>
  )
}

function Entry({ entry }: { entry: ResumeEntry }) {
  return (
    <li className="resume-entry">
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-x-6 print:flex-row print:justify-between">
        <h3 className="font-[var(--font-display)] text-base text-cp-yellow tracking-wide break-words min-w-0">
          {entry.title}
        </h3>
        {entry.date && (
          <p className="text-xs uppercase tracking-widest text-cp-muted sm:shrink-0 sm:text-right print:shrink-0">
            {entry.date}
          </p>
        )}
      </div>
      {entry.subtitle && (
        <p className="text-cp-teal text-sm tracking-wide mt-0.5 break-words">{entry.subtitle}</p>
      )}
      {entry.text && <p className="text-cp-text/90 text-sm leading-relaxed mt-2 break-words">{entry.text}</p>}
      {entry.bullets.length > 0 && (
        <ul className="text-sm text-cp-text/90 list-disc pl-5 mt-2 space-y-1 break-words">
          {entry.bullets.map((bullet, i) => (
            <li key={i}>{bullet}</li>
          ))}
        </ul>
      )}
      {entry.details.length > 0 && (
        <dl className="text-sm mt-2 space-y-1">
          {entry.details.map((detail) => (
            <div key={detail.label} className="break-words">
              <dt className="inline text-cp-teal">{detail.label}: </dt>
              <dd className="inline text-cp-text/90">{detail.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {entry.links.length > 0 && (
        <ul className="text-sm mt-2 space-y-1">
          {entry.links.map((link) => (
            <li key={link.url}>
              <span className="text-cp-teal">{link.label}: </span>
              <ExternalLink link={link} />
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}

function Section({ section }: { section: ResumeSection }) {
  const headingId = `resume-${section.id}`
  return (
    <section aria-labelledby={headingId} className="resume-section">
      <h2
        id={headingId}
        className="font-[var(--font-mono)] text-sm uppercase tracking-[0.3em] text-cp-teal border-b border-cp-border-strong pb-2 mb-4"
      >
        {section.heading}
      </h2>
      {section.layout === 'inline' ? (
        <dl className="space-y-2 text-sm">
          {section.entries.map((entry) => (
            <div key={entry.id} className="resume-entry sm:grid sm:grid-cols-[minmax(0,14rem)_1fr] sm:gap-x-4 print:grid print:grid-cols-[minmax(0,14rem)_1fr] print:gap-x-4">
              <dt className="text-cp-yellow break-words">{entry.title}</dt>
              <dd className="text-cp-text/90 break-words">{entry.text}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <ul className="space-y-6 print:space-y-4">
          {section.entries.map((entry) => (
            <Entry key={entry.id} entry={entry} />
          ))}
        </ul>
      )}
    </section>
  )
}

interface Props {
  data: ResumeData
  /** Address of the generated PDF; the download button is left out without it. */
  pdfHref?: string
}

export default function ResumeDocument({ data, pdfHref }: Props) {
  const contact = data.location || data.links.length > 0
  return (
    <article className="resume space-y-10 print:space-y-6">
      <header className="space-y-3">
        <h1 className="font-[var(--font-display)] text-3xl sm:text-4xl tracking-wide text-cp-text break-words">
          <GlitchText text={data.name} />
        </h1>
        {data.tagline && (
          <p className="font-[var(--font-mono)] text-cp-yellow text-base sm:text-lg break-words">{data.tagline}</p>
        )}
        {contact && (
          <ul aria-label="Contact" className="flex flex-col sm:flex-row sm:flex-wrap gap-x-6 gap-y-1 text-sm print:flex-row">
            {data.location && <li className="text-cp-text">{data.location}</li>}
            {data.links.map((link) => (
              <li key={link.url}>
                <ExternalLink link={link} />
              </li>
            ))}
          </ul>
        )}
        {pdfHref && (
          <div className="pt-2 print:hidden">
            <NeonButton href={pdfHref} accent="yellow" className="w-full sm:w-auto justify-center">
              Download PDF
            </NeonButton>
          </div>
        )}
      </header>

      {data.sections.map((section) => (
        <Section key={section.id} section={section} />
      ))}
    </article>
  )
}
