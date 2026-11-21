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
  | 'invalid' // 400: the API refused the values; its message says why
  | 'conflict' // 409 "conflict": the target changed since the suggestion was made
  | 'refused' // any other 409: already decided, target deleted, duplicate
  | 'error' // any other status

/** JSON body of every error reply from this app's own route handlers. */
export interface ErrorBody {
  error: string
  kind: FailureKind | 'bad_request' | 'too_large' | 'forbidden'
  /** Seconds to wait before signing in again; only with `rate_limited`. */
  retryAfter?: number
  /** What the target field holds now; only with `conflict`. */
  currentValue?: SuggestionValue
}

/** A field value: text, a list of text items, or nothing. */
export type SuggestionValue = string | string[] | null

export const SUGGESTION_STATUSES = ['pending', 'accepted', 'rejected', 'superseded'] as const
export type SuggestionStatus = (typeof SUGGESTION_STATUSES)[number]

export const TARGET_TYPES = ['profile', 'experience', 'project'] as const
export type TargetType = (typeof TARGET_TYPES)[number]

export type FieldKind = 'text' | 'list'

/** A proposed change to one field, as serialised by the API (`SuggestionResponse`). */
export interface Suggestion {
  id: number
  targetType: string
  targetId: number
  /** Null when the row it points at no longer exists. */
  targetLabel: string | null
  field: string
  fieldKind: FieldKind
  /** The value recorded when the suggestion was made, not the live one. */
  currentValue: SuggestionValue
  proposedValue: SuggestionValue
  reason: string | null
  source: string | null
  status: SuggestionStatus
  createdAt: string | null
  decidedAt: string | null
}

/** One field the API allows a suggestion to change, with its live value. */
export interface SuggestionField {
  name: string
  kind: FieldKind
  required: boolean
  maxLength: number
  value: SuggestionValue
}

/** A row a suggestion can point at (`SuggestionTarget` in the API). */
export interface SuggestionTarget {
  targetType: TargetType
  targetId: number
  label: string
  fields: SuggestionField[]
}

/** What the browser sends to create a suggestion. The source is set on the server. */
export interface NewSuggestion {
  targetType: TargetType
  targetId: number
  field: string
  proposedValue: string | string[]
  reason: string
}
