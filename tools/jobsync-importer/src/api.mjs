// The site's API, as far as this tool uses it: the public profile, one sign-in, and the
// suggestion endpoints. Request and response shapes are the API's own (SuggestionController,
// SuggestionRequest, SuggestionResponse, AdminController in backend/); nothing here changes them.
//
// Rules this client keeps:
// - One sign-in request per run. A refused or rate-limited sign-in is never tried again:
//   the API counts failures (5 per client, 30 overall per 15 minutes) and locks out.
// - A 429 on any other call waits for Retry-After and retries a bounded number of times.
// - The password and the token are held in memory only and never written or logged.

/** A failed call. `kind` is stable; `message` is for people and never holds a secret. */
export class ApiError extends Error {
  /**
   * @param {'bad_url'|'unreachable'|'tls'|'redirect'|'timeout'|'bad_response'|'not_found'|'sign_in_refused'
   *   |'sign_in_off'|'rate_limited'|'unauthorized'|'refused'|'server'} kind
   * @param {string} message
   * @param {{status?: number, retryAfterSeconds?: number, code?: string}} [details]
   */
  constructor(kind, message, details = {}) {
    super(message)
    this.name = 'ApiError'
    this.kind = kind
    Object.assign(this, details)
  }
}

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])

/**
 * Checks the API address. HTTPS is required, because a password travels to it; plain HTTP
 * is allowed only for this machine (local development and tests).
 * @param {string} text
 * @returns {string} the address without a trailing slash
 */
export function normaliseBaseUrl(text) {
  let url
  try {
    url = new URL(String(text).trim())
  } catch {
    throw new ApiError('bad_url', 'The API address is not a URL. Use the form https://host.')
  }
  if (url.username || url.password) throw new ApiError('bad_url', 'The API address must not contain a username or password.')
  if (url.search || url.hash) throw new ApiError('bad_url', 'The API address must not contain a query or fragment.')
  const local = LOCAL_HOSTS.has(url.hostname)
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && local)) {
    throw new ApiError('bad_url', 'The API address must use https (http is allowed only for localhost).')
  }
  return `${url.origin}${url.pathname.replace(/\/+$/, '')}`
}

/** Retry-After as seconds: a number of seconds or an HTTP date. Null when absent or unreadable. */
export function parseRetryAfter(value, now = Date.now()) {
  if (typeof value !== 'string' || value.trim() === '') return null
  const text = value.trim()
  if (/^\d+$/.test(text)) return Number(text)
  const date = Date.parse(text)
  return Number.isNaN(date) ? null : Math.max(0, Math.ceil((date - now) / 1000))
}

/** Error codes Node reports when the secure connection itself fails (certificate or handshake). */
const TLS_FAILURE = /CERT|TLS|SSL|SELF_SIGNED|UNABLE_TO_VERIFY|UNABLE_TO_GET_ISSUER|EPROTO/

/**
 * Text from the server made safe to print: control characters (line breaks, terminal
 * escape codes) become spaces and the length is bounded.
 */
export function printable(text, max = 300) {
  const clean = String(text)
    .replace(/[\u0000-\u001f\u007f-\u009f\u061c\u200b-\u200f\u2028-\u202e\u2060-\u2069\ufeff]+/g, ' ')
    .trim()
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean
}

const defaultSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * @param {object} options
 * @param {string} options.baseUrl
 * @param {typeof fetch} [options.fetch]
 * @param {(ms: number) => Promise<void>} [options.sleep]
 * @param {number} [options.timeoutMs] per request
 * @param {number} [options.maxRetries] retries after a 429, per call (never for sign-in)
 * @param {number} [options.maxWaitSeconds] longest Retry-After this run will sit out
 * @param {(line: string) => void} [options.log]
 */
