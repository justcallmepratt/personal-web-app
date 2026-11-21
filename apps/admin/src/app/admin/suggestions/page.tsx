import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Suggestions from '@/components/Suggestions'
import { listSuggestionTargets, listSuggestions } from '@/lib/backend'
import { SESSION_COOKIE } from '@/lib/session'
import { SUGGESTION_LOAD_ERRORS } from '@/lib/suggestions'

export const metadata: Metadata = { title: 'Suggestions' }

export default async function SuggestionsPage() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  if (!token) redirect('/admin/login')

  const [suggestions, targets] = await Promise.all([listSuggestions(token), listSuggestionTargets(token)])
  if (suggestions.ok && targets.ok) {
    return <Suggestions initialSuggestions={suggestions.data} initialTargets={targets.data} />
  }

  const kinds = [suggestions, targets].flatMap((result) => (result.ok ? [] : [result.kind]))
  // The API no longer accepts the token: clear the cookie on the way to login.
  if (kinds.includes('unauthorized')) redirect('/admin/api/session/expired')

  // Still signed in, but the API is unavailable: say why and offer a retry.
  const kind = kinds[0] as Exclude<(typeof kinds)[number], 'unauthorized'>
  return <Suggestions initialSuggestions={[]} initialTargets={[]} loadError={SUGGESTION_LOAD_ERRORS[kind]} />
}
