import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Inbox from '@/components/Inbox'
import { listMessages } from '@/lib/backend'
import { LOAD_ERRORS } from '@/lib/messages'
import { SESSION_COOKIE } from '@/lib/session'

export const metadata: Metadata = { title: 'Inbox' }

export default async function InboxPage() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  if (!token) redirect('/admin/login')

  const result = await listMessages(token)
  if (result.ok) return <Inbox initialMessages={result.data} />

  // The API no longer accepts the token: clear the cookie on the way to login.
  if (result.kind === 'unauthorized') redirect('/admin/api/session/expired')

  // Still signed in, but the API is unavailable: say why and offer a retry.
  return <Inbox initialMessages={[]} loadError={LOAD_ERRORS[result.kind]} />
}
