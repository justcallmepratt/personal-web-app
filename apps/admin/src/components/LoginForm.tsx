'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { fetchErrorMessage, formatWait, timeoutSignal } from '@/lib/client'
import type { ErrorBody } from '@/lib/types'
import { NeonButton, Notice, Panel, TerminalInput } from './ui'

// Used when a "too many attempts" reply does not say how long to wait: the API's window.
const DEFAULT_WAIT_SECONDS = 900
const MAX_WAIT_SECONDS = 3600

const waitFrom = (retryAfter: unknown) =>
  typeof retryAfter === 'number' && Number.isFinite(retryAfter) && retryAfter > 0
    ? Math.min(Math.ceil(retryAfter), MAX_WAIT_SECONDS)
    : DEFAULT_WAIT_SECONDS

export default function LoginForm({ notice }: { notice?: string }) {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // After "too many attempts" the form stays locked until this time (ms), so
  // retries never reach the API while it is refusing them.
  const [lockedUntil, setLockedUntil] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (lockedUntil === null) return
    const id = setInterval(() => {
      const t = Date.now()
      setNow(t)
      if (t >= lockedUntil) setLockedUntil(null)
    }, 1000)
    return () => clearInterval(id)
  }, [lockedUntil])

  const waitSeconds = lockedUntil === null ? 0 : Math.max(0, Math.ceil((lockedUntil - now) / 1000))
  const locked = waitSeconds > 0

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (pending || locked) return
    setPending(true)
    setError(null)
    try {
      const res = await fetch('/admin/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        signal: timeoutSignal(),
      })
      if (res.ok) {
        router.replace('/admin')
        router.refresh()
        return
      }
      const body = (await res.json().catch(() => null)) as Partial<ErrorBody> | null
      if (res.status === 429 || body?.kind === 'rate_limited') {
        const t = Date.now()
        setNow(t)
        setLockedUntil(t + waitFrom(body?.retryAfter) * 1000)
      } else {
        setError(body?.error ?? `Sign-in failed (HTTP ${res.status}).`)
      }
    } catch (e) {
      setError(fetchErrorMessage(e))
    }
    setPending(false)
  }

  return (
    <Panel title="Admin · Sign in" className="mx-auto mt-16 max-w-md">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {notice && !error && !locked && <Notice tone="info">{notice}</Notice>}
        {locked && (
          <Notice tone="error">
            Too many sign-in attempts. Sign-in is paused; try again in {formatWait(waitSeconds)}.
          </Notice>
        )}
        {error && !locked && <Notice tone="error">{error}</Notice>}
        <TerminalInput
          label="Username"
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          maxLength={256}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <TerminalInput
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={256}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <NeonButton type="submit" disabled={pending || locked || !username || !password} className="w-full">
          {pending ? 'Signing in…' : 'Sign in'}
        </NeonButton>
      </form>
    </Panel>
  )
}
