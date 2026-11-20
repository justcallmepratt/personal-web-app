'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import type { ErrorBody } from '@/lib/types'
import { NeonButton, Notice, Panel, TerminalInput } from './ui'

const NETWORK_ERROR = 'Could not reach the admin app. Check your connection and try again.'

export default function LoginForm({ notice }: { notice?: string }) {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (pending) return
    setPending(true)
    setError(null)
    try {
      const res = await fetch('/admin/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      if (res.ok) {
        router.replace('/admin')
        router.refresh()
        return
      }
      const body = (await res.json().catch(() => null)) as ErrorBody | null
      setError(body?.error ?? `Sign-in failed (HTTP ${res.status}).`)
    } catch {
      setError(NETWORK_ERROR)
    }
    setPending(false)
  }

  return (
    <Panel title="Admin · Sign in" className="mx-auto mt-16 max-w-md">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {notice && !error && <Notice tone="info">{notice}</Notice>}
        {error && <Notice tone="error">{error}</Notice>}
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
        <NeonButton type="submit" disabled={pending || !username || !password} className="w-full">
          {pending ? 'Signing in…' : 'Sign in'}
        </NeonButton>
      </form>
    </Panel>
  )
}
