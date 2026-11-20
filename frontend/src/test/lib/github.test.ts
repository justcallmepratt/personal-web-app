import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getGitHubActivity, resolveGitHubUsername, summariseLanguages, toRepo,
  DEFAULT_GITHUB_USERNAME, GITHUB_REPO_LIMIT, GITHUB_REVALIDATE_SECONDS,
} from '@/lib/github'

const item = (over: Record<string, unknown> = {}) => ({
  name: 'repo',
  html_url: 'https://github.com/justcallmepratt/repo',
  description: 'A repo',
  language: 'TypeScript',
  stargazers_count: 3,
  pushed_at: '2026-11-01T10:00:00Z',
  fork: false,
  archived: false,
  ...over,
})

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers })

describe('getGitHubActivity', () => {
  let warn: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
    warn.mockRestore()
  })

  it('returns repos sorted by last push, without forks or archived repos', async () => {
    vi.mocked(fetch).mockResolvedValue(json([
      item({ name: 'old', html_url: 'https://github.com/u/old', pushed_at: '2025-01-01T00:00:00Z' }),
      item({ name: 'forked', html_url: 'https://github.com/u/forked', fork: true }),
      item({ name: 'archived', html_url: 'https://github.com/u/archived', archived: true }),
      item({ name: 'new', html_url: 'https://github.com/u/new', pushed_at: '2026-11-10T00:00:00Z' }),
    ]) as never)

    const result = await getGitHubActivity()

    expect(result.status).toBe('ok')
    if (result.status !== 'ok') return
    expect(result.repos.map((r) => r.name)).toEqual(['new', 'old'])
    expect(result.profileUrl).toBe(`https://github.com/${DEFAULT_GITHUB_USERNAME}`)
  })

  it('caps the list', async () => {
    const many = Array.from({ length: 20 }, (_, i) =>
      item({ name: `r${i}`, html_url: `https://github.com/u/r${i}`, pushed_at: `2026-10-${String(i + 1).padStart(2, '0')}T00:00:00Z` }))
    vi.mocked(fetch).mockResolvedValue(json(many) as never)

    const result = await getGitHubActivity()

    expect(result.status === 'ok' && result.repos).toHaveLength(GITHUB_REPO_LIMIT)
    expect(result.status === 'ok' && result.repos[0].name).toBe('r19')
  })

  it('makes one request with hourly revalidation, a timeout, a User-Agent and no token by default', async () => {
    vi.stubEnv('GITHUB_TOKEN', '')
    vi.mocked(fetch).mockResolvedValue(json([item()]) as never)

    await getGitHubActivity()

    expect(fetch).toHaveBeenCalledTimes(1)
    const [url, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit & { next?: { revalidate: number } }]
    expect(url).toContain(`/users/${DEFAULT_GITHUB_USERNAME}/repos`)
    expect(init.next?.revalidate).toBe(GITHUB_REVALIDATE_SECONDS)
    expect(init.signal).toBeInstanceOf(AbortSignal)
    const headers = init.headers as Record<string, string>
    expect(headers['User-Agent']).toMatch(/justcallmepratt/)
    expect(headers.Authorization).toBeUndefined()
  })

  it('sends GITHUB_TOKEN as a bearer token only when set', async () => {
    vi.stubEnv('GITHUB_TOKEN', 'tok')
    vi.mocked(fetch).mockResolvedValue(json([item()]) as never)

    await getGitHubActivity()

    const init = vi.mocked(fetch).mock.calls[0][1] as RequestInit
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer tok')
  })

  it('uses GITHUB_USERNAME when valid and ignores it when not', async () => {
    vi.stubEnv('GITHUB_USERNAME', 'someone-else')
    vi.mocked(fetch).mockResolvedValue(json([item()]) as never)
    const ok = await getGitHubActivity()
    expect(ok.profileUrl).toBe('https://github.com/someone-else')

    vi.stubEnv('GITHUB_USERNAME', '../evil?x=1')
    vi.mocked(fetch).mockResolvedValue(json([item()]) as never)
    const bad = await getGitHubActivity()
    expect(bad.profileUrl).toBe(`https://github.com/${DEFAULT_GITHUB_USERNAME}`)
    expect(vi.mocked(fetch).mock.calls[1][0]).not.toContain('evil')
  })

  // ── Failure modes: never throw, always a result, always a warning ─────────

  it.each([
    ['403 rate limited', 403, { 'x-ratelimit-remaining': '0' }, 'rate limited'],
    ['403 without rate-limit header', 403, {}, '403'],
    ['429', 429, {}, 'rate limited'],
    ['404', 404, {}, '404'],
    ['500', 500, {}, '500'],
    ['503', 503, {}, '503'],
  ])('is unavailable on %s', async (_l, status, headers, logged) => {
    vi.mocked(fetch).mockResolvedValue(json({ message: 'x' }, status, headers) as never)

    const result = await getGitHubActivity()

    expect(result.status).toBe('unavailable')
    expect(result.profileUrl).toBe(`https://github.com/${DEFAULT_GITHUB_USERNAME}`)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining(logged))
  })

  it.each([
    ['network failure', new TypeError('fetch failed')],
    ['timeout', new DOMException('The operation was aborted due to timeout', 'TimeoutError')],
  ])('is unavailable on %s', async (_l, error) => {
    vi.mocked(fetch).mockRejectedValue(error)

    const result = await getGitHubActivity()

    expect(result.status).toBe('unavailable')
    expect(warn).toHaveBeenCalled()
  })

  it('is unavailable on malformed JSON', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('{not json', { status: 200 }) as never)
    expect((await getGitHubActivity()).status).toBe('unavailable')
    expect(warn).toHaveBeenCalled()
  })

  it.each([
    ['an object', { message: 'nope' }],
    ['null', null],
    ['a string', 'hello'],
  ])('is unavailable when the body is %s, not a list', async (_l, body) => {
    vi.mocked(fetch).mockResolvedValue(json(body) as never)
    expect((await getGitHubActivity()).status).toBe('unavailable')
  })

  it('is empty for an empty list, with a warning', async () => {
    vi.mocked(fetch).mockResolvedValue(json([]) as never)
    expect((await getGitHubActivity()).status).toBe('empty')
    expect(warn).toHaveBeenCalled()
  })

  it('is empty when every repo is a fork or archived', async () => {
    vi.mocked(fetch).mockResolvedValue(json([item({ fork: true }), item({ archived: true })]) as never)
    expect((await getGitHubActivity()).status).toBe('empty')
  })

  it('keeps repos with null description and language, and drops unusable items', async () => {
    vi.mocked(fetch).mockResolvedValue(json([
      item({ description: null, language: null, stargazers_count: undefined, pushed_at: null }),
      null,
      42,
      { name: 'no-url' },
      item({ name: 'bad-host', html_url: 'https://evil.example/x' }),
    ]) as never)

    const result = await getGitHubActivity()

    expect(result.status).toBe('ok')
    if (result.status !== 'ok') return
    expect(result.repos).toEqual([
      { name: 'repo', url: 'https://github.com/justcallmepratt/repo', description: null, language: null, stars: 0, pushedAt: null },
    ])
    expect(result.languages).toEqual([])
  })
})

describe('helpers', () => {
  it('toRepo rejects private repos and invalid dates', () => {
    expect(toRepo(item({ private: true }))).toBeNull()
    expect(toRepo(item({ pushed_at: 'not a date' }))?.pushedAt).toBeNull()
  })

  it('summariseLanguages counts primary languages, ignoring repos without one', () => {
    const repo = (language: string | null) => ({ name: 'n', url: 'u', description: null, language, stars: 0, pushedAt: null })
    expect(summariseLanguages([repo('Java'), repo('TypeScript'), repo('Java'), repo(null)])).toEqual([
      { language: 'Java', count: 2, percent: 67 },
      { language: 'TypeScript', count: 1, percent: 33 },
    ])
  })

  it('resolveGitHubUsername defaults for blank or invalid values', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(resolveGitHubUsername(undefined)).toBe(DEFAULT_GITHUB_USERNAME)
    expect(resolveGitHubUsername('  ')).toBe(DEFAULT_GITHUB_USERNAME)
    expect(resolveGitHubUsername('-bad')).toBe(DEFAULT_GITHUB_USERNAME)
    expect(resolveGitHubUsername('good-name')).toBe('good-name')
    warn.mockRestore()
  })
})
