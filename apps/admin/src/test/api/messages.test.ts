// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET } from '@/app/admin/api/messages/route'
import { PATCH } from '@/app/admin/api/messages/[id]/read/route'
import { BACKEND, jsonResponse, message, mockFetch, timedOut, unreachable } from '../helpers'

const session = vi.hoisted(() => ({ token: undefined as string | undefined }))
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === 'admin_session' && session.token ? { name, value: session.token } : undefined,
  }),
}))

const patch = (id: string, headers: Record<string, string> = {}) =>
  PATCH(
    new Request(`https://justcallmepratt.dev/admin/api/messages/${id}/read`, { method: 'PATCH', headers }),
    { params: Promise.resolve({ id }) },
  )

const expectCookieCleared = (res: Response) =>
  expect(res.headers.get('set-cookie')).toMatch(/admin_session=;.*Max-Age=0/i)

beforeEach(() => {
  session.token = 'jwt-123'
  vi.stubEnv('BACKEND_URL', BACKEND)
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('GET /admin/api/messages', () => {
  it('returns the messages, sending the token to the API as a bearer header', async () => {
    const list = [message({ id: 2 }), message({ id: 1, read: true })]
    const fetchMock = mockFetch(() => jsonResponse(list))

    const res = await GET()

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(list)
    expect(res.headers.get('cache-control')).toBe('no-store')
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(`${BACKEND}/api/admin/messages`)
    expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer jwt-123')
    expect(init?.signal).toBeInstanceOf(AbortSignal)
  })

  it('returns an empty inbox as an empty array', async () => {
    mockFetch(() => jsonResponse([]))
    const res = await GET()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([])
  })

  it('answers 401 without calling the API when there is no session cookie', async () => {
    session.token = undefined
    const fetchMock = mockFetch(() => jsonResponse([]))
    const res = await GET()
    expect(res.status).toBe(401)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it.each([401, 403])('treats %i from the API as signed out and clears the cookie', async (status) => {
    mockFetch(() => new Response(null, { status }))
    const res = await GET()
    expect(res.status).toBe(401)
    expect((await res.json()).kind).toBe('unauthorized')
    expectCookieCleared(res)
  })

  it('reports 503 when BACKEND_URL is unset', async () => {
    vi.stubEnv('BACKEND_URL', '')
    const res = await GET()
    expect(res.status).toBe(503)
    expect((await res.json()).kind).toBe('unconfigured')
  })

  it('reports 502 when the API is unreachable, keeping the session', async () => {
    mockFetch(unreachable)
    const res = await GET()
    expect(res.status).toBe(502)
    expect((await res.json()).kind).toBe('unreachable')
    expect(res.headers.get('set-cookie')).toBeNull()
  })

  it('reports 504 when the API is slower than the timeout', async () => {
    mockFetch(timedOut)
    const res = await GET()
    expect(res.status).toBe(504)
    expect((await res.json()).kind).toBe('timeout')
  })

  it.each([
    ['HTML instead of JSON', () => new Response('<html>502 Bad Gateway</html>', { status: 200 })],
    ['an object instead of an array', () => jsonResponse({ messages: [] })],
    ['items without an id', () => jsonResponse([{ subject: 'x' }])],
  ])('reports 502 for %s', async (_name, respond) => {
    mockFetch(respond)
    const res = await GET()
    expect(res.status).toBe(502)
    expect((await res.json()).kind).toBe('bad_response')
  })

  it('reports 502 for an API error status', async () => {
    mockFetch(() => jsonResponse({ success: false }, 500))
    const res = await GET()
    expect(res.status).toBe(502)
    expect((await res.json()).kind).toBe('error')
  })

  it('coerces missing optional fields instead of passing them through', async () => {
    mockFetch(() => jsonResponse([{ id: 7, read: true }]))
    expect(await (await GET()).json()).toEqual([
      { id: 7, name: null, email: null, subject: null, body: null, read: true, sentAt: null },
    ])
  })
})

describe('PATCH /admin/api/messages/[id]/read', () => {
  it('toggles the message and returns the updated one', async () => {
    const updated = message({ id: 5, read: true })
    const fetchMock = mockFetch(() => jsonResponse(updated))

    const res = await patch('5')

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(updated)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(`${BACKEND}/api/admin/messages/5/read`)
    expect(init?.method).toBe('PATCH')
    expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer jwt-123')
  })

  it('passes on 404 when the message does not exist', async () => {
    mockFetch(() => new Response(null, { status: 404 }))
    const res = await patch('99')
    expect(res.status).toBe(404)
    expect((await res.json()).kind).toBe('not_found')
    expect(res.headers.get('set-cookie')).toBeNull()
  })

  it('treats an expired token as signed out and clears the cookie', async () => {
    mockFetch(() => new Response(null, { status: 403 }))
    const res = await patch('5')
    expect(res.status).toBe(401)
    expectCookieCleared(res)
  })

  it.each(['abc', '0', '-1', '1.5', '1/../../auth/login', '99999999999999999'])(
    'rejects the id %j with 400 without calling the API',
    async (id) => {
      const fetchMock = mockFetch(() => jsonResponse({}))
      const res = await patch(id)
      expect(res.status).toBe(400)
      expect(fetchMock).not.toHaveBeenCalled()
    },
  )

  it('answers 401 without a session cookie', async () => {
    session.token = undefined
    const fetchMock = mockFetch(() => jsonResponse({}))
    const res = await patch('5')
    expect(res.status).toBe(401)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('refuses a request from another origin', async () => {
    const fetchMock = mockFetch(() => jsonResponse({}))
    const res = await patch('5', { Origin: 'https://evil.example', Host: 'justcallmepratt.dev' })
    expect(res.status).toBe(403)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('reports unreachable, slow and unreadable answers', async () => {
    mockFetch(unreachable)
    expect((await patch('5')).status).toBe(502)
    mockFetch(timedOut)
    expect((await patch('5')).status).toBe(504)
    mockFetch(() => new Response('not json', { status: 200 }))
    expect((await (await patch('5')).json()).kind).toBe('bad_response')
  })

  it('reports 503 when BACKEND_URL is unset', async () => {
    vi.stubEnv('BACKEND_URL', '')
    expect((await patch('5')).status).toBe(503)
  })
})
