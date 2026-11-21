// Shared by the client components: how the browser calls this app's own handlers.

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
