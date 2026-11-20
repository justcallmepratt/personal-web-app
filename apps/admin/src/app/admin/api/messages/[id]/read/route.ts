import { cookies } from 'next/headers'
import { toggleRead } from '@/lib/backend'
import { crossOrigin, errorResponse, failureResponse, json } from '@/lib/http'
import { SESSION_COOKIE } from '@/lib/session'

/** Toggles a message between read and unread and returns the updated message. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const blocked = crossOrigin(request)
  if (blocked) return blocked

  const { id } = await params
  // The id goes into the API URL, so accept nothing but a plain positive integer.
  if (!/^[1-9]\d{0,15}$/.test(id)) return errorResponse('bad_request', 400, 'Invalid message id.')

  const token = (await cookies()).get(SESSION_COOKIE)?.value
  if (!token) return failureResponse({ ok: false, kind: 'unauthorized' })

  const result = await toggleRead(token, Number(id))
  if (!result.ok) return failureResponse(result)
  return json(result.data)
}
