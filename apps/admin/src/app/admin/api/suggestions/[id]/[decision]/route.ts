import { cookies } from 'next/headers'
import { decideSuggestion } from '@/lib/backend'
import { crossOrigin, errorResponse, failureResponse, json } from '@/lib/http'
import { SESSION_COOKIE } from '@/lib/session'

/**
 * POST /admin/api/suggestions/{id}/accept applies the change on the API (the only way
 * a suggestion reaches the public site); .../reject marks it rejected. Both return the
 * updated suggestion.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; decision: string }> },
) {
  const blocked = crossOrigin(request)
  if (blocked) return blocked

  const { id, decision } = await params
  // Both go into the API URL, so accept nothing but a plain positive integer and the two words.
  if (!/^[1-9]\d{0,15}$/.test(id)) return errorResponse('bad_request', 400, 'Invalid suggestion id.')
  if (decision !== 'accept' && decision !== 'reject') {
    return errorResponse('bad_request', 400, 'Unknown decision.')
  }

  const token = (await cookies()).get(SESSION_COOKIE)?.value
  if (!token) return failureResponse({ ok: false, kind: 'unauthorized' })

  const result = await decideSuggestion(token, Number(id), decision)
  if (!result.ok) return failureResponse(result)
  return json(result.data)
}
