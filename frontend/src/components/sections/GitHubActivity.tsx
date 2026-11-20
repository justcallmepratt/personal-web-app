import GlitchText from '@/components/ui/GlitchText'
import HUDChrome from '@/components/layout/HUDChrome'
import type { GitHubActivity as Activity } from '@/lib/github'

// Server component: no state, no animation, no client-side calls to GitHub.
// Data comes from lib/github.ts, fetched while the page is rendered.

const linkCls = 'inline-flex items-center min-h-6 hover:underline'

function fmtDate(iso: string) {
  // Format in UTC so the day does not shift with the build machine's time zone.
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
  })
}

function ProfileLink({ activity, label }: { activity: Activity; label: string }) {
  return (
    <a
      href={activity.profileUrl}
      target="_blank"
      rel="noreferrer"
      className={`${linkCls} text-cp-yellow`}
    >
      {label}
      <span className="sr-only">, opens in a new tab</span>
    </a>
  )
}

export default function GitHubActivity({ activity }: { activity: Activity }) {
  return (
    <section aria-labelledby="github-heading" className="max-w-6xl mx-auto px-4 pb-20">
      <h2 id="github-heading" className="font-[var(--font-display)] text-2xl tracking-wider mb-6">
        <GlitchText text="// GITHUB ACTIVITY" />
      </h2>

      {activity.status !== 'ok' ? (
        // Compact fallback: GitHub down, rate limited, or nothing public to show.
        <p className="text-sm text-cp-text/80">
          {activity.status === 'empty'
            ? 'No public repositories to show yet. '
            : 'Repository activity is unavailable right now. '}
          <ProfileLink activity={activity} label={`See ${activity.username} on GitHub`} />
        </p>
      ) : (
        <div className="space-y-6">
          <p className="text-sm text-cp-text/80">
            Recently pushed public repositories by{' '}
            <ProfileLink activity={activity} label={activity.username} />, straight from GitHub.
          </p>

          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {activity.repos.map((r) => (
              <li key={r.url}>
                <HUDChrome accent="teal" className="h-full">
                  <div className="space-y-3">
                    <h3 className="font-[var(--font-display)] text-lg tracking-wider break-words">
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noreferrer"
                        className={`${linkCls} text-cp-teal`}
                      >
                        {r.name}
                        <span className="sr-only">, GitHub repository (opens in a new tab)</span>
                      </a>
                    </h3>
                    <p className="text-sm text-cp-text/80">
                      {r.description ?? 'No description provided.'}
                    </p>
                    <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-cp-muted">
                      {r.language && <span>{r.language}</span>}
                      <span>
                        <span aria-hidden="true">★ </span>
                        {r.stars}
                        <span className="sr-only"> {r.stars === 1 ? 'star' : 'stars'}</span>
                      </span>
                      {r.pushedAt && (
                        <span>
                          Last push <time dateTime={r.pushedAt}>{fmtDate(r.pushedAt)}</time>
                        </span>
                      )}
                    </p>
                  </div>
                </HUDChrome>
              </li>
            ))}
          </ul>

          {activity.languages.length > 0 && (
            <div>
              <h3 className="text-xs uppercase tracking-[0.2em] text-cp-teal mb-3">
                Languages in these {activity.repos.length} repositories
              </h3>
              <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-cp-text">
                {activity.languages.map((l) => (
                  <li key={l.language}>
                    {l.language}{' '}
                    <span className="text-cp-muted">
                      {l.percent}% ({l.count} {l.count === 1 ? 'repository' : 'repositories'})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
