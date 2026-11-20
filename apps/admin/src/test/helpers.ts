import { vi } from 'vitest'
import type { Message } from '@/lib/types'

export const BACKEND = 'https://api.test'

export const message = (over: Partial<Message> = {}): Message => ({
  id: 1,
  name: 'Ada',
  email: 'ada@example.com',
  subject: 'Hello',
  body: 'First line\nSecond line',
  read: false,
  sentAt: '2026-11-20T10:15:30',
  ...over,
})

export const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

/** Replaces global fetch with a mock that answers with `impl`. */
export function mockFetch(impl: (url: string, init?: RequestInit) => Response | Promise<Response>) {
  const fn = vi.fn(async (url: string | URL | Request, init?: RequestInit) => impl(String(url), init))
  vi.stubGlobal('fetch', fn)
  return fn
}

/** A fetch that fails the way a refused connection does. */
export const unreachable = () => {
  throw new TypeError('fetch failed')
}

/** A fetch that fails the way AbortSignal.timeout does. */
export const timedOut = () => {
  throw new DOMException('The operation was aborted due to timeout', 'TimeoutError')
}

/** A JWT-shaped token whose payload carries `exp` (seconds since epoch). */
export function tokenExpiringIn(seconds: number) {
  const part = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url')
  return `${part({ alg: 'HS256' })}.${part({ sub: 'admin', exp: Math.floor(Date.now() / 1000) + seconds })}.sig`
}
