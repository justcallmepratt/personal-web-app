import type { FailureKind } from './types'

/** What the inbox page shows when it could not load messages on the server. */
export const LOAD_ERRORS: Record<Exclude<FailureKind, 'unauthorized'>, string> = {
  unconfigured: 'This app has no API configured. Set BACKEND_URL on the admin project and redeploy.',
  unreachable: 'The API could not be reached. It may be down or restarting.',
  timeout: 'The API took too long to answer. It may be waking up; try again in a moment.',
  bad_response: 'The API sent a response this app could not read.',
  invalid_credentials: 'The API rejected the request.',
  admin_not_configured: 'Admin sign-in is not switched on yet on the API.',
  rate_limited: 'The API is refusing requests for now. Try again later.',
  unavailable: 'The API is temporarily unavailable. It may be restarting; try again in a moment.',
  not_found: 'The API has no inbox endpoint at the expected address.',
  invalid: 'The API rejected the request.',
  conflict: 'The API reported a conflict.',
  refused: 'The API refused the request.',
  error: 'The API reported an error.',
}

/** "2026-11-20T10:15:30" → "2026-11-20 10:15". No time-zone maths: the API sends none. */
export function formatSentAt(sentAt: string | null): string {
  if (!sentAt) return 'Unknown date'
  return sentAt.replace('T', ' ').slice(0, 16)
}
