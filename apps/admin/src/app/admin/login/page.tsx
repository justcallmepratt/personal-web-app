import type { Metadata } from 'next'
import LoginForm from '@/components/LoginForm'

export const metadata: Metadata = { title: 'Sign in' }

const NOTICES: Record<string, string> = {
  expired: 'Your session has expired. Sign in again.',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string | string[] }>
}) {
  const { reason } = await searchParams
  return <LoginForm notice={typeof reason === 'string' ? NOTICES[reason] : undefined} />
}
