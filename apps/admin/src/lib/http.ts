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
  error: { status: 502, error: 'The API reported an error.' },
}

export function errorResponse(
  kind: ErrorBody['kind'],
  status: number,
  error: string,
  retryAfter?: number,
): NextResponse {
  const body: ErrorBody = retryAfter === undefined ? { error, kind } : { error, kind, retryAfter }
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
  const res = errorResponse(failure.kind, status, error, failure.retryAfterSeconds)
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
