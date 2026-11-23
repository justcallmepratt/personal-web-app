import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { ApiError, createClient, normaliseBaseUrl, parseRetryAfter, printable } from '../src/api.mjs'
import { mockApi, PROFILE } from './helpers.mjs'

// A made-up credential for the mock server only.
const USER = 'test-admin'
const PASS = 'not-a-real-password'
const TOKEN = 'mock-token-123'
const LOGIN = 'POST /api/admin/auth/login'
const LIST = 'GET /api/admin/suggestions'
const CREATE = 'POST /api/admin/suggestions'

const servers = []
after(() => Promise.all(servers.map((s) => s.close())))
async function api(routes) {
  const server = await mockApi({ [LOGIN]: { status: 200, body: { token: TOKEN } }, ...routes })
  servers.push(server)
  return server
}

/** A client whose waits are recorded instead of slept. */
function client(server, options = {}) {
  const waits = []
  const c = createClient({ baseUrl: server.url, sleep: async (ms) => void waits.push(ms), ...options })
  return { c, waits }
}

const kindOf = async (promise) => {
  try {
    await promise
  } catch (error) {
    assert.ok(error instanceof ApiError, `expected an ApiError, got ${error}`)
    return error.kind
  }
  assert.fail('expected an ApiError')
}

const SUGGESTION = {
  targetType: 'profile',
  field: 'techStack',
  proposedValue: ['Java', 'Kubernetes'],
  reason: 'A reason.',
  source: 'jobsync',
  // Fields the tool keeps for itself must not be sent.
  skill: 'Kubernetes',
  kind: 'ask',
  jobs: 3,
  of: 4,
}

test('reads the public profile without signing in', async () => {
  const server = await api({ 'GET /api/profile': { status: 200, body: PROFILE } })
  const { c } = client(server)
  assert.deepEqual(await c.getProfile(), PROFILE)
  assert.equal(server.requests[0].headers.authorization, undefined)
  assert.equal(server.count(LOGIN), 0)
})

test('profile failures are told apart', async () => {
  const none = await api({})
  assert.equal(await kindOf(client(none).c.getProfile()), 'not_found')
  const broken = await api({ 'GET /api/profile': { status: 500, body: { error: 'boom' } } })
  assert.equal(await kindOf(client(broken).c.getProfile()), 'server')
  const html = await api({ 'GET /api/profile': { status: 200, raw: '<html>maintenance</html>' } })
  assert.equal(await kindOf(client(html).c.getProfile()), 'bad_response')
  const list = await api({ 'GET /api/profile': { status: 200, body: [] } })
  assert.equal(await kindOf(client(list).c.getProfile()), 'bad_response')
})

test('signs in once, then sends the token as a bearer header', async () => {
  const server = await api({ [LIST]: { status: 200, body: [{ id: 1 }] } })
  const { c } = client(server)
  await c.signIn(USER, PASS)
  assert.deepEqual(await c.listSuggestions(), [{ id: 1 }])
  assert.deepEqual(server.requests[0].body, { username: USER, password: PASS })
  assert.equal(server.requests[1].headers.authorization, `Bearer ${TOKEN}`)
  assert.equal(server.count(LOGIN), 1)
})

test('a refused sign-in is never retried', async () => {
  const server = await api({ [LOGIN]: { status: 401, body: { error: 'Invalid credentials' } } })
  const { c, waits } = client(server)
  assert.equal(await kindOf(c.signIn(USER, 'wrong')), 'sign_in_refused')
  // A second attempt in the same run is a programming error and sends nothing.
  await assert.rejects(c.signIn(USER, PASS), /once per run/)
  assert.equal(server.count(LOGIN), 1)
  assert.deepEqual(waits, [])
  await assert.rejects(c.listSuggestions(), /Sign in before/)
})

