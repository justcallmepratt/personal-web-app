import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import InboxPage from '@/app/admin/page'
import LoginPage from '@/app/admin/login/page'
import { BACKEND, jsonResponse, message, mockFetch, timedOut, unreachable } from '../helpers'

const session = vi.hoisted(() => ({ token: undefined as string | undefined }))
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => (session.token ? { name, value: session.token } : undefined),
  }),
}))
// Like the real one, redirect() throws to stop rendering.
vi.mock('next/navigation', () => ({
  redirect: (to: string) => {
    throw new Error(`REDIRECT ${to}`)
  },
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}))

beforeEach(() => {
  session.token = 'jwt-123'
  vi.stubEnv('BACKEND_URL', BACKEND)
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('inbox page (server-side protection)', () => {
  it('redirects to the login page without a session cookie, before calling the API', async () => {
    session.token = undefined
    const fetchMock = mockFetch(() => jsonResponse([]))
    await expect(InboxPage()).rejects.toThrow('REDIRECT /admin/login')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it.each([401, 403])('sends an expired token (%i) through the cookie-clearing route', async (status) => {
    mockFetch(() => new Response(null, { status }))
    await expect(InboxPage()).rejects.toThrow('REDIRECT /admin/api/session/expired')
  })

  it('renders the inbox with the messages from the API', async () => {
    mockFetch(() => jsonResponse([message({ subject: 'Job offer' })]))
    render(await InboxPage())
    expect(screen.getByRole('button', { name: /job offer/i })).toBeInTheDocument()
    expect(screen.getByText('1 unread · 1 total')).toBeInTheDocument()
  })

  it('renders the empty state for an empty inbox', async () => {
    mockFetch(() => jsonResponse([]))
    render(await InboxPage())
    expect(screen.getByText('No messages yet.')).toBeInTheDocument()
  })

  it.each([
    ['BACKEND_URL is unset', null, /no API configured/i],
    ['the API is unreachable', unreachable, /could not be reached/i],
    ['the API is slower than the timeout', timedOut, /took too long/i],
    ['the API sends non-JSON', () => new Response('<html>', { status: 200 }), /could not read/i],
    ['the API reports an error', () => jsonResponse({}, 500), /reported an error/i],
    ['the API host answers 503', () => new Response('<html>', { status: 503 }), /temporarily unavailable/i],
  ])('stays signed in and explains when %s', async (_name, respond, text) => {
    if (respond) mockFetch(respond)
    else vi.stubEnv('BACKEND_URL', '')
    render(await InboxPage())
    expect(screen.getByRole('alert')).toHaveTextContent(text)
    expect(screen.getByText('Messages could not be loaded.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeEnabled()
  })
})

describe('login page', () => {
  it('shows the expired-session notice', async () => {
    render(await LoginPage({ searchParams: Promise.resolve({ reason: 'expired' }) }))
    expect(screen.getByRole('status')).toHaveTextContent(/session has expired/i)
  })

  it('ignores unknown or repeated reasons', async () => {
    render(await LoginPage({ searchParams: Promise.resolve({ reason: ['expired', 'x'] }) }))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
