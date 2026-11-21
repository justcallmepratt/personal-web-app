import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SuggestionsPage from '@/app/admin/suggestions/page'
import { BACKEND, jsonResponse, mockFetch, suggestion, targets, timedOut, unreachable } from '../helpers'

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
}))

/** Answers the page's two API calls. */
const api = (list: () => Response, targetList: () => Response = () => jsonResponse(targets())) =>
  mockFetch((url) => (url.endsWith('/targets') ? targetList() : list()))

beforeEach(() => {
  session.token = 'jwt-123'
  vi.stubEnv('BACKEND_URL', BACKEND)
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('suggestions page (server-side protection)', () => {
  it('redirects to the login page without a session cookie, before calling the API', async () => {
    session.token = undefined
    const fetchMock = api(() => jsonResponse([]))
    await expect(SuggestionsPage()).rejects.toThrow('REDIRECT /admin/login')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it.each([401, 403])('sends an expired token (%i) through the cookie-clearing route', async (status) => {
    api(() => new Response(null, { status }), () => new Response(null, { status }))
    await expect(SuggestionsPage()).rejects.toThrow('REDIRECT /admin/api/session/expired')
  })

  it('does the same when only the second call is refused', async () => {
    api(() => jsonResponse([]), () => new Response(null, { status: 403 }))
    await expect(SuggestionsPage()).rejects.toThrow('REDIRECT /admin/api/session/expired')
  })

  it('renders pending suggestions and the form from the API, using the session token', async () => {
    const fetchMock = api(() => jsonResponse([suggestion(), suggestion({ id: 2, status: 'accepted' })]))
    render(await SuggestionsPage())

    expect(screen.getByText('1 pending · 1 decided')).toBeInTheDocument()
    expect(screen.getByRole('article', { name: /acme · role/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create suggestion' })).toBeInTheDocument()
    expect(fetchMock.mock.calls.map(([url]) => url).sort()).toEqual([
      `${BACKEND}/api/admin/suggestions`,
      `${BACKEND}/api/admin/suggestions/targets`,
    ])
    for (const [, init] of fetchMock.mock.calls) {
      expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer jwt-123')
    }
  })

  it('renders the empty state when there are no suggestions', async () => {
    api(() => jsonResponse([]))
    render(await SuggestionsPage())
    expect(screen.getByText('No pending suggestions.')).toBeInTheDocument()
    expect(screen.getByText('0 pending · 0 decided')).toBeInTheDocument()
  })

  it.each([
    ['BACKEND_URL is unset', null, /no API configured/i],
    ['the API is unreachable', unreachable, /could not be reached/i],
    ['the API is slower than the timeout', timedOut, /took too long/i],
    ['the API sends non-JSON', () => new Response('<html>', { status: 200 }), /could not read/i],
    ['the API reports an error', () => jsonResponse({}, 500), /reported an error/i],
    ['the API host answers 503', () => new Response('<html>', { status: 503 }), /temporarily unavailable/i],
    ['the API has no such endpoint', () => new Response(null, { status: 404 }), /older version/i],
  ])('stays signed in and explains when %s', async (_name, respond, text) => {
    if (respond) api(respond, respond)
    else vi.stubEnv('BACKEND_URL', '')
    render(await SuggestionsPage())
    expect(screen.getByRole('alert')).toHaveTextContent(text)
    expect(screen.getByText('Suggestions could not be loaded.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeEnabled()
  })

  it('explains when only the targets could not be loaded', async () => {
    api(() => jsonResponse([suggestion()]), () => new Response('<html>', { status: 503 }))
    render(await SuggestionsPage())
    expect(screen.getByRole('alert')).toHaveTextContent(/temporarily unavailable/i)
    expect(screen.getByText('Not loaded')).toBeInTheDocument()
  })
})
