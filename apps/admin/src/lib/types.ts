/** A contact message as serialised by the API (backend `Message` entity). */
export interface Message {
  id: number
  name: string | null
  email: string | null
  subject: string | null
  body: string | null
  read: boolean
  /** `LocalDateTime` without a zone, e.g. "2026-11-20T10:15:30". */
  sentAt: string | null
}

/** Why a call from this app to the API did not produce a usable answer. */
export type FailureKind =
  | 'unconfigured' // BACKEND_URL is not set
  | 'unreachable' // connection failed
  | 'timeout' // no answer within the limit
  | 'bad_response' // answer was not the JSON we expect
  | 'unauthorized' // 401 / 403: no session, or the token expired
  | 'invalid_credentials' // 401 on login
  | 'admin_not_configured' // 503 "Admin not configured" on login: the API has no admin password
  | 'rate_limited' // 429 on login: too many failed attempts
  | 'unavailable' // 502 / 503 / 504: the API or its host is restarting or overloaded
  | 'not_found' // 404
  | 'error' // any other status

/** JSON body of every error reply from this app's own route handlers. */
export interface ErrorBody {
  error: string
  kind: FailureKind | 'bad_request' | 'too_large' | 'forbidden'
  /** Seconds to wait before signing in again; only with `rate_limited`. */
  retryAfter?: number
}
