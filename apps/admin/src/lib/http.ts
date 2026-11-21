import type { NextResponse } from 'next/server'
import { NextResponse as Res } from 'next/server'
import type { BackendResult } from './backend'
import { clearedSessionCookie } from './session'
import type { ErrorBody, FailureKind } from './types'

// Server-only helpers shared by the route handlers.

const FAILURES: Record<FailureKind, { status: number; error: string }> = {
  unconfigured: { status: 503, error: 'The admin app has no API configured (BACKEND_URL is not set).' },
  unreachable: { status: 502, error: 'The API could not be reached.' },
  timeout: { status: 504, error: 'The API took too long to answer.' },
  bad_response: { status: 502, error: 'The API sent a response this app could not read.' },
  unauthorized: { status: 401, error: 'Your session has expired. Sign in again.' },
  invalid_credentials: { status: 401, error: 'Wrong username or password.' },
  admin_not_configured: {
    status: 503,
    error:
      'Admin sign-in is not switched on yet. The API has no admin password set (ADMIN_PASSWORD_HASH), so nobody can sign in. This is not a wrong password.',
  },
  rate_limited: { status: 429, error: 'Too many sign-in attempts. Wait before trying again.' },
  unavailable: { status: 503, error: 'The API is temporarily unavailable. It may be restarting; try again in a moment.' },
  not_found: { status: 404, error: 'That message no longer exists.' },
  invalid: { status: 400, error: 'The API refused those values.' },
  conflict: { status: 409, error: 'The content has changed since this suggestion was made, so it was not applied.' },
  refused: { status: 409, error: 'The API refused that for the current state of the suggestion.' },
  error: { status: 502, error: 'The API reported an error.' },
}

export function errorResponse(
  kind: ErrorBody['kind'],
  status: number,
  error: string,
  retryAfter?: number,
  extra: Pick<ErrorBody, 'currentValue'> = {},
): NextResponse {
  const body: ErrorBody = { error, kind, ...(retryAfter === undefined ? {} : { retryAfter }), ...extra }
  return Res.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      ...(retryAfter === undefined ? {} : { 'Retry-After': String(retryAfter) }),
    },
  })
}

/** Maps a failed API call to this app's reply; an expired session also clears the cookie. */
export function failureResponse(failure: Extract<BackendResult<unknown>, { ok: false }>): NextResponse {
  const { status, error } = FAILURES[failure.kind]
  const res = errorResponse(
    failure.kind,
    status,
    // The API explains its own refusals (which value, which limit); pass that on.
    failure.message ?? error,
    failure.retryAfterSeconds,
    failure.kind === 'conflict' ? { currentValue: failure.currentValue ?? null } : {},
  )
  if (failure.kind === 'unauthorized') res.cookies.set(clearedSessionCookie())
  return res
}

export function json(data: unknown): NextResponse {
  return Res.json(data, { headers: { 'Cache-Control': 'no-store' } })
}

/**
 * Rejects state-changing requests sent from another origin. The session cookie
 * is SameSite=Strict already; this also covers the login endpoint, which has no
 * cookie to protect it.
 */
export function crossOrigin(request: Request): NextResponse | null {
  const origin = request.headers.get('origin')
  if (!origin) return null
  // Behind the microfrontends router the public host may arrive as either header.
  const hosts = [request.headers.get('x-forwarded-host'), request.headers.get('host')]
  let originHost: string | null = null
  try {
    originHost = new URL(origin).host
  } catch {
    // "null" or malformed: treated as a mismatch below.
  }
  if (originHost && hosts.includes(originHost)) return null
  return errorResponse('forbidden', 403, 'Cross-origin request refused.')
}

/**
 * Reads a JSON request body of at most `maxBytes`. Returns the parsed value, or
 * the reply to send instead (413 for an oversized body, 400 for anything that
 * is not JSON).
 */
export async function readJsonBody(
  request: Request,
  maxBytes: number,
): Promise<{ ok: true; body: unknown } | { ok: false; response: NextResponse }> {
  const tooLarge = () => ({ ok: false as const, response: errorResponse('too_large', 413, 'Request too large.') })
  // Refuse oversized bodies before reading them.
  const declared = Number(request.headers.get('content-length') ?? 0)
  if (!Number.isFinite(declared) || declared > maxBytes) return tooLarge()
  try {
    const text = await request.text()
    // Content-Length can be absent (chunked); check what actually arrived too.
    if (new TextEncoder().encode(text).length > maxBytes) return tooLarge()
    return { ok: true, body: JSON.parse(text) }
  } catch {
    return { ok: false, response: errorResponse('bad_request', 400, 'Invalid request.') }
  }
}
