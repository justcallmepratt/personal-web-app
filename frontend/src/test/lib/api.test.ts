import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { api } from '@/lib/api'
import type { Profile, Project, Experience } from '@/lib/types'
import { certifications } from '@/content'

function mockFetch(data: unknown, ok = true) {
  return vi.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 500,
    json: () => Promise.resolve(data),
  })
}

describe('api — remote source (BACKEND_URL set)', () => {
  beforeEach(() => {
    vi.stubEnv('BACKEND_URL', 'http://backend.test')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('getProfile resolves to a Profile', async () => {
    const profile: Partial<Profile> = { id: 1, name: 'Remote Name', tagline: 'From the API' }
    vi.stubGlobal('fetch', mockFetch(profile))

    const result = await api.getProfile()
    expect(result.name).toBe('Remote Name')
  })

  it('getProjects resolves to array of projects', async () => {
    const projects: Partial<Project>[] = [{ id: 1, title: 'Remote Project' }]
    vi.stubGlobal('fetch', mockFetch(projects))

    const result = await api.getProjects()
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Remote Project')
  })

  it('getProjects with featured=true passes correct query param', async () => {
    const fetchMock = mockFetch([])
    vi.stubGlobal('fetch', fetchMock)

    await api.getProjects(true)
    const calledUrl = (fetchMock.mock.calls[0] as [string])[0]
    expect(calledUrl).toContain('?featured=true')
  })

  it('getExperience resolves to array', async () => {
    const exp: Partial<Experience>[] = [{ id: 1, company: 'Acme' }]
    vi.stubGlobal('fetch', mockFetch(exp))

    const result = await api.getExperience()
    expect(result).toHaveLength(1)
    expect(result[0].company).toBe('Acme')
  })

  it('sendContact calls POST with correct body', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ success: true, message: 'OK' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await api.sendContact({ name: 'Alice', email: 'alice@example.com', subject: 'Hi', body: 'Hello' })

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/contact'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('Alice'),
      })
    )
  })

  it('getCertifications reads repo content and never calls the API', async () => {
    const fetchMock = mockFetch([])
    vi.stubGlobal('fetch', fetchMock)

    const result = await api.getCertifications()
    expect(result).toHaveLength(certifications.length)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('falls back to repo content on a non-ok response from GET', async () => {
    vi.stubGlobal('fetch', mockFetch({ error: 'not found' }, false))
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const result = await api.getProfile()
    expect(result.skills.length).toBeGreaterThan(0)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('/api/profile → 500'))
    warn.mockRestore()
  })
})

describe('api — local content (no BACKEND_URL)', () => {
  beforeEach(() => {
    vi.stubEnv('BACKEND_URL', '')
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('serves profile, projects and experience without calling fetch', async () => {
    const [profile, projects, experience] = await Promise.all([
      api.getProfile(),
      api.getProjects(),
      api.getExperience(),
    ])
    expect(profile.name).toBeTruthy()
    expect(projects.length).toBeGreaterThan(0)
    expect(experience.length).toBeGreaterThan(0)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('getCertifications resolves to the repo list in sortOrder, each with a name and issuer', async () => {
    const result = await api.getCertifications()
    expect(result.length).toBeGreaterThan(0)
    for (const c of result) {
      expect(c.name).toBeTruthy()
      expect(c.issuer).toBeTruthy()
    }
    const orders = result.map((c) => c.sortOrder ?? 0)
    expect(orders).toEqual([...orders].sort((a, b) => a - b))
    expect(result).not.toBe(certifications)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('getProjects(true) returns only featured projects', async () => {
    const all = await api.getProjects()
    const featured = await api.getProjects(true)
    expect(featured.length).toBeGreaterThan(0)
    expect(featured.length).toBeLessThan(all.length)
    expect(featured.every((p) => p.featured)).toBe(true)
  })

  it('returns projects and experience in sortOrder', async () => {
    for (const items of [await api.getProjects(), await api.getExperience()]) {
      const orders = items.map((i) => i.sortOrder)
      expect(orders).toEqual([...orders].sort((a, b) => a - b))
    }
  })
})
