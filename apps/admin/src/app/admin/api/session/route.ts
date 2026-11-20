import { cookies } from 'next/headers'
import { login } from '@/lib/backend'
import { crossOrigin, errorResponse, failureResponse, json } from '@/lib/http'
import { clearedSessionCookie, sessionCookie } from '@/lib/session'

// A username and password fit in a few hundred bytes.
const MAX_BODY_BYTES = 4096
const MAX_FIELD_LENGTH = 256

const field = (v: unknown) =>
  typeof v === 'string' && v.length > 0 && v.length <= MAX_FIELD_LENGTH ? v : null

/** Sign in: exchanges credentials for the API's JWT and stores it in the cookie. */
export async function POST(request: Request) {
  const blocked = crossOrigin(request)
  if (blocked) return blocked

  // Refuse oversized bodies before reading them.
  const declared = Number(request.headers.get('content-length') ?? 0)
  if (!Number.isFinite(declared) || declared > MAX_BODY_BYTES) {
    return errorResponse('too_large', 413, 'Request too large.')
  }

  let body: unknown
  try {
    const text = await request.text()
    // Content-Length can be absent (chunked); check what actually arrived too.
    if (text.length > MAX_BODY_BYTES) return errorResponse('too_large', 413, 'Request too large.')
    body = JSON.parse(text)
  } catch {
    return errorResponse('bad_request', 400, 'Invalid request.')
  }

  const fields = (typeof body === 'object' && body !== null ? body : {}) as Record<string, unknown>
  const username = field(fields.username)
  const password = field(fields.password)
  if (!username || !password) {
    return errorResponse('bad_request', 400, 'Username and password are required.')
  }

  const result = await login(username, password)
  if (!result.ok) return failureResponse(result)

  const res = json({ ok: true })
  res.cookies.set(sessionCookie(result.data))
  return res
}

/** Sign out. The API keeps no session state, so dropping the cookie is enough. */
export async function DELETE(request: Request) {
  const blocked = crossOrigin(request)
  if (blocked) return blocked
  // Touch the cookie store so this handler is never treated as static.
  await cookies()
  const res = json({ ok: true })
  res.cookies.set(clearedSessionCookie())
  return res
}
