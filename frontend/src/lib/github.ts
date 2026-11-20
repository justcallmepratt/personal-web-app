// Server-only: public GitHub activity for the site owner (work package WP-G).
//
//  One request to the REST API, `GET /users/{user}/repos`, made while the home
//  page is rendered. The page is static and re-rendered at most once per
//  REVALIDATE_SECONDS, so GitHub sees about one request an hour, far below the
//  unauthenticated limit of 60 requests per hour per IP address
//  (https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api).
//  Builds on shared CI or Vercel IPs share that quota, which is one more reason
//  to stay at a single request.
//
//  GITHUB_TOKEN is optional and never required; when set it only raises that
//  limit. It is read on the server and never reaches the browser: nothing here
//  is imported by a client component and the visitor's browser never calls GitHub.
//
//  Every failure (network, timeout, 403/404/5xx, malformed JSON, no repos)
//  returns an "unavailable" or "empty" result and logs a warning. It never throws,
//  so a build or a revalidation always completes and the page shows a profile link.

/** Change the default here; GITHUB_USERNAME overrides it without a code change. */
export const DEFAULT_GITHUB_USERNAME = 'justcallmepratt'

export const GITHUB_REVALIDATE_SECONDS = 3600
export const GITHUB_TIMEOUT_MS = 5000
/** Repositories shown on the page. */
export const GITHUB_REPO_LIMIT = 6
const PER_PAGE = 100
const API = 'https://api.github.com'

// GitHub logins: letters, digits and single hyphens, 1-39 characters, not starting
// or ending with a hyphen. Checking keeps an odd environment value out of the URL path.
const LOGIN = /^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}$/

export interface GitHubRepo {
  name: string
  url: string
  description: string | null
  language: string | null
  stars: number
  /** ISO 8601 timestamp of the last push, or null if GitHub did not send a valid one. */
  pushedAt: string | null
}

export interface LanguageShare {
  language: string
  count: number
  /** Whole-number percentage of the listed repositories that have a primary language. */
  percent: number
}

export type GitHubActivity =
  | { status: 'ok'; username: string; profileUrl: string; repos: GitHubRepo[]; languages: LanguageShare[] }
  | { status: 'empty' | 'unavailable'; username: string; profileUrl: string }

export function resolveGitHubUsername(raw: string | undefined): string {
  const value = raw?.trim()
  if (!value) return DEFAULT_GITHUB_USERNAME
  if (LOGIN.test(value)) return value
  console.warn('GITHUB_USERNAME is not a valid GitHub login; using the default.')
  return DEFAULT_GITHUB_USERNAME
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

const text = (v: unknown): string | null =>
  typeof v === 'string' && v.trim() ? v.trim() : null

function validDate(v: unknown): string | null {
  return typeof v === 'string' && !Number.isNaN(Date.parse(v)) ? v : null
}

/** Maps one API item to a repo, or null if it is unusable, forked, archived or not a github.com link. */
export function toRepo(item: unknown): GitHubRepo | null {
  if (!isRecord(item)) return null
  if (item.fork === true || item.archived === true || item.private === true) return null
  const name = text(item.name)
  const url = text(item.html_url)
  if (!name || !url?.startsWith('https://github.com/')) return null
  return {
    name,
    url,
    description: text(item.description),
    language: text(item.language),
    stars: typeof item.stargazers_count === 'number' && item.stargazers_count > 0 ? Math.floor(item.stargazers_count) : 0,
    pushedAt: validDate(item.pushed_at),
  }
}

const pushedTime = (r: GitHubRepo) => (r.pushedAt ? Date.parse(r.pushedAt) : 0)

/** Share of the given repositories per primary language; repos without one are left out. */
export function summariseLanguages(repos: GitHubRepo[]): LanguageShare[] {
  const counts = new Map<string, number>()
  for (const r of repos) if (r.language) counts.set(r.language, (counts.get(r.language) ?? 0) + 1)
  const total = [...counts.values()].reduce((a, b) => a + b, 0)
  return [...counts.entries()]
    .map(([language, count]) => ({ language, count, percent: Math.round((count / total) * 100) }))
    .sort((a, b) => b.count - a.count || a.language.localeCompare(b.language))
}

export async function getGitHubActivity(): Promise<GitHubActivity> {
  const username = resolveGitHubUsername(process.env.GITHUB_USERNAME)
  const profileUrl = `https://github.com/${username}`
  try {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'justcallmepratt.dev-portfolio (server-side, hourly revalidation)',
    }
    const token = process.env.GITHUB_TOKEN?.trim()
    if (token) headers.Authorization = `Bearer ${token}`

    const res = await fetch(
      `${API}/users/${username}/repos?type=owner&sort=pushed&direction=desc&per_page=${PER_PAGE}`,
      {
        headers,
        next: { revalidate: GITHUB_REVALIDATE_SECONDS },
        signal: AbortSignal.timeout(GITHUB_TIMEOUT_MS),
      },
    )
    if (!res.ok) {
      const limited = res.status === 429 || (res.status === 403 && res.headers?.get('x-ratelimit-remaining') === '0')
      throw new Error(`GitHub API ${res.status}${limited ? ' (rate limited)' : ''}`)
    }
    const data: unknown = await res.json()
    if (!Array.isArray(data)) throw new Error('unexpected response shape (not a list)')

    const repos = data
      .map(toRepo)
      .filter((r): r is GitHubRepo => r !== null)
      .sort((a, b) => pushedTime(b) - pushedTime(a))
      .slice(0, GITHUB_REPO_LIMIT)

    if (repos.length === 0) {
      console.warn(`GitHub activity: no public, non-fork, non-archived repositories for ${username}.`)
      return { status: 'empty', username, profileUrl }
    }
    return { status: 'ok', username, profileUrl, repos, languages: summariseLanguages(repos) }
  } catch (e) {
    console.warn(`GitHub activity unavailable, showing a profile link instead. ${e}`)
    return { status: 'unavailable', username, profileUrl }
  }
}
