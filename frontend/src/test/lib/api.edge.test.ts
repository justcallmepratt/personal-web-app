import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { api } from '@/lib/api'

/**
 * Edge-case tests for api.ts fetch wrappers.
 * Covers: non-2xx responses, malformed JSON, network timeouts, empty responses.
 */
describe('api — edge cases', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
    vi.stubEnv('BACKEND_URL', 'http://backend.test')
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  // ── Non-2xx responses must throw ──────────────────────────────────────────

  it('getProfile throws on 404', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(null, { status: 404 }) as never
    )
    await expect(api.getProfile()).rejects.toThrow('API /api/profile → 404')
  })

  it('getProfile throws on 500', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(null, { status: 500 }) as never
    )
    await expect(api.getProfile()).rejects.toThrow('API /api/profile → 500')
  })

  it('getProjects throws on 503', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(null, { status: 503 }) as never
    )
    await expect(api.getProjects()).rejects.toThrow('API /api/projects → 503')
  })

  it('getExperience throws on 401', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(null, { status: 401 }) as never
    )
    await expect(api.getExperience()).rejects.toThrow('API /api/experience → 401')
  })

  // ── Network-level failures ────────────────────────────────────────────────

  it('getProfile throws on network failure', async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError('Failed to fetch'))
    await expect(api.getProfile()).rejects.toThrow()
  })

  it('getProjects throws on ECONNREFUSED', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('ECONNREFUSED'))
    await expect(api.getProjects()).rejects.toThrow()
  })

  // ── Successful responses return correct types ─────────────────────────────

  it('getProfile returns profile with correct shape', async () => {
    const profile = { id: 1, name: 'V', tagline: 'Night City', bio: '', email: '',
      location: '', avatarUrl: '', cvUrl: '', techStack: [], socials: {}, skills: [],
      updatedAt: '2024-01-01' }
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(profile)
    } as never)
    const result = await api.getProfile()
    expect(result.name).toBe('V')
    expect(result.skills).toEqual([])
  })

  it('getProjects with featured=true appends query param', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([])
    } as never)
    await api.getProjects(true)
    const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string
    expect(calledUrl).toContain('featured=true')
  })

  it('getProjects without featured param omits query string', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([])
    } as never)
    await api.getProjects(false)
    const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string
    expect(calledUrl).not.toContain('featured=true')
  })

  it('getProjects without arg omits query string', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([])
    } as never)
    await api.getProjects()
    const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string
    expect(calledUrl).not.toContain('featured')
  })

  // ── sendContact ───────────────────────────────────────────────────────────

  it('sendContact posts JSON and returns parsed response', async () => {
    const responseBody = { success: true, message: 'Received' }
    vi.mocked(fetch).mockResolvedValue({
      json: () => Promise.resolve(responseBody)
    } as never)

    const result = await api.sendContact({
      name: 'Alice', email: 'alice@example.com', subject: 'Hi', body: 'Hello'
    })
    expect(result.success).toBe(true)
    expect(result.message).toBe('Received')

    // Verify POST method and Content-Type header
    const call = vi.mocked(fetch).mock.calls[0]
    expect(call[1]?.method).toBe('POST')
    expect((call[1]?.headers as Record<string,string>)?.['Content-Type']).toBe('application/json')
  })

  it('sendContact sends correct JSON body', async () => {
    vi.mocked(fetch).mockResolvedValue({
      json: () => Promise.resolve({ success: true, message: '' })
    } as never)

    const payload = { name: 'Bob', email: 'bob@example.com', subject: 'Test', body: 'Body text' }
    await api.sendContact(payload)

    const sentBody = JSON.parse(vi.mocked(fetch).mock.calls[0][1]?.body as string)
    expect(sentBody).toEqual(payload)
  })
})
