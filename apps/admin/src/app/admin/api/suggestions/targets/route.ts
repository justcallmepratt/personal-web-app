import { cookies } from 'next/headers'
import { listSuggestionTargets } from '@/lib/backend'
import { failureResponse, json } from '@/lib/http'
import { SESSION_COOKIE } from '@/lib/session'

/** The rows and fields a suggestion may change, with their live values. */
export async function GET() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  if (!token) return failureResponse({ ok: false, kind: 'unauthorized' })

  const result = await listSuggestionTargets(token)
  if (!result.ok) return failureResponse(result)
  return json(result.data)
}
