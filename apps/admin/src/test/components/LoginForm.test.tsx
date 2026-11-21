import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import LoginForm from '@/components/LoginForm'
import { formatWait } from '@/lib/client'
import { jsonResponse, mockFetch, timedOut, unreachable } from '../helpers'

const router = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => router }))
beforeEach(() => {
  router.replace.mockReset()
  router.refresh.mockReset()
})

async function submit() {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText(/username/i), 'admin')
  await user.type(screen.getByLabelText(/password/i), 'hunter2')
  await user.click(screen.getByRole('button', { name: /sign in/i }))
}

describe('LoginForm', () => {
  it('keeps the button disabled until both fields are filled', async () => {
    render(<LoginForm />)
    const button = screen.getByRole('button', { name: /sign in/i })
    expect(button).toBeDisabled()
    await userEvent.type(screen.getByLabelText(/username/i), 'admin')
    expect(button).toBeDisabled()
    await userEvent.type(screen.getByLabelText(/password/i), 'x')
    expect(button).toBeEnabled()
  })

  it('posts to this app, never to the API, and opens the inbox on success', async () => {
    const fetchMock = mockFetch(() => jsonResponse({ ok: true }))
    render(<LoginForm />)
    await submit()

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/admin'))
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/admin/api/session')
    expect(init?.method).toBe('POST')
    expect(JSON.parse(init?.body as string)).toEqual({ username: 'admin', password: 'hunter2' })
  })

  it.each([
    ['wrong credentials', 401, 'Invalid credentials.'],
    ['admin sign-in not switched on', 503, 'Admin sign-in is not switched on yet.'],
    ['API unavailable', 503, 'The API is temporarily unavailable.'],
    ['API unreachable', 502, 'The API could not be reached.'],
    ['API too slow', 504, 'The API took too long to answer.'],
  ])('shows the reason for %s and lets the user retry', async (_name, status, error) => {
    mockFetch(() => jsonResponse({ error, kind: 'x' }, status))
    render(<LoginForm />)
    await submit()

    expect(await screen.findByRole('alert')).toHaveTextContent(error)
    expect(screen.getByRole('button', { name: /sign in/i })).toBeEnabled()
    expect(router.replace).not.toHaveBeenCalled()
  })

  it('falls back to the status code when the error body is not JSON', async () => {
    mockFetch(() => new Response('<html>', { status: 500 }))
    render(<LoginForm />)
    await submit()
    expect(await screen.findByRole('alert')).toHaveTextContent('Sign-in failed (HTTP 500).')
  })

  it('reports a network failure', async () => {
    mockFetch(unreachable)
    render(<LoginForm />)
    await submit()
    expect(await screen.findByRole('alert')).toHaveTextContent(/could not reach the admin app/i)
  })

  it('reports a request that timed out, and sends every request with a timeout', async () => {
    const fetchMock = mockFetch(timedOut)
    render(<LoginForm />)
    await submit()
    expect(await screen.findByRole('alert')).toHaveTextContent(/took too long/i)
    expect(fetchMock.mock.calls[0][1]?.signal).toBeInstanceOf(AbortSignal)
  })

  it('pauses sign-in after "too many attempts" and says when to retry', async () => {
    const fetchMock = mockFetch(() => jsonResponse({ error: 'x', kind: 'rate_limited', retryAfter: 900 }, 429))
    render(<LoginForm notice="Your session has expired. Sign in again." />)
    await submit()

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/too many sign-in attempts/i)
    expect(alert).toHaveTextContent(/try again in about 15 minutes/i)
    const button = screen.getByRole('button', { name: /sign in/i })
    expect(button).toBeDisabled()

    // Neither the button nor Enter sends another request while paused.
    await userEvent.type(screen.getByLabelText(/password/i), '{Enter}')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('unlocks by itself when the wait is over', async () => {
    mockFetch(() => jsonResponse({ error: 'x', kind: 'rate_limited', retryAfter: 1 }, 429))
    render(<LoginForm />)
    await submit()

    expect(await screen.findByRole('alert')).toHaveTextContent(/try again in 1 second\./i)
    await waitFor(() => expect(screen.getByRole('button', { name: /sign in/i })).toBeEnabled(), { timeout: 4000 })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it.each([
    ['is missing', {}],
    ['is not a number', { retryAfter: 'soon' }],
    ['is negative', { retryAfter: -5 }],
  ])('waits the default 15 minutes when the retry time %s', async (_name, extra) => {
    mockFetch(() => jsonResponse({ error: 'x', ...extra }, 429))
    render(<LoginForm />)
    await submit()
    expect(await screen.findByRole('alert')).toHaveTextContent(/about 15 minutes/i)
  })

  it('caps an absurd wait at an hour', async () => {
    mockFetch(() => jsonResponse({ kind: 'rate_limited', retryAfter: 1e9 }, 429))
    render(<LoginForm />)
    await submit()
    expect(await screen.findByRole('alert')).toHaveTextContent(/about 60 minutes/i)
  })

  it('shows the notice passed by the page, such as an expired session', () => {
    render(<LoginForm notice="Your session has expired. Sign in again." />)
    expect(screen.getByRole('status')).toHaveTextContent(/session has expired/i)
  })
})

describe('formatWait', () => {
  it.each([
    [900, 'about 15 minutes'],
    [61, 'about 2 minutes'],
    [60, 'about 1 minute'],
    [59, '59 seconds'],
    [1, '1 second'],
  ])('%i s reads as "%s"', (seconds, text) => {
    expect(formatWait(seconds)).toBe(text)
  })
})