test('a locked sign-in (429) reports the wait and is not retried', async () => {
  const server = await api({ [LOGIN]: { status: 429, headers: { 'Retry-After': '900' }, body: { error: 'Too many failed sign-in attempts.' } } })
  const { c, waits } = client(server)
  const error = await c.signIn(USER, PASS).catch((e) => e)
  assert.equal(error.kind, 'rate_limited')
  assert.equal(error.retryAfterSeconds, 900)
  assert.match(error.message, /about 15 min/)
  assert.equal(server.count(LOGIN), 1)
  assert.deepEqual(waits, [])
})

test('sign-in switched off, a server fault and a missing token are told apart', async () => {
  const off = await api({ [LOGIN]: { status: 503, body: { error: 'Admin not configured' } } })
  assert.equal(await kindOf(client(off).c.signIn(USER, PASS)), 'sign_in_off')
  const fault = await api({ [LOGIN]: { status: 500 } })
  assert.equal(await kindOf(client(fault).c.signIn(USER, PASS)), 'server')
  const empty = await api({ [LOGIN]: { status: 200, body: {} } })
  assert.equal(await kindOf(client(empty).c.signIn(USER, PASS)), 'bad_response')
  for (const server of [off, fault, empty]) assert.equal(server.count(LOGIN), 1)
})

test('an error never contains the password or the token', async () => {
  const server = await api({ [LOGIN]: { status: 401, body: { error: 'Invalid credentials' } } })
  const error = await client(server).c.signIn(USER, PASS).catch((e) => e)
  assert.ok(!JSON.stringify({ ...error, message: error.message }).includes(PASS))
})

test('a 429 on another call waits for Retry-After, then retries', async () => {
  const server = await api({
    [LIST]: [{ status: 429, headers: { 'Retry-After': '3' } }, { status: 200, body: [] }],
  })
  const { c, waits } = client(server)
  await c.signIn(USER, PASS)
  assert.deepEqual(await c.listSuggestions(), [])
  assert.deepEqual(waits, [3000])
  assert.equal(server.count(LIST), 2)
})

test('retries after 429 are bounded, and a long wait is not sat out', async () => {
  const always = await api({ [CREATE]: { status: 429, headers: { 'Retry-After': '1' } } })
  const a = client(always)
  await a.c.signIn(USER, PASS)
  assert.equal(await kindOf(a.c.createSuggestion(SUGGESTION)), 'rate_limited')
  assert.equal(always.count(CREATE), 3) // the first try and two retries
  assert.deepEqual(a.waits, [1000, 1000])

  const long = await api({ [LIST]: { status: 429, headers: { 'Retry-After': '3600' } } })
  const b = client(long)
  await b.c.signIn(USER, PASS)
  const error = await b.c.listSuggestions().catch((e) => e)
  assert.equal(error.kind, 'rate_limited')
  assert.equal(error.retryAfterSeconds, 3600)
  assert.equal(long.count(LIST), 1)
  assert.deepEqual(b.waits, [])

  // No Retry-After header: a default wait is used.
  const bare = await api({ [LIST]: [{ status: 429 }, { status: 200, body: [] }] })
  const d = client(bare)
  await d.c.signIn(USER, PASS)
  await d.c.listSuggestions()
  assert.deepEqual(d.waits, [30_000])
})

test('creates a suggestion with exactly the API\'s request fields', async () => {
  const server = await api({ [CREATE]: { status: 201, body: { id: 42, status: 'pending' } } })
  const { c } = client(server)
  await c.signIn(USER, PASS)
  assert.deepEqual(await c.createSuggestion(SUGGESTION), { created: true, id: 42 })
  const sent = server.requests.at(-1)
  assert.deepEqual(sent.body, {
    targetType: 'profile',
    field: 'techStack',
    proposedValue: ['Java', 'Kubernetes'],
    reason: 'A reason.',
    source: 'jobsync',
  })
  assert.equal(sent.headers.authorization, `Bearer ${TOKEN}`)
  assert.match(sent.headers['content-type'], /application\/json/)
})

