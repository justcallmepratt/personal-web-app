import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import LoginForm from '@/components/LoginForm'
import { jsonResponse, mockFetch, unreachable } from '../helpers'

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
    ['admin not configured', 503, 'Admin sign-in is not configured on the API.'],
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

  it('shows the notice passed by the page, such as an expired session', () => {
    render(<LoginForm notice="Your session has expired. Sign in again." />)
    expect(screen.getByRole('status')).toHaveTextContent(/session has expired/i)
  })
})
