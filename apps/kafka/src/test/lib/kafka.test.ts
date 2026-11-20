// @vitest-environment node
import { NextRequest } from 'next/server'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { isRateLimited, resetRateLimit } from '@/lib/rate-limit'
import { kafkaDemoUrl, scopedKey, sessionRecords, validateProduce } from '@/lib/kafka'
import { POST } from '@/app/kafka/api/produce/route'
import { GET } from '@/app/kafka/api/messages/route'

const SID = 'a1b2c3d4e5f60718'
const OTHER = 'ffffffffffffffff'
const UPSTREAM = 'http://kafka-demo.test'

const fetchMock = vi.fn()

const produce = (body: unknown, headers: Record<string, string> = {}) =>
  POST(
    new Request('http://localhost/kafka/api/produce', {
      method: 'POST',
      headers: { 'x-forwarded-for': '203.0.113.7', ...headers },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
  )

const read = (query: string, ip = '203.0.113.7') =>
  GET(new NextRequest(`http://localhost/kafka/api/messages${query}`, { headers: { 'x-forwarded-for': ip } }))

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })

beforeEach(() => {
  resetRateLimit()
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  vi.stubEnv('KAFKA_DEMO_URL', `${UPSTREAM}/`)
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('isRateLimited', () => {
  it('allows up to the limit inside the window, then blocks', () => {
    expect(isRateLimited('a', 0, 2, 1000)).toBe(false)
    expect(isRateLimited('a', 10, 2, 1000)).toBe(false)
    expect(isRateLimited('a', 20, 2, 1000)).toBe(true)
    expect(isRateLimited('b', 20, 2, 1000)).toBe(false)
  })

  it('forgets hits older than the window', () => {
    expect(isRateLimited('a', 0, 1, 1000)).toBe(false)
    expect(isRateLimited('a', 500, 1, 1000)).toBe(true)
    expect(isRateLimited('a', 1001, 1, 1000)).toBe(false)
  })
})

describe('kafkaDemoUrl', () => {
  it('strips trailing slashes', () => {
    expect(kafkaDemoUrl()).toBe(UPSTREAM)
  })

  it('is null when unset or empty', () => {
    vi.stubEnv('KAFKA_DEMO_URL', '')
    expect(kafkaDemoUrl()).toBeNull()
  })
})

describe('validateProduce', () => {
  it('accepts a message with a key and trims both', () => {
    expect(validateProduce({ sid: SID, key: ' k ', message: '  hi  ' })).toEqual({
      ok: true,
      value: { sid: SID, key: 'k', message: 'hi' },
    })
  })

  it('treats a missing key as empty', () => {
    expect(validateProduce({ sid: SID, message: 'hi' })).toMatchObject({ value: { key: '' } })
  })

  it('flattens control characters and newlines', () => {
    expect(validateProduce({ sid: SID, message: 'a\r\nb\u0000c' })).toMatchObject({
      value: { message: 'a b c' },
    })
  })

  it.each([
    ['a non-object', 'nope'],
    ['null', null],
    ['a missing session', { message: 'hi' }],
    ['a malformed session', { sid: 'XYZ', message: 'hi' }],
    ['an empty message', { sid: SID, message: '   ' }],
    ['a non-string message', { sid: SID, message: 42 }],
    ['an oversized message', { sid: SID, message: 'x'.repeat(281) }],
    ['an oversized key', { sid: SID, key: 'k'.repeat(65), message: 'hi' }],
  ])('rejects %s', (_name, input) => {
    expect(validateProduce(input)).toMatchObject({ ok: false, status: 400 })
  })
})

describe('sessionRecords', () => {
  const record = (key: unknown, content: unknown = 'hi', extra: object = {}) => ({
    id: 'r1',
    key,
    content,
    timestamp: '2026-01-01T12:00:00',
    topic: 'demo-topic',
    ...extra,
  })

  it('returns only the session records, with the key un-scoped', () => {
    const out = sessionRecords([record(`${SID}:order-1`), record(`${OTHER}:secret`)], SID)
    expect(out).toEqual([
      { id: 'r1', key: 'order-1', content: 'hi', timestamp: '2026-01-01T12:00:00', topic: 'demo-topic' },
    ])
  })

  it('keeps colons that are part of the visitor key', () => {
    expect(sessionRecords([record(`${SID}:a:b`)], SID)[0].key).toBe('a:b')
  })

  it('skips unkeyed and malformed entries', () => {
    expect(sessionRecords([null, 'x', record(null), record(`${SID}:k`, 7)], SID)).toEqual([])
  })

  it('fills in a missing id, timestamp and topic', () => {
    const out = sessionRecords([{ key: `${SID}:`, content: 'hi' }], SID)
    expect(out).toEqual([{ id: 'undefined-0', key: '', content: 'hi', timestamp: '', topic: '' }])
  })

  it('throws when the service does not return a list', () => {
    expect(() => sessionRecords({ error: 'boom' }, SID)).toThrow()
  })
})

describe('POST /api/kafka/produce', () => {
  it('relays the record with a session-scoped key', async () => {
    fetchMock.mockResolvedValue(json({ status: 'Message sent successfully' }))
    const res = await produce({ sid: SID, key: 'order-1', message: 'hi' })

    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ success: true })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(`${UPSTREAM}/api/kafka/produce`)
    expect(JSON.parse(init.body)).toEqual({ key: scopedKey(SID, 'order-1'), message: 'hi' })
    expect(init.headers).toEqual({ 'Content-Type': 'application/json' })
  })

  it('sends the shared secret when one is configured', async () => {
    vi.stubEnv('KAFKA_DEMO_TOKEN', 'test-token')
    fetchMock.mockResolvedValue(json({}))
    await produce({ sid: SID, message: 'hi' })
    expect(fetchMock.mock.calls[0][1].headers).toEqual({
      'Content-Type': 'application/json',
      'X-Demo-Token': 'test-token',
    })
  })

  it('is 503 without calling anything when the demo is not configured', async () => {
    vi.stubEnv('KAFKA_DEMO_URL', '')
    const res = await produce({ sid: SID, message: 'hi' })
    expect(res.status).toBe(503)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects an oversized body before reading it', async () => {
    const res = await produce({ sid: SID, message: 'hi' }, { 'content-length': '5000' })
    expect(res.status).toBe(413)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects malformed JSON', async () => {
    expect((await produce('{nope')).status).toBe(400)
  })

  it('rejects an invalid payload without calling the service', async () => {
    const res = await produce({ sid: SID, message: '' })
    expect(res.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('limits each address to 20 records a minute', async () => {
    fetchMock.mockImplementation(async () => json({}))
    for (let i = 0; i < 20; i++) expect((await produce({ sid: SID, message: 'hi' })).status).toBe(200)
    expect((await produce({ sid: SID, message: 'hi' })).status).toBe(429)
    expect(fetchMock).toHaveBeenCalledTimes(20)
  })

  it('is 502 when the service errors', async () => {
    fetchMock.mockResolvedValue(json({ error: 'boom' }, 500))
    expect((await produce({ sid: SID, message: 'hi' })).status).toBe(502)
  })

  it('is 502 when the service is unreachable', async () => {
    fetchMock.mockRejectedValue(new Error('ECONNREFUSED'))
    const res = await produce({ sid: SID, message: 'hi' })
    expect(res.status).toBe(502)
    expect(await res.json()).toMatchObject({ success: false })
  })
})

describe('GET /api/kafka/messages', () => {
  it('returns only the session records and is never cached', async () => {
    fetchMock.mockResolvedValue(
      json([
        { id: '1', key: `${SID}:k`, content: 'mine', timestamp: '2026-01-01T12:00:00', topic: 't' },
        { id: '2', key: `${OTHER}:k`, content: 'theirs', timestamp: '2026-01-01T12:00:01', topic: 't' },
      ]),
    )
    const res = await read(`?sid=${SID}`)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(res.headers.get('cache-control')).toBe('no-store')
    expect(body.records).toHaveLength(1)
    expect(body.records[0]).toMatchObject({ key: 'k', content: 'mine' })
    expect(fetchMock.mock.calls[0][0]).toBe(`${UPSTREAM}/api/kafka/messages`)
  })

  it('sends the shared secret when one is configured', async () => {
    vi.stubEnv('KAFKA_DEMO_TOKEN', 'test-token')
    fetchMock.mockResolvedValue(json([]))
    await read(`?sid=${SID}`)
    expect(fetchMock.mock.calls[0][1].headers).toEqual({ 'X-Demo-Token': 'test-token' })
  })

  it('is 503 when the demo is not configured', async () => {
    vi.stubEnv('KAFKA_DEMO_URL', '')
    expect((await read(`?sid=${SID}`)).status).toBe(503)
  })

  it.each(['', '?sid=nope', `?sid=${SID}0`])('rejects a bad session (%s)', async (query) => {
    const res = await read(query)
    expect(res.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('limits each address to 120 reads a minute', async () => {
    fetchMock.mockImplementation(async () => json([]))
    for (let i = 0; i < 120; i++) await read(`?sid=${SID}`)
    expect((await read(`?sid=${SID}`)).status).toBe(429)
    expect((await read(`?sid=${SID}`, '198.51.100.9')).status).toBe(200)
  })

  it('is 502 when the service errors, is unreachable or returns the wrong shape', async () => {
    fetchMock.mockResolvedValueOnce(json({}, 500))
    expect((await read(`?sid=${SID}`)).status).toBe(502)
    fetchMock.mockRejectedValueOnce(new Error('timeout'))
    expect((await read(`?sid=${SID}`)).status).toBe(502)
    fetchMock.mockResolvedValueOnce(json({ not: 'a list' }))
    const res = await read(`?sid=${SID}`)
    expect(res.status).toBe(502)
    expect((await res.json()).records).toEqual([])
  })
})
