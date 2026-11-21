import { SUGGESTION_STATUSES, TARGET_TYPES } from './types'
import type {
  FailureKind,
  Message,
  NewSuggestion,
  Suggestion,
  SuggestionField,
  SuggestionStatus,
  SuggestionTarget,
  SuggestionValue,
  TargetType,
} from './types'

// Server-only: reads BACKEND_URL and handles the admin JWT. Never import this
// from a client component.

/** A cold or hung API must not hold a function open. */
export const BACKEND_TIMEOUT_MS = 8000

/** What to wait after a 429 that carries no usable Retry-After: the API's window. */
export const DEFAULT_RETRY_AFTER_SECONDS = 900
const MAX_RETRY_AFTER_SECONDS = 3600

export type BackendResult<T> =
  | { ok: true; data: T }
  | {
      ok: false
      kind: FailureKind
      status?: number
      retryAfterSeconds?: number
      /** The API's own explanation, when it gave one worth showing (suggestions only). */
      message?: string
      /** With `conflict`: what the target field holds now. */
      currentValue?: SuggestionValue
    }

interface CallOptions {
  method?: 'GET' | 'POST' | 'PATCH'
  token?: string
  body?: unknown
}

type Raw =
  | { ok: true; status: number; json: unknown; retryAfter: string | null }
  | { ok: false; kind: 'unconfigured' | 'unreachable' | 'timeout' }