test('a duplicate is an outcome; other refusals carry the API\'s message', async () => {
  const dup = await api({ [CREATE]: { status: 409, body: { error: 'The same change is already waiting for a decision.', code: 'duplicate' } } })
  const a = client(dup).c
  await a.signIn(USER, PASS)
  assert.deepEqual(await a.createSuggestion(SUGGESTION), { created: false, duplicate: true })

  const invalid = await api({ [CREATE]: { status: 400, body: { error: 'The proposed value is the same as the current one.', code: 'invalid' } } })
  const b = client(invalid).c
  await b.signIn(USER, PASS)
  const error = await b.createSuggestion(SUGGESTION).catch((e) => e)
  assert.equal(error.kind, 'refused')
  assert.equal(error.code, 'invalid')
  assert.match(error.message, /same as the current one/)

  const expired = await api({ [CREATE]: { status: 403 } })
  const d = client(expired).c
  await d.signIn(USER, PASS)
  assert.equal(await kindOf(d.createSuggestion(SUGGESTION)), 'unauthorized')

  const old = await api({ [LIST]: { status: 404 } })
  const e = client(old).c
  await e.signIn(USER, PASS)
  assert.equal(await kindOf(e.listSuggestions()), 'not_found')
})

test('an API that is down, or does not answer in time, is reported as such', async () => {
  const server = await mockApi({})
  const url = server.url
  await server.close()
  assert.equal(await kindOf(createClient({ baseUrl: url }).getProfile()), 'unreachable')

  const slow = await api({ 'GET /api/profile': { hang: true } })
  assert.equal(await kindOf(createClient({ baseUrl: slow.url, timeoutMs: 100 }).getProfile()), 'timeout')
})

test('a redirect is not followed', async () => {
  const elsewhere = await api({ 'GET /api/profile': { status: 200, body: PROFILE } })
  const server = await api({ 'GET /api/profile': { status: 302, headers: { Location: `${elsewhere.url}/api/profile` } } })
  const error = await client(server).c.getProfile().catch((e) => e)
  assert.equal(error.kind, 'redirect')
  assert.match(error.message, /answered GET \/api\/profile with a redirect \(302\), which this tool does not follow/)
  assert.equal(elsewhere.requests.length, 0)

  // The same on sign-in: the password is not sent on to wherever the redirect points.
  const login = await api({ [LOGIN]: { status: 307, headers: { Location: `${elsewhere.url}/api/admin/auth/login` } } })
  const { c } = client(login)
  assert.equal(await kindOf(c.signIn(USER, PASS)), 'redirect')
  assert.equal(login.count(LOGIN), 1)
  assert.equal(elsewhere.requests.length, 0)
})

test('the API address must be https, except on this machine', () => {
  assert.equal(normaliseBaseUrl('https://api.example.com/'), 'https://api.example.com')
  assert.equal(normaliseBaseUrl(' https://api.example.com/base// '), 'https://api.example.com/base')
  assert.equal(normaliseBaseUrl('http://localhost:8080'), 'http://localhost:8080')
  assert.equal(normaliseBaseUrl('http://127.0.0.1:8080/'), 'http://127.0.0.1:8080')
  for (const bad of [
    'http://api.example.com',
    'api.example.com',
    'ftp://api.example.com',
    'https://user:secret@api.example.com',
    'https://api.example.com/?x=1',
    'http://localhost.example.com',
    '',
  ]) {
    assert.throws(() => normaliseBaseUrl(bad), (error) => error instanceof ApiError && error.kind === 'bad_url', bad)
  }
})

test('Retry-After is read as seconds or as a date', () => {
  assert.equal(parseRetryAfter('120'), 120)
  assert.equal(parseRetryAfter(' 0 '), 0)
  assert.equal(parseRetryAfter('Sat, 21 Nov 2026 12:00:30 GMT', Date.parse('2026-11-21T12:00:00Z')), 30)
  assert.equal(parseRetryAfter('Sat, 21 Nov 2026 11:00:00 GMT', Date.parse('2026-11-21T12:00:00Z')), 0)
  assert.equal(parseRetryAfter('soon'), null)
  assert.equal(parseRetryAfter(''), null)
  assert.equal(parseRetryAfter(null), null)
})

