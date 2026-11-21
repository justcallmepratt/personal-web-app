// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DELETE, POST } from '@/app/admin/api/session/route'
import { GET as EXPIRED } from '@/app/admin/api/session/expired/route'
import { BACKEND_TIMEOUT_MS, clearLoginBlock, DEFAULT_RETRY_AFTER_SECONDS } from '@/lib/backend'
import { BACKEND, jsonResponse, mockFetch, timedOut, tokenExpiringIn, unreachable } from '../helpers'

vi.mock('next/headers', () => ({ cookies: async () => ({ get: () => undefined }) }))

const loginRequest = (body: unknown, headers: Record<string, string> = {}) =>
  new Request('https://justcallmepratt.dev/admin/api/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })

const creds = { username: 'admin', password: 'hunter2' }

describe('POST /admin/api/session', () => {
  beforeEach(() => {
    vi.stubEnv('BACKEND_URL', BACKEND)
    vi.spyOn(console, 'error').mockImplementation(() => {})
    clearLoginBlock()
  })

  it('signs in: relays credentials and stores the token in a locked-down cookie', async () => {
    const token = tokenExpiringIn(3600)
    const fetchMock = mockFetch(() => jsonResponse({ token }))

    const res = await POST(loginRequest(creds))

    expect(res.status).toBe(200)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(`${BACKEND}/api/admin/auth/login`)
    expect(init?.method).toBe('POST')
    expect(JSON.parse(init?.body as string)).toEqual(creds)
    expect(init?.signal).toBeInstanceOf(AbortSignal)

    const cookie = res.headers.get('set-cookie') ?? ''
    expect(cookie).toContain(`admin_session=${token}`)
    expect(cookie).toMatch(/HttpOnly/i)
    expect(cookie).toMatch(/Secure/i)
    expect(cookie).toMatch(/SameSite=strict/i)
    expect(cookie).toMatch(/Path=\/admin(;|$)/)
    expect(Number(/Max-Age=(\d+)/.exec(cookie)?.[1])).toBeGreaterThan(3500)
    // The token never appears in the body the browser script can read.
    expect(await res.text()).not.toContain(token)
  })

  it('puts a timeout on the API call', async () => {
    const timeout = vi.spyOn(AbortSignal, 'timeout')
    mockFetch(() => jsonResponse({ token: tokenExpiringIn(60) }))
    await POST(loginRequest(creds))
    expect(timeout).toHaveBeenCalledWith(BACKEND_TIMEOUT_MS)
  })

  it('tolerates a trailing slash in BACKEND_URL', async () => {
    vi.stubEnv('BACKEND_URL', `${BACKEND}/`)
    const fetchMock = mockFetch(() => jsonResponse({ token: 'opaque-token' }))
    const res = await POST(loginRequest(creds))
    expect(fetchMock.mock.calls[0][0]).toBe(`${BACKEND}/api/admin/auth/login`)
    // A token without a readable expiry still works, as a session cookie.
    expect(res.headers.get('set-cookie')).not.toMatch(/Max-Age/i)
  })

  it('reports 503 without calling anything when BACKEND_URL is unset', async () => {
    vi.stubEnv('BACKEND_URL', '')
    const fetchMock = mockFetch(() => jsonResponse({}))
    const res = await POST(loginRequest(creds))
    expect(res.status).toBe(503)
    expect((await res.json()).kind).toBe('unconfigured')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('reports 502 when the API is unreachable', async () => {
    mockFetch(unreachable)
    const res = await POST(loginRequest(creds))
    expect(res.status).toBe(502)
    expect((await res.json()).kind).toBe('unreachable')
    expect(res.headers.get('set-cookie')).toBeNull()
  })

  it('reports 504 when the API is slower than the timeout', async () => {
    mockFetch(timedOut)
    const res = await POST(loginRequest(creds))
    expect(res.status).toBe(504)
    expect((await res.json()).kind).toBe('timeout')
  })

  it('reports 502 when the API answers 200 with something that is not JSON', async () => {
    mockFetch(() => new Response('<html>gateway</html>', { status: 200 }))
    const res = await POST(loginRequest(creds))
    expect(res.status).toBe(502)
    expect((await res.json()).kind).toBe('bad_response')
    expect(res.headers.get('set-cookie')).toBeNull()
  })

  it('reports 502 when the JSON has no token', async () => {
    mockFetch(() => jsonResponse({ ok: true }))
    const res = await POST(loginRequest(creds))
    expect((await res.json()).kind).toBe('bad_response')
  })

  it('passes on 401 for wrong credentials', async () => {
    mockFetch(() => jsonResponse({ error: 'Invalid credentials' }, 401))
    const res = await POST(loginRequest(creds))
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ kind: 'invalid_credentials', error: 'Wrong username or password.' })
    expect(res.headers.get('set-cookie')).toBeNull()
  })

  it('passes on 503 when the API has no admin password configured', async () => {
    mockFetch(() => jsonResponse({ error: 'Admin not configured' }, 503))
    const res = await POST(loginRequest(creds))
    expect(res.status).toBe(503)
    const body = await res.json()
    expect(body.kind).toBe('admin_not_configured')
    // Says sign-in is off, and that the password was not the problem.
    expect(body.error).toMatch(/not switched on yet/i)
    expect(body.error).toMatch(/not a wrong password/i)
    expect(res.headers.get('set-cookie')).toBeNull()
  })

  it.each([
    ['a 503 page from the API host', () => new Response('<html>Application failed to respond</html>', { status: 503 })],
    ['a 503 with some other JSON', () => jsonResponse({ error: 'Service Unavailable' }, 503)],
    ['a 502 from the API host', () => new Response('Bad Gateway', { status: 502 })],
    ['a 504 from the API host', () => new Response('', { status: 504 })],
  ])('reports the API as unavailable, not as "sign-in off", for %s', async (_name, respond) => {
    mockFetch(respond)
    const res = await POST(loginRequest(creds))
    expect(res.status).toBe(503)
    expect((await res.json()).kind).toBe('unavailable')
  })

  it('passes on 429 with the wait from Retry-After', async () => {
    mockFetch(
      () =>
        new Response(JSON.stringify({ error: 'Too many failed sign-in attempts. Try again later.' }), {
          status: 429,
          headers: { 'Content-Type': 'application/json', 'Retry-After': '900' },
        }),
    )
    const res = await POST(loginRequest(creds))
    expect(res.status).toBe(429)
    expect(res.headers.get('retry-after')).toBe('900')
    expect(await res.json()).toMatchObject({ kind: 'rate_limited', retryAfter: 900 })
    expect(res.headers.get('set-cookie')).toBeNull()
  })

  it.each([
    ['no Retry-After header', undefined, DEFAULT_RETRY_AFTER_SECONDS],
    ['an unreadable Retry-After', 'soon', DEFAULT_RETRY_AFTER_SECONDS],
    ['a Retry-After of zero', '0', 1],
    ['an absurdly long Retry-After', '999999', 3600],
    ['a Retry-After given as a date', new Date(Date.now() + 120_000).toUTCString(), 120],
  ])('handles a 429 with %s', async (_name, header, expected) => {
    mockFetch(() => new Response('', { status: 429, headers: header === undefined ? {} : { 'Retry-After': header } }))
    const res = await POST(loginRequest(creds))
    expect(res.status).toBe(429)
    const { retryAfter } = await res.json()
    // A date header loses up to a second to rounding.
    expect(retryAfter).toBeGreaterThanOrEqual(expected - 1)
    expect(retryAfter).toBeLessThanOrEqual(expected)
  })

  it('stops calling the API while it is rate limited, then resumes', async () => {
    const token = tokenExpiringIn(60)
    let limited = true
    const fetchMock = mockFetch(() =>
      limited ? new Response('', { status: 429, headers: { 'Retry-After': '60' } }) : jsonResponse({ token }),
    )
    const start = Date.now()
    const clock = vi.spyOn(Date, 'now').mockReturnValue(start)

    expect((await POST(loginRequest(creds))).status).toBe(429)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    // 20 s later: answered here with the remaining wait, without reaching the API.
    clock.mockReturnValue(start + 20_000)
    const again = await POST(loginRequest(creds))
    expect(again.status).toBe(429)
    expect((await again.json()).retryAfter).toBe(40)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    // After the wait the next attempt goes through.
    limited = false
    clock.mockReturnValue(start + 60_000)
    expect((await POST(loginRequest(creds))).status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('treats a 403 on sign-in as an API error, not as a session', async () => {
    mockFetch(() => jsonResponse({ status: 403, error: 'Forbidden' }, 403))
    const res = await POST(loginRequest(creds))
    expect(res.status).toBe(502)
    expect((await res.json()).kind).toBe('error')
  })

  it('reports 502 for any other API status', async () => {
    mockFetch(() => jsonResponse({ success: false, message: 'Internal server error' }, 500))
    const res = await POST(loginRequest(creds))
    expect(res.status).toBe(502)
    expect((await res.json()).kind).toBe('error')
  })

  it('rejects an oversized body by Content-Length before reading it', async () => {
    const fetchMock = mockFetch(() => jsonResponse({}))
    const request = loginRequest(creds, { 'Content-Length': '1000000' })
    const text = vi.spyOn(request, 'text')
    const res = await POST(request)
    expect(res.status).toBe(413)
    expect(text).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects an oversized body that arrives without a Content-Length', async () => {
    const fetchMock = mockFetch(() => jsonResponse({}))
    const res = await POST(loginRequest({ username: 'a', password: 'x'.repeat(5000) }))
    expect(res.status).toBe(413)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it.each([
    ['malformed JSON', '{nope'],
    ['a missing password', { username: 'admin' }],
    ['non-string fields', { username: 1, password: true }],
    ['an over-long username', { username: 'u'.repeat(300), password: 'p' }],
    ['a JSON null', 'null'],
  ])('rejects %s with 400 without calling the API', async (_name, body) => {
    const fetchMock = mockFetch(() => jsonResponse({}))
    const res = await POST(loginRequest(body))
    expect(res.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('refuses a request from another origin', async () => {
    const fetchMock = mockFetch(() => jsonResponse({}))
    const res = await POST(loginRequest(creds, { Origin: 'https://evil.example', Host: 'justcallmepratt.dev' }))
    expect(res.status).toBe(403)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('accepts a same-origin request, also when the public host is forwarded', async () => {
    mockFetch(() => jsonResponse({ token: 't' }))
    const direct = await POST(loginRequest(creds, { Origin: 'https://justcallmepratt.dev', Host: 'justcallmepratt.dev' }))
    expect(direct.status).toBe(200)
    const proxied = await POST(
      loginRequest(creds, {
        Origin: 'https://justcallmepratt.dev',
        Host: 'admin-internal.vercel.app',
        'X-Forwarded-Host': 'justcallmepratt.dev',
      }),
    )
    expect(proxied.status).toBe(200)
  })
})

describe('DELETE /admin/api/session', () => {
  it('clears the cookie without calling the API', async () => {
    const fetchMock = mockFetch(() => jsonResponse({}))
    const res = await DELETE(new Request('https://justcallmepratt.dev/admin/api/session', { method: 'DELETE' }))
    expect(res.status).toBe(200)
    const cookie = res.headers.get('set-cookie') ?? ''
    expect(cookie).toMatch(/admin_session=;/)
    expect(cookie).toMatch(/Max-Age=0/i)
    expect(cookie).toMatch(/Path=\/admin(;|$)/)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('refuses a request from another origin', async () => {
    const res = await DELETE(
      new Request('https://justcallmepratt.dev/admin/api/session', {
        method: 'DELETE',
        headers: { Origin: 'null', Host: 'justcallmepratt.dev' },
      }),
    )
    expect(res.status).toBe(403)
  })
})

describe('GET /admin/api/session/expired', () => {
  it('clears the cookie and redirects to the login page', async () => {
    const res = await EXPIRED(new Request('https://justcallmepratt.dev/admin/api/session/expired'))
    expect(res.status).toBe(303)
    expect(res.headers.get('location')).toBe('https://justcallmepratt.dev/admin/login?reason=expired')
    expect(res.headers.get('set-cookie')).toMatch(/admin_session=;.*Max-Age=0/i)
  })
})