export function createClient({
  baseUrl,
  fetch: fetchImpl = globalThis.fetch,
  sleep = defaultSleep,
  timeoutMs = 10_000,
  maxRetries = 2,
  maxWaitSeconds = 120,
  log = () => {},
}) {
  const base = normaliseBaseUrl(baseUrl)
  let token = null
  let signInAttempted = false

  /** One HTTP exchange. Returns the status, headers and parsed JSON body (null if none or not JSON). */
  async function exchange(method, path, { body, auth = false } = {}) {
    const headers = { Accept: 'application/json' }
    if (body !== undefined) headers['Content-Type'] = 'application/json'
    if (auth) headers.Authorization = `Bearer ${token}`
    let response
    try {
      response = await fetchImpl(`${base}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        // Never followed: a redirect could carry the token or password to another host.
        // "manual" hands back the 3xx answer itself, so it can be reported for what it is.
        redirect: 'manual',
        signal: AbortSignal.timeout(timeoutMs),
      })
    } catch (error) {
      if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
        throw new ApiError('timeout', `The API did not answer within ${timeoutMs / 1000} s (${method} ${path}).`)
      }
      const code = typeof error?.cause?.code === 'string' ? error.cause.code : ''
      if (TLS_FAILURE.test(code)) {
        throw new ApiError(
          'tls',
          `The secure connection to ${base} failed (${code}): the certificate or the handshake was not accepted. Nothing was sent (${method} ${path}).`,
        )
      }
      throw new ApiError(
        'unreachable',
        `The API could not be reached at ${base} (${method} ${path}${code ? `, ${code}` : ''}). It may be down, or the address is wrong.`,
      )
    }
    if ((response.status >= 300 && response.status < 400) || response.type === 'opaqueredirect') {
      // Drain and drop the body; the answer is not used.
      await response.body?.cancel().catch(() => {})
      throw new ApiError(
        'redirect',
        `The API answered ${method} ${path} with a redirect (${response.status}), which this tool does not follow. ` +
          'Check the API address: give the final https address, not one that forwards elsewhere.',
        { status: response.status },
      )
    }
    let parsed = null
    try {
      const text = await response.text()
      if (text !== '') parsed = JSON.parse(text)
    } catch {
      parsed = null
    }
    return { status: response.status, headers: response.headers, body: parsed }
  }

  /** An exchange that waits out 429s, within the limits. Not used for sign-in. */
  async function call(method, path, options) {
    for (let attempt = 0; ; attempt++) {
      const result = await exchange(method, path, options)
      if (result.status !== 429) return result
      const wait = parseRetryAfter(result.headers.get('retry-after')) ?? 30
      if (attempt >= maxRetries || wait > maxWaitSeconds) {
        throw new ApiError('rate_limited', `The API is rate limiting requests (${method} ${path}). Try again in about ${wait} s.`, {
          status: 429,
          retryAfterSeconds: wait,
        })
      }
      log(`The API asked to wait ${wait} s before retrying; waiting.`)
      await sleep(wait * 1000)
    }
  }

  const apiMessage = (body) => (body && typeof body.error === 'string' && body.error.trim() !== '' ? printable(body.error) : null)

  function failure(result, what) {
    const { status, body } = result
    if (status === 401 || status === 403) {
      return new ApiError('unauthorized', `The API refused the session (${status}) while ${what}. The token may have expired; run again.`, { status })
    }
    if (status === 404) {
      return new ApiError('not_found', `The API has nothing at the address used for ${what} (404). It may be running an older version.`, { status })
    }
    if (status >= 500) return new ApiError('server', `The API failed while ${what} (${status}). Try again later.`, { status })
    const code = body && typeof body.code === 'string' ? body.code : undefined
    return new ApiError('refused', `The API refused ${what} (${status})${apiMessage(body) ? `: ${apiMessage(body)}` : '.'}`, { status, code })
  }

  return {
    baseUrl: base,

    /** GET /api/profile (public). */
    async getProfile() {
      const result = await call('GET', '/api/profile')
      if (result.status === 404) {
        throw new ApiError('not_found', 'The API has no profile (GET /api/profile answered 404).', { status: 404 })
      }
      if (result.status !== 200) throw failure(result, 'reading the profile')
      if (result.body === null || typeof result.body !== 'object' || Array.isArray(result.body)) {
        throw new ApiError('bad_response', 'The profile the API sent is not a JSON object.')
      }
      return result.body
    },

    /**
     * POST /api/admin/auth/login, once. Any refusal ends the run: it is never retried.
     * @param {string} username
     * @param {string} password
     */
    async signIn(username, password) {
      if (signInAttempted) throw new Error('signIn() may be called once per run.')
      signInAttempted = true
      const result = await exchange('POST', '/api/admin/auth/login', { body: { username, password } })
      switch (result.status) {
        case 200:
          if (typeof result.body?.token !== 'string' || result.body.token === '') {
            throw new ApiError('bad_response', 'Sign-in answered 200 without a token.')
          }
          token = result.body.token
          return
        case 400:
        case 401:
          throw new ApiError(
            'sign_in_refused',
            'Sign-in was refused: wrong username or password. Not retrying; the API locks sign-in after repeated failures.',
            { status: result.status },
          )
        case 429: {
          const wait = parseRetryAfter(result.headers.get('retry-after'))
          throw new ApiError(
            'rate_limited',
            `Sign-in is locked after too many failed attempts.${wait === null ? '' : ` Try again in about ${Math.ceil(wait / 60)} min.`} Not retrying.`,
            { status: 429, retryAfterSeconds: wait ?? undefined },
          )
        }
        case 403:
          // No token exists yet, so this is not an expired session: the API, or a proxy or
          // firewall in front of it, turned the sign-in request itself away.
          throw new ApiError(
            'sign_in_refused',
            'Sign-in was refused (403): the API, or something in front of it, did not accept the sign-in request. Not retrying.',
            { status: 403 },
          )
        case 503:
          throw new ApiError('sign_in_off', 'Admin sign-in is not switched on (ADMIN_PASSWORD_HASH is not set on the API). This is not a wrong password.', {
            status: 503,
          })
        default:
          throw failure(result, 'signing in')
      }
    },

    /** GET /api/admin/suggestions: every status, newest first, at most 200. */
    async listSuggestions() {
      if (token === null) throw new Error('Sign in before listing suggestions.')
      const result = await call('GET', '/api/admin/suggestions', { auth: true })
      if (result.status !== 200) throw failure(result, 'listing suggestions')
      if (!Array.isArray(result.body)) throw new ApiError('bad_response', 'The suggestions list the API sent is not a list.')
      return result.body
    },

    /**
     * POST /api/admin/suggestions. A 409 "duplicate" (the same change is already pending)
     * is an expected outcome, not a failure.
     * @param {{targetType: string, field: string, proposedValue: string[], reason: string, source: string}} suggestion
     * @returns {Promise<{created: true, id: number|null} | {created: false, duplicate: true}>}
     */
    async createSuggestion({ targetType, field, proposedValue, reason, source }) {
      if (token === null) throw new Error('Sign in before creating suggestions.')
      const result = await call('POST', '/api/admin/suggestions', {
        auth: true,
        body: { targetType, field, proposedValue, reason, source },
      })
      if (result.status === 201) return { created: true, id: typeof result.body?.id === 'number' ? result.body.id : null }
      if (result.status === 409 && result.body?.code === 'duplicate') return { created: false, duplicate: true }
      throw failure(result, 'creating a suggestion')
    },
  }
}