// ── post-merge review fixes ─────────────────────────────────────────────────

test('a 403 on sign-in is a refused sign-in, not an expired token', async () => {
  const server = await api({ [LOGIN]: { status: 403, raw: '<html>Forbidden</html>' } })
  const { c } = client(server)
  const error = await c.signIn(USER, PASS).catch((e) => e)
  assert.equal(error.kind, 'sign_in_refused')
  assert.match(error.message, /Sign-in was refused \(403\)/)
  assert.doesNotMatch(error.message, /token|expired/)
  assert.equal(server.count(LOGIN), 1)
})

test('a failed secure connection is reported as that, with its cause', async () => {
  const failing = (code) => async () => {
    throw Object.assign(new TypeError('fetch failed'), { cause: Object.assign(new Error(code), { code }) })
  }
  for (const code of ['DEPTH_ZERO_SELF_SIGNED_CERT', 'CERT_HAS_EXPIRED', 'ERR_TLS_CERT_ALTNAME_INVALID', 'UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'ERR_SSL_WRONG_VERSION_NUMBER']) {
    const error = await createClient({ baseUrl: 'https://api.example.com', fetch: failing(code) }).getProfile().catch((e) => e)
    assert.equal(error.kind, 'tls', code)
    assert.ok(error.message.includes(code))
    assert.match(error.message, /secure connection .* failed/)
  }
  for (const code of ['ECONNREFUSED', 'ENOTFOUND', 'ECONNRESET']) {
    const error = await createClient({ baseUrl: 'https://api.example.com', fetch: failing(code) }).getProfile().catch((e) => e)
    assert.equal(error.kind, 'unreachable', code)
    assert.ok(error.message.includes(code))
  }
  const bare = await createClient({ baseUrl: 'https://api.example.com', fetch: async () => Promise.reject(new TypeError('fetch failed')) })
    .getProfile()
    .catch((e) => e)
  assert.equal(bare.kind, 'unreachable')
})

test('the server\'s error text is printed without control characters and at a bounded length', async () => {
  const hostile = `bad value\u001b[2J\u001b]0;owned\u0007\r\nFiled 3 suggestions.\u0000 ${'x'.repeat(2000)}`
  const server = await api({ [CREATE]: { status: 400, body: { error: hostile, code: 'invalid' } } })
  const { c } = client(server)
  await c.signIn(USER, PASS)
  const error = await c.createSuggestion(SUGGESTION).catch((e) => e)
  assert.equal(error.kind, 'refused')
  assert.doesNotMatch(error.message, /[\u0000-\u001f\u007f-\u009f]/)
  assert.match(error.message, /bad value \[2J \]0;owned Filed 3 suggestions\./)
  assert.ok(error.message.length < 400)

  assert.equal(printable('a b\u009bc\td'), 'a b c d')
  assert.equal(printable('  ok  '), 'ok')
  assert.equal(printable('x'.repeat(50), 10), `${'x'.repeat(9)}…`)

  // An error value that is not text, or blank, adds nothing.
  const odd = await api({ [CREATE]: { status: 400, body: { error: { nested: true } } } })
  const o = client(odd).c
  await o.signIn(USER, PASS)
  assert.match((await o.createSuggestion(SUGGESTION).catch((e) => e)).message, /refused creating a suggestion \(400\)\.$/)
})

test('a failed handshake (EPROTO) is a secure-connection failure; direction marks are stripped', async () => {
  const fetch = async () => {
    throw Object.assign(new TypeError('fetch failed'), { cause: Object.assign(new Error('x'), { code: 'EPROTO' }) })
  }
  assert.equal(await kindOf(createClient({ baseUrl: 'https://api.example.com', fetch }).getProfile()), 'tls')
  assert.equal(printable('ok‮detrevni⁩​!'), 'ok detrevni !')
})