async function call(path: string, { method = 'GET', token, body }: CallOptions): Promise<Raw> {
  const base = process.env.BACKEND_URL?.replace(/\/+$/, '')
  if (!base) return { ok: false, kind: 'unconfigured' }

  const headers: Record<string, string> = { Accept: 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  try {
    const res = await fetch(`${base}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: 'no-store',
      signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS),
    })
    // The body is read inside the try so a stalled body also hits the timeout.
    const text = await res.text()
    let json: unknown
    try {
      json = text ? JSON.parse(text) : undefined
    } catch {
      json = undefined
    }
    return { ok: true, status: res.status, json, retryAfter: res.headers.get('retry-after') }
  } catch (e) {
    const name = (e as { name?: string } | null)?.name
    const kind = name === 'TimeoutError' || name === 'AbortError' ? 'timeout' : 'unreachable'
    console.error(`Admin: API ${method} ${path} failed (${kind}).`, e)
    return { ok: false, kind }
  }
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

const textOrNull = (v: unknown) => (typeof v === 'string' ? v : null)

/** Accepts only objects with a numeric id; other fields are coerced, not trusted. */
function toMessage(v: unknown): Message | null {
  if (!isRecord(v) || typeof v.id !== 'number') return null
  return {
    id: v.id,
    name: textOrNull(v.name),
    email: textOrNull(v.email),
    subject: textOrNull(v.subject),
    body: textOrNull(v.body),
    read: v.read === true,
    sentAt: textOrNull(v.sentAt),
  }
}

/** Spring Security answers 403 (not 401) when the token is missing or expired. */
const isSignedOut = (status: number) => status === 401 || status === 403

/** A gateway status: the API's host answered for it (restart, deploy, overload). */
const isUnavailable = (status: number) => status === 502 || status === 503 || status === 504

/** Retry-After is seconds or an HTTP date; anything unreadable becomes the default. */
function retryAfterSeconds(header: string | null): number {
  const value = header?.trim()
  if (!value) return DEFAULT_RETRY_AFTER_SECONDS
  const seconds = /^\d+$/.test(value) ? Number(value) : Math.ceil((Date.parse(value) - Date.now()) / 1000)
  if (!Number.isFinite(seconds)) return DEFAULT_RETRY_AFTER_SECONDS
  return Math.min(Math.max(seconds, 1), MAX_RETRY_AFTER_SECONDS)
}

// Once the API says "too many attempts", this instance stops forwarding
// sign-ins until the wait is over, so a retrying browser cannot hammer the API.
// Per server instance and best effort; the API's own limiter is the real one.
let loginBlockedUntil = 0

export function clearLoginBlock() {
  loginBlockedUntil = 0
}

export async function login(username: string, password: string): Promise<BackendResult<string>> {
  const wait = Math.ceil((loginBlockedUntil - Date.now()) / 1000)
  if (wait > 0) return { ok: false, kind: 'rate_limited', status: 429, retryAfterSeconds: wait }

  const raw = await call('/api/admin/auth/login', { method: 'POST', body: { username, password } })
  if (!raw.ok) return raw
  if (raw.status === 429) {
    const seconds = retryAfterSeconds(raw.retryAfter)
    loginBlockedUntil = Date.now() + seconds * 1000
    return { ok: false, kind: 'rate_limited', status: 429, retryAfterSeconds: seconds }
  }
  if (raw.status === 401) return { ok: false, kind: 'invalid_credentials', status: 401 }
  // Only the API's own "Admin not configured" body means the password is unset;
  // any other 503 is the host saying the API is down.
  if (raw.status === 503 && isRecord(raw.json) && raw.json.error === 'Admin not configured') {
    return { ok: false, kind: 'admin_not_configured', status: 503 }
  }
  if (isUnavailable(raw.status)) return { ok: false, kind: 'unavailable', status: raw.status }
  if (raw.status !== 200) return { ok: false, kind: 'error', status: raw.status }
  if (!isRecord(raw.json) || typeof raw.json.token !== 'string' || !raw.json.token) {
    return { ok: false, kind: 'bad_response', status: 200 }
  }
  return { ok: true, data: raw.json.token }
}

export async function listMessages(token: string): Promise<BackendResult<Message[]>> {
  const raw = await call('/api/admin/messages', { token })
  if (!raw.ok) return raw
  if (isSignedOut(raw.status)) return { ok: false, kind: 'unauthorized', status: raw.status }
  if (isUnavailable(raw.status)) return { ok: false, kind: 'unavailable', status: raw.status }
  if (raw.status !== 200) return { ok: false, kind: 'error', status: raw.status }
  if (!Array.isArray(raw.json)) return { ok: false, kind: 'bad_response', status: 200 }
  const messages = raw.json.map(toMessage)
  if (messages.some((m) => m === null)) return { ok: false, kind: 'bad_response', status: 200 }
  return { ok: true, data: messages as Message[] }
}

export async function toggleRead(token: string, id: number): Promise<BackendResult<Message>> {
  const raw = await call(`/api/admin/messages/${id}/read`, { method: 'PATCH', token })
  if (!raw.ok) return raw
  if (isSignedOut(raw.status)) return { ok: false, kind: 'unauthorized', status: raw.status }
  if (raw.status === 404) return { ok: false, kind: 'not_found', status: 404 }
  if (isUnavailable(raw.status)) return { ok: false, kind: 'unavailable', status: raw.status }
  if (raw.status !== 200) return { ok: false, kind: 'error', status: raw.status }
  const message = toMessage(raw.json)
  if (!message) return { ok: false, kind: 'bad_response', status: 200 }
  return { ok: true, data: message }
}

// ── Suggestions ────────────────────────────────────────────────────────────

/** Sent with every suggestion made by hand in this app. */
const MANUAL_SOURCE = 'manual'
const MAX_API_MESSAGE_LENGTH = 500

/** A string, an array of strings or null; `undefined` for anything else. */
function toValue(v: unknown): SuggestionValue | undefined {
  if (v === null || v === undefined) return null
  if (typeof v === 'string') return v
  if (Array.isArray(v) && v.every((item) => typeof item === 'string')) return v as string[]
  return undefined
}

const isOneOf = <T extends string>(list: readonly T[], v: unknown): v is T =>
  typeof v === 'string' && (list as readonly string[]).includes(v)

/** Accepts only the shape the API documents; anything else is a bad response. */
function toSuggestion(v: unknown): Suggestion | null {
  if (!isRecord(v) || typeof v.id !== 'number' || typeof v.targetId !== 'number') return null
  if (typeof v.targetType !== 'string' || typeof v.field !== 'string') return null
  if (!isOneOf(SUGGESTION_STATUSES, v.status)) return null
  const currentValue = toValue(v.currentValue)
  const proposedValue = toValue(v.proposedValue)
  if (currentValue === undefined || proposedValue === undefined) return null
  return {
    id: v.id,
    targetType: v.targetType,
    targetId: v.targetId,
    targetLabel: textOrNull(v.targetLabel),
    field: v.field,
    fieldKind: v.fieldKind === 'list' ? 'list' : 'text',
    currentValue,
    proposedValue,
    reason: textOrNull(v.reason),
    source: textOrNull(v.source),
    status: v.status,
    createdAt: textOrNull(v.createdAt),
    decidedAt: textOrNull(v.decidedAt),
  }
}

function toField(v: unknown): SuggestionField | null {
  if (!isRecord(v) || typeof v.name !== 'string' || typeof v.maxLength !== 'number') return null
  const value = toValue(v.value)
  if (value === undefined) return null
  return {
    name: v.name,
    kind: v.kind === 'list' ? 'list' : 'text',
    required: v.required === true,
    maxLength: v.maxLength,
    value,
  }
}

function toTarget(v: unknown): SuggestionTarget | null {
  if (!isRecord(v) || typeof v.targetId !== 'number' || typeof v.label !== 'string') return null
  if (!isOneOf(TARGET_TYPES, v.targetType) || !Array.isArray(v.fields)) return null
  const fields = v.fields.map(toField)
  if (fields.some((f) => f === null)) return null
  return { targetType: v.targetType, targetId: v.targetId, label: v.label, fields: fields as SuggestionField[] }
}

type Failure = Extract<BackendResult<unknown>, { ok: false }>
type Answer = Extract<Raw, { ok: true }>

/** The API's `{"error": "..."}` text, if it sent one. Our own API wrote it, so it is safe to show. */
function apiMessage(json: unknown): string | undefined {
  if (!isRecord(json) || typeof json.error !== 'string' || !json.error.trim()) return undefined
  return json.error.slice(0, MAX_API_MESSAGE_LENGTH)
}

/** Maps every answer other than success to a failure; null means "read the body". */
function suggestionFailure(raw: Answer, success: number): Failure | null {
  if (raw.status === success) return null
  if (isSignedOut(raw.status)) return { ok: false, kind: 'unauthorized', status: raw.status }
  if (isUnavailable(raw.status)) return { ok: false, kind: 'unavailable', status: raw.status }
  const message = apiMessage(raw.json)
  if (raw.status === 400) return { ok: false, kind: 'invalid', status: 400, message }
  if (raw.status === 404) return { ok: false, kind: 'not_found', status: 404, message }
  if (raw.status === 409) {
    if (isRecord(raw.json) && raw.json.code === 'conflict') {
      return { ok: false, kind: 'conflict', status: 409, message, currentValue: toValue(raw.json.currentValue) ?? null }
    }
    return { ok: false, kind: 'refused', status: 409, message }
  }
  return { ok: false, kind: 'error', status: raw.status }
}

/** Newest first. Without a status the API returns every suggestion (at most 200). */
export async function listSuggestions(
  token: string,
  status?: SuggestionStatus,
): Promise<BackendResult<Suggestion[]>> {
  const raw = await call(`/api/admin/suggestions${status ? `?status=${status}` : ''}`, { token })
  if (!raw.ok) return raw
  const failure = suggestionFailure(raw, 200)
  if (failure) return failure
  if (!Array.isArray(raw.json)) return { ok: false, kind: 'bad_response', status: 200 }
  const list = raw.json.map(toSuggestion)
  if (list.some((s) => s === null)) return { ok: false, kind: 'bad_response', status: 200 }
  return { ok: true, data: list as Suggestion[] }
}

/** The rows and fields a suggestion may change, with their live values. */
export async function listSuggestionTargets(token: string): Promise<BackendResult<SuggestionTarget[]>> {
  const raw = await call('/api/admin/suggestions/targets', { token })
  if (!raw.ok) return raw
  const failure = suggestionFailure(raw, 200)
  if (failure) return failure
  if (!Array.isArray(raw.json)) return { ok: false, kind: 'bad_response', status: 200 }
  const list = raw.json.map(toTarget)
  if (list.some((t) => t === null)) return { ok: false, kind: 'bad_response', status: 200 }
  return { ok: true, data: list as SuggestionTarget[] }
}

export async function createSuggestion(token: string, input: NewSuggestion): Promise<BackendResult<Suggestion>> {
  const body: NewSuggestion & { source: string; targetType: TargetType } = { ...input, source: MANUAL_SOURCE }
  const raw = await call('/api/admin/suggestions', { method: 'POST', token, body })
  if (!raw.ok) return raw
  const failure = suggestionFailure(raw, 201)
  if (failure) return failure
  const suggestion = toSuggestion(raw.json)
  if (!suggestion) return { ok: false, kind: 'bad_response', status: 201 }
  return { ok: true, data: suggestion }
}

/** Accepting applies the change on the API; rejecting only marks the suggestion. */
export async function decideSuggestion(
  token: string,
  id: number,
  decision: 'accept' | 'reject',
): Promise<BackendResult<Suggestion>> {
  const raw = await call(`/api/admin/suggestions/${id}/${decision}`, { method: 'POST', token })
  if (!raw.ok) return raw
  const failure = suggestionFailure(raw, 200)
  if (failure) return failure
  const suggestion = toSuggestion(raw.json)
  if (!suggestion) return { ok: false, kind: 'bad_response', status: 200 }
  return { ok: true, data: suggestion }
}
