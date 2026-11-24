import { cookies } from 'next/headers'
import { setRead } from '@/lib/backend'
import { crossOrigin, errorResponse, failureResponse, json } from '@/lib/http'
import { SESSION_COOKIE } from '@/lib/session'

/** Sets a message to read (`?read=true`, the default) or unread (`?read=false`) and returns it. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const blocked = crossOrigin(request)
  if (blocked) return blocked

  const { id } = await params
  // The id goes into the API URL, so accept nothing but a plain positive integer.
  if (!/^[1-9]\d{0,15}$/.test(id)) return errorResponse('bad_request', 400, 'Invalid message id.')

  const token = (await cookies()).get(SESSION_COOKIE)?.value
  if (!token) return failureResponse({ ok: false, kind: 'unauthorized' })

  const param = new URL(request.url).searchParams.get('read')
  if (param !== null && param !== 'true' && param !== 'false') {
    return errorResponse('bad_request', 400, 'read must be true or false.')
  }
  const result = await setRead(token, Number(id), param !== 'false')
  if (!result.ok) return failureResponse(result)
  return json(result.data)
}
