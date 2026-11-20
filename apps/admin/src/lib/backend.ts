import type { FailureKind, Message } from './types'

// Server-only: reads BACKEND_URL and handles the admin JWT. Never import this
// from a client component.

/** A cold or hung API must not hold a function open. */
export const BACKEND_TIMEOUT_MS = 8000

export type BackendResult<T> =
  | { ok: true; data: T }
  | { ok: false; kind: FailureKind; status?: number }

interface CallOptions {
  method?: 'GET' | 'POST' | 'PATCH'
  token?: string
  body?: unknown
}

type Raw =
  | { ok: true; status: number; json: unknown }
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
    return { ok: true, status: res.status, json }
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

export async function login(username: string, password: string): Promise<BackendResult<string>> {
  const raw = await call('/api/admin/auth/login', { method: 'POST', body: { username, password } })
  if (!raw.ok) return raw
  if (raw.status === 401) return { ok: false, kind: 'invalid_credentials', status: 401 }
  if (raw.status === 503) return { ok: false, kind: 'admin_not_configured', status: 503 }
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
  if (raw.status !== 200) return { ok: false, kind: 'error', status: raw.status }
  const message = toMessage(raw.json)
  if (!message) return { ok: false, kind: 'bad_response', status: 200 }
  return { ok: true, data: message }
}
