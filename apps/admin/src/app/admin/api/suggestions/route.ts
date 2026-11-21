import { cookies } from 'next/headers'
import { createSuggestion, listSuggestions } from '@/lib/backend'
import { crossOrigin, errorResponse, failureResponse, json, readJsonBody } from '@/lib/http'
import { SESSION_COOKIE } from '@/lib/session'
import { LIST_ITEM_MAX, LIST_MAX_ITEMS, LONG_TEXT_MAX, REASON_MAX } from '@/lib/suggestions'
import { SUGGESTION_STATUSES, TARGET_TYPES } from '@/lib/types'
import type { NewSuggestion, SuggestionStatus, TargetType } from '@/lib/types'

// The longest value is 10,000 characters of text; this leaves room for multi-byte text.
const MAX_BODY_BYTES = 64 * 1024

/** Lists suggestions, newest first. `?status=` narrows to one status. */
export async function GET(request: Request) {
  const status = new URL(request.url).searchParams.get('status')
  // The status goes into the API URL, so accept nothing but the known words.
  if (status !== null && !(SUGGESTION_STATUSES as readonly string[]).includes(status)) {
    return errorResponse('bad_request', 400, 'Unknown status.')
  }

  const token = (await cookies()).get(SESSION_COOKIE)?.value
  if (!token) return failureResponse({ ok: false, kind: 'unauthorized' })

  const result = await listSuggestions(token, (status ?? undefined) as SuggestionStatus | undefined)
  if (!result.ok) return failureResponse(result)
  return json(result.data)
}

/** Checks the shape only; which fields exist and what they accept is the API's decision. */
function parse(body: unknown): NewSuggestion | string {
  const b = (typeof body === 'object' && body !== null && !Array.isArray(body) ? body : {}) as Record<string, unknown>

  if (typeof b.targetType !== 'string' || !(TARGET_TYPES as readonly string[]).includes(b.targetType)) {
    return 'Choose what the suggestion is for.'
  }
  if (typeof b.targetId !== 'number' || !Number.isSafeInteger(b.targetId) || b.targetId < 1) {
    return 'Choose what the suggestion is for.'
  }
  if (typeof b.field !== 'string' || !/^[A-Za-z]{1,50}$/.test(b.field)) return 'Choose a field.'

  let proposedValue: string | string[]
  if (typeof b.proposedValue === 'string') {
    if (b.proposedValue.length > LONG_TEXT_MAX) return `The value is limited to ${LONG_TEXT_MAX} characters.`
    proposedValue = b.proposedValue
  } else if (Array.isArray(b.proposedValue)) {
    if (b.proposedValue.length > LIST_MAX_ITEMS) return `A list is limited to ${LIST_MAX_ITEMS} items.`
    const items = b.proposedValue
    if (!items.every((i): i is string => typeof i === 'string' && i.trim().length > 0 && i.length <= LIST_ITEM_MAX)) {
      return `Each list item must be text of 1 to ${LIST_ITEM_MAX} characters.`
    }
    proposedValue = items
  } else {
    return 'Enter the proposed value.'
  }

  const reason = typeof b.reason === 'string' ? b.reason.trim() : ''
  if (!reason) return 'A reason is required.'
  if (reason.length > REASON_MAX) return `The reason is limited to ${REASON_MAX} characters.`

  return { targetType: b.targetType as TargetType, targetId: b.targetId, field: b.field, proposedValue, reason }
}

/** Creates a pending suggestion. Nothing on the public site changes. */
export async function POST(request: Request) {
  const blocked = crossOrigin(request)
  if (blocked) return blocked

  const read = await readJsonBody(request, MAX_BODY_BYTES)
  if (!read.ok) return read.response

  const input = parse(read.body)
  if (typeof input === 'string') return errorResponse('bad_request', 400, input)

  const token = (await cookies()).get(SESSION_COOKIE)?.value
  if (!token) return failureResponse({ ok: false, kind: 'unauthorized' })

  const result = await createSuggestion(token, input)
  if (!result.ok) return failureResponse(result)
  return json(result.data)
}
