// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const sendMail = vi.hoisted(() => vi.fn())
vi.mock('nodemailer', () => ({ default: { createTransport: () => ({ sendMail }) } }))
vi.mock('node:dns/promises', () => ({ resolveMx: vi.fn().mockResolvedValue([{ exchange: 'mx' }]) }))

import { isRateLimited, resetRateLimit, validateEmailDomain, validatePayload } from '@/lib/contact'
import { POST } from '@/app/api/contact/route'

const valid = { name: 'Alice', email: 'alice@real-inbox.dev', subject: 'Hi', body: 'Hello there' }

const post = (body: unknown, ip = '203.0.113.7') =>
  POST(
    new Request('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'x-forwarded-for': ip },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
  )

beforeEach(() => {
  resetRateLimit()
  sendMail.mockReset().mockResolvedValue({})
  vi.stubEnv('MAIL_USER', 'owner@real-inbox.dev')
  vi.stubEnv('MAIL_PASS', 'test-app-password')
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('validatePayload', () => {
  it('accepts a complete payload and trims fields', () => {
    const r = validatePayload({ ...valid, name: '  Alice  ' })
    expect(r).toEqual({ ok: true, value: valid })
  })

  it.each(['name', 'email', 'subject', 'body'])('rejects a missing %s', (field) => {
    const r = validatePayload({ ...valid, [field]: '   ' })
    expect(r).toMatchObject({ ok: false, status: 400 })
  })

  it('rejects non-objects, bad emails and oversized bodies', () => {
    expect(validatePayload(null).ok).toBe(false)
    expect(validatePayload({ ...valid, email: 'not-an-email' }).ok).toBe(false)
    expect(validatePayload({ ...valid, body: 'x'.repeat(2001) }).ok).toBe(false)
  })
})

describe('validateEmailDomain', () => {
  const mx = (records: unknown[]) => () => Promise.resolve(records)

  it('accepts a domain with MX records', async () => {
    expect((await validateEmailDomain(valid.email, mx([{}]))).ok).toBe(true)
  })

  it('rejects disposable domains without a DNS lookup', async () => {
    const lookup = vi.fn()
    const r = await validateEmailDomain('x@Mailinator.com', lookup)
    expect(r).toMatchObject({ ok: false, status: 422 })
    expect(lookup).not.toHaveBeenCalled()
  })

  it('rejects domains with no MX records or that do not exist', async () => {
    expect((await validateEmailDomain(valid.email, mx([]))).ok).toBe(false)
    const notFound = () => Promise.reject(Object.assign(new Error('nx'), { code: 'ENOTFOUND' }))
    expect((await validateEmailDomain(valid.email, notFound)).ok).toBe(false)
  })

  it('fails open when DNS times out', async () => {
    const timeout = () => Promise.reject(Object.assign(new Error('t'), { code: 'ETIMEOUT' }))
    expect((await validateEmailDomain(valid.email, timeout)).ok).toBe(true)
  })
})

describe('isRateLimited', () => {
  it('allows max hits per window, then blocks until the window passes', () => {
    const hour = 3600_000
    expect([0, 1, 2].map((t) => isRateLimited('ip', t, 3, hour))).toEqual([false, false, false])
    expect(isRateLimited('ip', 3, 3, hour)).toBe(true)
    expect(isRateLimited('other', 3, 3, hour)).toBe(false)
    expect(isRateLimited('ip', hour + 3, 3, hour)).toBe(false)
  })
})

describe('POST /api/contact', () => {
  it('sends mail and returns success', async () => {
    const res = await post(valid)
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ success: true })
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'owner@real-inbox.dev',
        replyTo: valid.email,
        subject: '[Resume Contact] Hi',
      }),
    )
  })

  it('strips newlines from the subject header', async () => {
    await post({ ...valid, subject: 'Hi\r\nBcc: evil@x.dev' })
    expect(sendMail.mock.calls[0][0].subject).toBe('[Resume Contact] Hi Bcc: evil@x.dev')
  })

  it('returns 400 for malformed JSON and invalid payloads', async () => {
    expect((await post('{not json')).status).toBe(400)
    expect((await post({ ...valid, email: 'nope' })).status).toBe(400)
    expect(sendMail).not.toHaveBeenCalled()
  })

  it('returns 413 for an oversized request without reading it', async () => {
    const res = await POST(
      new Request('http://localhost/api/contact', {
        method: 'POST',
        headers: { 'content-length': '5000000' },
        body: '{}',
      }),
    )
    expect(res.status).toBe(413)
  })

  it('returns 429 after three submissions from one address', async () => {
    for (let i = 0; i < 3; i++) expect((await post(valid)).status).toBe(200)
    expect((await post(valid)).status).toBe(429)
    expect((await post(valid, '198.51.100.9')).status).toBe(200)
  })

  it('returns 503 when mail is not configured', async () => {
    vi.stubEnv('MAIL_PASS', '')
    const res = await post(valid)
    expect(res.status).toBe(503)
    expect(await res.json()).toMatchObject({ success: false })
    expect(sendMail).not.toHaveBeenCalled()
  })

  it('returns 502 when SMTP delivery fails', async () => {
    sendMail.mockRejectedValue(new Error('smtp down'))
    expect((await post(valid)).status).toBe(502)
  })
})

describe('POST /api/contact with BACKEND_URL', () => {
  beforeEach(() => {
    vi.stubEnv('BACKEND_URL', 'http://backend.test')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('relays the validated payload and client address, and returns the backend reply', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({ success: false, message: 'Too many submissions.' }, { status: 429 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const res = await post({ ...valid, name: '  Alice ' }, '198.51.100.9')

    expect(res.status).toBe(429)
    expect(await res.json()).toEqual({ success: false, message: 'Too many submissions.' })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('http://backend.test/api/contact')
    expect(init.headers['X-Forwarded-For']).toBe('198.51.100.9')
    expect(JSON.parse(init.body)).toEqual(valid)
    expect(sendMail).not.toHaveBeenCalled()
  })

  it('still rejects invalid payloads without calling the backend', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    expect((await post({ ...valid, email: 'nope' })).status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns 502 when the backend is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')))
    const res = await post(valid)
    expect(res.status).toBe(502)
    expect(await res.json()).toMatchObject({ success: false })
  })
})
