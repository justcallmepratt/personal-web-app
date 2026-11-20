// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const sendMail = vi.hoisted(() => vi.fn())
vi.mock('nodemailer', () => ({
  default: { createTransport: () => ({ sendMail, close: vi.fn() }) },
}))
vi.mock('node:dns/promises', () => ({ resolveMx: vi.fn().mockResolvedValue([{ exchange: 'mx' }]) }))

import { resetRateLimit, maskEmail, RELAY_TIMEOUT_MS, SMTP_TIMEOUT_MS } from '@/lib/contact'
import { POST } from '@/app/api/contact/route'

const valid = { name: 'Alice', email: 'alice@real-inbox.dev', subject: 'Secret subject', body: 'Secret body text' }

const post = (body: unknown = valid, ip = '203.0.113.7') =>
  POST(
    new Request('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'x-forwarded-for': ip },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
  )

let info: ReturnType<typeof vi.spyOn>
let warn: ReturnType<typeof vi.spyOn>
let error: ReturnType<typeof vi.spyOn>
const logged = () => [info, warn, error].flatMap((s) => s.mock.calls.map((c) => String(c[0]))).join('\n')

beforeEach(() => {
  resetRateLimit()
  sendMail.mockReset().mockResolvedValue({})
  vi.stubEnv('BACKEND_URL', 'http://backend.test')
  vi.stubEnv('MAIL_USER', 'owner@real-inbox.dev')
  vi.stubEnv('MAIL_PASS', 'test-app-password')
  info = vi.spyOn(console, 'info').mockImplementation(() => {})
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  error = vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('contact delivery: relay with SMTP fallback', () => {
  it('relays and does not touch SMTP when the backend answers', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ success: true, message: 'ok' })))
    const res = await post()
    expect(res.status).toBe(200)
    expect(sendMail).not.toHaveBeenCalled()
    expect(logged()).toContain('"outcome":"relayed"')
  })

  it('backend down + SMTP configured: delivers by SMTP and logs a fallback warning', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')))
    const res = await post()
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ success: true })
    expect(sendMail).toHaveBeenCalledOnce()
    expect(warn.mock.calls.join('')).toContain('"outcome":"fell-back"')
    expect(info.mock.calls.join('')).toContain('"outcome":"sent-smtp"')
  })

  it.each([500, 502, 503])('backend %i falls back to SMTP', async (status) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ success: false }, { status })))
    expect((await post()).status).toBe(200)
    expect(sendMail).toHaveBeenCalledOnce()
  })

  it('non-JSON backend response falls back to SMTP', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>gateway</html>', { status: 200 })))
    expect((await post()).status).toBe(200)
    expect(sendMail).toHaveBeenCalledOnce()
  })

  it('backend down + no SMTP: 503 and an undeliverable log', async () => {
    vi.stubEnv('MAIL_PASS', '')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')))
    const res = await post()
    expect(res.status).toBe(503)
    expect(await res.json()).toMatchObject({ success: false })
    expect(sendMail).not.toHaveBeenCalled()
    expect(error.mock.calls.join('')).toContain('"outcome":"undeliverable"')
  })

  it.each([
    [429, 'Too many submissions.'],
    [400, 'Invalid email format.'],
    [422, 'Disposable address.'],
  ])('backend %i is passed through with no fallback', async (status, message) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ success: false, message }, { status })))
    const res = await post()
    expect(res.status).toBe(status)
    expect(await res.json()).toEqual({ success: false, message })
    expect(sendMail).not.toHaveBeenCalled()
  })

  it('slow backend times out and falls back', async () => {
    vi.useFakeTimers()
    const fetchMock = vi.fn((_url: string, init: RequestInit) =>
      new Promise((_, reject) => {
        init.signal!.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))
      }),
    )
    vi.stubGlobal('fetch', fetchMock)
    const pending = post()
    await vi.advanceTimersByTimeAsync(RELAY_TIMEOUT_MS + 1)
    const res = await pending
    expect(res.status).toBe(200)
    expect(sendMail).toHaveBeenCalledOnce()
    expect(warn.mock.calls.join('')).toContain('backend timed out')
  })

  it('applies the handler rate limit on the fallback path only', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('down')))
    for (let i = 0; i < 3; i++) expect((await post()).status).toBe(200)
    expect((await post()).status).toBe(429)
    expect(sendMail).toHaveBeenCalledTimes(3)
  })

  it('applies the email-domain check on the fallback path', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('down')))
    const res = await post({ ...valid, email: 'bot@mailinator.com' })
    expect(res.status).toBe(422)
    expect(sendMail).not.toHaveBeenCalled()
  })

  it('SMTP rejection after fallback returns 502', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('down')))
    sendMail.mockRejectedValue(Object.assign(new Error('535 bad login'), { code: 'EAUTH' }))
    const res = await post()
    expect(res.status).toBe(502)
    expect(error.mock.calls.join('')).toContain('EAUTH')
  })

  it('a hung SMTP send is bounded and returns 502', async () => {
    vi.useFakeTimers()
    vi.stubEnv('BACKEND_URL', '')
    sendMail.mockReturnValue(new Promise(() => {}))
    const pending = post()
    await vi.advanceTimersByTimeAsync(SMTP_TIMEOUT_MS + 1)
    expect((await pending).status).toBe(502)
    expect(error.mock.calls.join('')).toContain('ETIMEOUT')
  })

  it('malformed and oversized bodies behave as before, without any outbound call', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    expect((await post('{not json')).status).toBe(400)
    expect((await post({ ...valid, email: 'nope' })).status).toBe(400)
    const big = await POST(
      new Request('http://localhost/api/contact', { method: 'POST', headers: { 'content-length': '5000000' }, body: '{}' }),
    )
    expect(big.status).toBe(413)
    expect(fetchMock).not.toHaveBeenCalled()
    expect(sendMail).not.toHaveBeenCalled()
  })

  it('never logs the body, subject, name or full email address', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('down')))
    await post()
    sendMail.mockRejectedValue(new Error('boom'))
    await post(valid, '198.51.100.1')
    const all = logged()
    for (const secret of [valid.body, valid.subject, valid.name, valid.email, 'test-app-password']) {
      expect(all).not.toContain(secret)
    }
    expect(all).toContain(maskEmail(valid.email))
  })
})
