// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET, POST } from '@/app/admin/api/suggestions/route'
import { GET as GET_TARGETS } from '@/app/admin/api/suggestions/targets/route'
import { POST as DECIDE } from '@/app/admin/api/suggestions/[id]/[decision]/route'
import { BACKEND, jsonResponse, mockFetch, suggestion, targets, timedOut, unreachable } from '../helpers'

const session = vi.hoisted(() => ({ token: undefined as string | undefined }))
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === 'admin_session' && session.token ? { name, value: session.token } : undefined,
  }),
}))

const ORIGIN = 'https://justcallmepratt.dev'

const list = (query = '') => GET(new Request(`${ORIGIN}/admin/api/suggestions${query}`))

const valid = {
  targetType: 'experience',
  targetId: 7,
  field: 'role',
  proposedValue: 'Senior Engineer',
  reason: 'Promoted in 2025',
}

const create = (body: unknown, headers: Record<string, string> = {}) =>
  POST(
    new Request(`${ORIGIN}/admin/api/suggestions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
  )

const decide = (id: string, decision: string, headers: Record<string, string> = {}) =>
  DECIDE(new Request(`${ORIGIN}/admin/api/suggestions/${id}/${decision}`, { method: 'POST', headers }), {
    params: Promise.resolve({ id, decision }),
  })

const expectCookieCleared = (res: Response) =>
  expect(res.headers.get('set-cookie')).toMatch(/admin_session=;.*Max-Age=0/i)

beforeEach(() => {
  session.token = 'jwt-123'
  vi.stubEnv('BACKEND_URL', BACKEND)
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('GET /admin/api/suggestions', () => {
  it('returns the suggestions, sending the token to the API as a bearer header', async () => {
    const all = [suggestion({ id: 2 }), suggestion({ id: 1, status: 'accepted', decidedAt: '2026-11-21T11:00:00' })]
    const fetchMock = mockFetch(() => jsonResponse(all))

    const res = await list()

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(all)
    expect(res.headers.get('cache-control')).toBe('no-store')
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(`${BACKEND}/api/admin/suggestions`)
    expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer jwt-123')
    expect(init?.signal).toBeInstanceOf(AbortSignal)
  })

  it('passes a known status filter on and returns an empty list as an empty array', async () => {
    const fetchMock = mockFetch(() => jsonResponse([]))
    const res = await list('?status=pending')
    expect(await res.json()).toEqual([])
    expect(fetchMock.mock.calls[0][0]).toBe(`${BACKEND}/api/admin/suggestions?status=pending`)
  })

  it.each(['approved', 'pending&x=1', '', '../messages'])(
    'rejects the status %j with 400 without calling the API',
    async (status) => {
      const fetchMock = mockFetch(() => jsonResponse([]))
      const res = await list(`?status=${encodeURIComponent(status)}`)
      expect(res.status).toBe(400)
      expect((await res.json()).kind).toBe('bad_request')
      expect(fetchMock).not.toHaveBeenCalled()
    },
  )

  it('answers 401 without calling the API when there is no session cookie', async () => {
    session.token = undefined
    const fetchMock = mockFetch(() => jsonResponse([]))
    const res = await list()
    expect(res.status).toBe(401)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it.each([401, 403])('treats %i from the API as signed out and clears the cookie', async (status) => {
    mockFetch(() => new Response(null, { status }))
    const res = await list()
    expect(res.status).toBe(401)
    expect((await res.json()).kind).toBe('unauthorized')
    expectCookieCleared(res)
  })

  it('reports the API being unconfigured, down, slow or restarting, keeping the session', async () => {
    vi.stubEnv('BACKEND_URL', '')
    expect((await (await list()).json()).kind).toBe('unconfigured')
    vi.stubEnv('BACKEND_URL', BACKEND)

    mockFetch(unreachable)
    const down = await list()
    expect(down.status).toBe(502)
    expect((await down.json()).kind).toBe('unreachable')
    expect(down.headers.get('set-cookie')).toBeNull()

    mockFetch(timedOut)
    const slow = await list()
    expect(slow.status).toBe(504)
    expect((await slow.json()).kind).toBe('timeout')

    mockFetch(() => new Response('<html>Application failed to respond</html>', { status: 503 }))
    const restarting = await list()
    expect(restarting.status).toBe(503)
    expect((await restarting.json()).kind).toBe('unavailable')

    mockFetch(() => jsonResponse({ success: false, message: 'Internal server error' }, 500))
    expect((await (await list()).json()).kind).toBe('error')
  })

  it.each([
    ['HTML instead of JSON', () => new Response('<html>502 Bad Gateway</html>', { status: 200 })],
    ['an object instead of an array', () => jsonResponse({ suggestions: [] })],
    ['an item without an id', () => jsonResponse([{ ...suggestion(), id: undefined }])],
    ['an item with an unknown status', () => jsonResponse([{ ...suggestion(), status: 'approved' }])],
    ['an item whose value is an object', () => jsonResponse([{ ...suggestion(), proposedValue: { a: 1 } }])],
    ['an item whose list holds a number', () => jsonResponse([{ ...suggestion(), currentValue: ['a', 2] }])],
    ['an item without a field', () => jsonResponse([{ ...suggestion(), field: null }])],
  ])('reports 502 for %s', async (_name, respond) => {
    mockFetch(respond)
    const res = await list()
    expect(res.status).toBe(502)
    expect((await res.json()).kind).toBe('bad_response')
  })

  it('coerces optional fields instead of passing unknown ones through', async () => {
    mockFetch(() =>
      jsonResponse([
        { id: 3, targetType: 'project', targetId: 2, field: 'tags', fieldKind: 'list', status: 'pending', proposedValue: ['a'], extra: 'x' },
      ]),
    )
    expect(await (await list()).json()).toEqual([
      {
        id: 3,
        targetType: 'project',
        targetId: 2,
        targetLabel: null,
        field: 'tags',
        fieldKind: 'list',
        currentValue: null,
        proposedValue: ['a'],
        reason: null,
        source: null,
        status: 'pending',
        createdAt: null,
        decidedAt: null,
      },
    ])
  })
})

describe('GET /admin/api/suggestions/targets', () => {
  it('returns the targets with their fields', async () => {
    const fetchMock = mockFetch(() => jsonResponse(targets()))
    const res = await GET_TARGETS()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(targets())
    expect(fetchMock.mock.calls[0][0]).toBe(`${BACKEND}/api/admin/suggestions/targets`)
  })

  it('answers 401 without a session, and treats 403 from the API as signed out', async () => {
    mockFetch(() => new Response(null, { status: 403 }))
    const expired = await GET_TARGETS()
    expect(expired.status).toBe(401)
    expectCookieCleared(expired)

    session.token = undefined
    const fetchMock = mockFetch(() => jsonResponse([]))
    expect((await GET_TARGETS()).status).toBe(401)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it.each([
    ['an object', () => jsonResponse({})],
    ['an unknown target type', () => jsonResponse([{ ...targets()[0], targetType: 'messages' }])],
    ['a target without fields', () => jsonResponse([{ ...targets()[0], fields: null }])],
    ['a field without a name', () => jsonResponse([{ ...targets()[0], fields: [{ kind: 'text', maxLength: 5 }] }])],
    ['a field with an unreadable value', () => jsonResponse([{ ...targets()[0], fields: [{ name: 'a', maxLength: 5, value: 3 }] }])],
  ])('reports 502 for %s', async (_name, respond) => {
    mockFetch(respond)
    const res = await GET_TARGETS()
    expect(res.status).toBe(502)
    expect((await res.json()).kind).toBe('bad_response')
  })

  it('reports the API being down or slow', async () => {
    mockFetch(unreachable)
    expect((await GET_TARGETS()).status).toBe(502)
    mockFetch(timedOut)
    expect((await GET_TARGETS()).status).toBe(504)
    mockFetch(() => new Response('x', { status: 500 }))
    expect((await (await GET_TARGETS()).json()).kind).toBe('error')
  })
})

describe('POST /admin/api/suggestions', () => {
  it('creates the suggestion through the API, always with the source "manual"', async () => {
    const created = suggestion({ id: 9 })
    const fetchMock = mockFetch(() => jsonResponse(created, 201))

    const res = await create({ ...valid, reason: '  Promoted in 2025  ', source: 'jobsync', status: 'accepted' })

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(created)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(`${BACKEND}/api/admin/suggestions`)
    expect(init?.method).toBe('POST')
    expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer jwt-123')
    // Only the known fields are forwarded; the browser cannot choose the source or a status.
    expect(JSON.parse(String(init?.body))).toEqual({ ...valid, source: 'manual' })
  })

  it('forwards a list value', async () => {
    const fetchMock = mockFetch(() => jsonResponse(suggestion({ fieldKind: 'list', proposedValue: ['a', 'b'] }), 201))
    const res = await create({ ...valid, field: 'highlights', proposedValue: ['a', 'b'] })
    expect(res.status).toBe(200)
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body)).proposedValue).toEqual(['a', 'b'])
  })

  it.each([
    ['an unknown target type', { ...valid, targetType: 'messages' }],
    ['a missing target id', { ...valid, targetId: undefined }],
    ['a target id that is not a positive integer', { ...valid, targetId: 1.5 }],
    ['a target id sent as text', { ...valid, targetId: '7' }],
    ['a field with characters that do not belong in a name', { ...valid, field: 'role/../x' }],
    ['a missing value', { ...valid, proposedValue: undefined }],
    ['a value that is a number', { ...valid, proposedValue: 5 }],
    ['text longer than the limit', { ...valid, proposedValue: 'x'.repeat(10001) }],
    ['a list with a blank item', { ...valid, proposedValue: ['a', ' '] }],
    ['a list with a non-text item', { ...valid, proposedValue: ['a', 1] }],
    ['a list item longer than the limit', { ...valid, proposedValue: ['x'.repeat(256)] }],
    ['a list with too many items', { ...valid, proposedValue: Array.from({ length: 51 }, (_, i) => `item ${i}`) }],
    ['a missing reason', { ...valid, reason: undefined }],
    ['a blank reason', { ...valid, reason: '   ' }],
    ['a reason longer than the limit', { ...valid, reason: 'r'.repeat(501) }],
    ['an array instead of an object', [valid]],
    ['null', null],
  ])('rejects %s with 400 without calling the API', async (_name, body) => {
    const fetchMock = mockFetch(() => jsonResponse({}))
    const res = await create(body)
    expect(res.status).toBe(400)
    const reply = await res.json()
    expect(reply.kind).toBe('bad_request')
    expect(reply.error).toBeTruthy()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects a body that is not JSON', async () => {
    const fetchMock = mockFetch(() => jsonResponse({}))
    const res = await create('{not json')
    expect(res.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('refuses an oversized body, declared or not', async () => {
    const fetchMock = mockFetch(() => jsonResponse({}))
    const declared = await create(valid, { 'Content-Length': String(70 * 1024) })
    expect(declared.status).toBe(413)
    expect((await declared.json()).kind).toBe('too_large')

    // Multi-byte text: under the character limit but over the byte limit.
    const actual = await create({ ...valid, reason: 'x', padding: '€'.repeat(30000) })
    expect(actual.status).toBe(413)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('refuses a request from another origin', async () => {
    const fetchMock = mockFetch(() => jsonResponse({}))
    const res = await create(valid, { Origin: 'https://evil.example', Host: 'justcallmepratt.dev' })
    expect(res.status).toBe(403)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('answers 401 without a session, and clears the cookie when the API says the token expired', async () => {
    mockFetch(() => new Response(null, { status: 403 }))
    const expired = await create(valid)
    expect(expired.status).toBe(401)
    expectCookieCleared(expired)

    session.token = undefined
    const fetchMock = mockFetch(() => jsonResponse({}))
    expect((await create(valid)).status).toBe(401)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("passes on the API's validation message", async () => {
    mockFetch(() => jsonResponse({ error: "'role' is limited to 255 characters.", code: 'invalid' }, 400))
    const res = await create(valid)
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ kind: 'invalid', error: "'role' is limited to 255 characters." })
  })

  it('falls back to its own wording when the API gives no readable message', async () => {
    mockFetch(() => new Response('<html>', { status: 400 }))
    const res = await create(valid)
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ kind: 'invalid', error: 'The API refused those values.' })
  })

  it('reports a missing target and a duplicate', async () => {
    mockFetch(() => jsonResponse({ error: 'That experience does not exist.', code: 'not_found' }, 404))
    const missing = await create(valid)
    expect(missing.status).toBe(404)
    expect(await missing.json()).toEqual({ kind: 'not_found', error: 'That experience does not exist.' })

    mockFetch(() => jsonResponse({ error: 'The same change is already waiting for a decision.', code: 'duplicate' }, 409))
    const duplicate = await create(valid)
    expect(duplicate.status).toBe(409)
    expect(await duplicate.json()).toEqual({
      kind: 'refused',
      error: 'The same change is already waiting for a decision.',
    })
  })

  it('reports unreachable, slow and unreadable answers', async () => {
    mockFetch(unreachable)
    expect((await create(valid)).status).toBe(502)
    mockFetch(timedOut)
    expect((await create(valid)).status).toBe(504)
    mockFetch(() => new Response('not json', { status: 201 }))
    expect((await (await create(valid)).json()).kind).toBe('bad_response')
    mockFetch(() => new Response('Bad Gateway', { status: 502 }))
    expect((await (await create(valid)).json()).kind).toBe('unavailable')
    // 200 is not what the API answers for a created suggestion.
    mockFetch(() => jsonResponse(suggestion(), 200))
    expect((await (await create(valid)).json()).kind).toBe('error')
  })
})

describe('POST /admin/api/suggestions/[id]/[decision]', () => {
  it.each(['accept', 'reject'] as const)('sends %s to the API and returns the updated suggestion', async (decision) => {
    const updated = suggestion({ id: 5, status: decision === 'accept' ? 'accepted' : 'rejected' })
    const fetchMock = mockFetch(() => jsonResponse(updated))

    const res = await decide('5', decision)

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(updated)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(`${BACKEND}/api/admin/suggestions/5/${decision}`)
    expect(init?.method).toBe('POST')
    expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer jwt-123')
  })

  it('reports a conflict with the value the field holds now', async () => {
    mockFetch(() =>
      jsonResponse({ error: "'role' has changed since this suggestion was made.", code: 'conflict', currentValue: 'Lead Engineer' }, 409),
    )
    const res = await decide('5', 'accept')
    expect(res.status).toBe(409)
    expect(await res.json()).toEqual({
      kind: 'conflict',
      error: "'role' has changed since this suggestion was made.",
      currentValue: 'Lead Engineer',
    })
    expect(res.headers.get('set-cookie')).toBeNull()
  })

  it('reports a conflict on a list, and one where the field is now empty', async () => {
    mockFetch(() => jsonResponse({ error: 'changed', code: 'conflict', currentValue: ['a', 'b'] }, 409))
    expect((await (await decide('5', 'accept')).json()).currentValue).toEqual(['a', 'b'])

    mockFetch(() => jsonResponse({ error: 'changed', code: 'conflict', currentValue: null }, 409))
    expect(await (await decide('5', 'accept')).json()).toEqual({ kind: 'conflict', error: 'changed', currentValue: null })

    // An unreadable live value is not passed through.
    mockFetch(() => jsonResponse({ code: 'conflict', currentValue: { a: 1 } }, 409))
    expect(await (await decide('5', 'accept')).json()).toEqual({
      kind: 'conflict',
      error: 'The content has changed since this suggestion was made, so it was not applied.',
      currentValue: null,
    })
  })

  it('reports the other refusals without a current value', async () => {
    mockFetch(() => jsonResponse({ error: 'This suggestion was already rejected.', code: 'not_pending' }, 409))
    const decided = await decide('5', 'accept')
    expect(decided.status).toBe(409)
    expect(await decided.json()).toEqual({ kind: 'refused', error: 'This suggestion was already rejected.' })

    mockFetch(() => new Response(null, { status: 409 }))
    expect(await (await decide('5', 'reject')).json()).toEqual({
      kind: 'refused',
      error: 'The API refused that for the current state of the suggestion.',
    })

    mockFetch(() => jsonResponse({ error: 'That suggestion does not exist.', code: 'not_found' }, 404))
    const gone = await decide('99', 'reject')
    expect(gone.status).toBe(404)
    expect(await gone.json()).toEqual({ kind: 'not_found', error: 'That suggestion does not exist.' })
  })

  it('cuts an over-long API message', async () => {
    mockFetch(() => jsonResponse({ error: 'x'.repeat(2000), code: 'invalid' }, 400))
    expect((await (await decide('5', 'accept')).json()).error).toHaveLength(500)
  })

  it.each(['abc', '0', '-1', '1.5', '1/../../auth/login', '99999999999999999'])(
    'rejects the id %j with 400 without calling the API',
    async (id) => {
      const fetchMock = mockFetch(() => jsonResponse({}))
      const res = await decide(id, 'accept')
      expect(res.status).toBe(400)
      expect(fetchMock).not.toHaveBeenCalled()
    },
  )

  it.each(['delete', 'ACCEPT', 'accept/../reject', ''])(
    'rejects the decision %j with 400 without calling the API',
    async (decision) => {
      const fetchMock = mockFetch(() => jsonResponse({}))
      const res = await decide('5', decision)
      expect(res.status).toBe(400)
      expect(fetchMock).not.toHaveBeenCalled()
    },
  )

  it('answers 401 without a session cookie, and treats an expired token as signed out', async () => {
    mockFetch(() => new Response(null, { status: 403 }))
    const expired = await decide('5', 'accept')
    expect(expired.status).toBe(401)
    expectCookieCleared(expired)

    session.token = undefined
    const fetchMock = mockFetch(() => jsonResponse({}))
    expect((await decide('5', 'accept')).status).toBe(401)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('refuses a request from another origin', async () => {
    const fetchMock = mockFetch(() => jsonResponse({}))
    const res = await decide('5', 'accept', { Origin: 'https://evil.example', Host: 'justcallmepratt.dev' })
    expect(res.status).toBe(403)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('reports unreachable, slow, unreadable and unconfigured', async () => {
    mockFetch(unreachable)
    expect((await decide('5', 'accept')).status).toBe(502)
    mockFetch(timedOut)
    expect((await decide('5', 'accept')).status).toBe(504)
    mockFetch(() => new Response('not json', { status: 200 }))
    expect((await (await decide('5', 'accept')).json()).kind).toBe('bad_response')
    mockFetch(() => new Response('Bad Gateway', { status: 502 }))
    expect((await (await decide('5', 'accept')).json()).kind).toBe('unavailable')
    vi.stubEnv('BACKEND_URL', '')
    expect((await decide('5', 'accept')).status).toBe(503)
  })
})
