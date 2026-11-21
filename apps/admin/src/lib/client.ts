import type { ErrorBody } from './types'

// Shared by the client components: how the browser calls this app's own handlers.

export const LOGIN_EXPIRED = '/admin/login?reason=expired'

/** Full-page navigation: the session is gone, so drop all client state with it. */
export const leave = (to: string) => window.location.assign(to)

/** The error body of a failed reply from this app, with fallbacks for an unreadable one. */
export async function errorOf(res: Response): Promise<ErrorBody> {
  const body = (await res.json().catch(() => null)) as Partial<ErrorBody> | null
  return {
    ...body,
    kind: body?.kind ?? 'error',
    error: body?.error ?? `Request failed (HTTP ${res.status}).`,
  }
}

/** Longer than the server's limit on API calls, so the server's reason arrives first. */
export const CLIENT_TIMEOUT_MS = 15000

export const NETWORK_ERROR = 'Could not reach the admin app. Check your connection and try again.'
export const SLOW_ERROR = 'The admin app took too long to answer. Try again in a moment.'

/** A fresh timeout signal for one request. */
export const timeoutSignal = () => AbortSignal.timeout(CLIENT_TIMEOUT_MS)

/** What to show when fetch itself failed (no response at all). */
export function fetchErrorMessage(e: unknown): string {
  const name = (e as { name?: string } | null)?.name
  return name === 'TimeoutError' || name === 'AbortError' ? SLOW_ERROR : NETWORK_ERROR
}

/** 900 → "about 15 minutes", 61 → "about 2 minutes", 1 → "1 second". */
export function formatWait(seconds: number): string {
  if (seconds >= 60) {
    const minutes = Math.ceil(seconds / 60)
    return `about ${minutes} minute${minutes === 1 ? '' : 's'}`
  }
  return `${seconds} second${seconds === 1 ? '' : 's'}`
}
