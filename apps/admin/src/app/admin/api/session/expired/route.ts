import { NextResponse } from 'next/server'
import { clearedSessionCookie } from '@/lib/session'

/**
 * Where the inbox page sends a browser whose token the API rejected. Pages
 * cannot change cookies while rendering, so this clears the cookie and
 * continues to the login page.
 */
export async function GET(request: Request) {
  const res = NextResponse.redirect(new URL('/admin/login?reason=expired', request.url), 303)
  res.cookies.set(clearedSessionCookie())
  res.headers.set('Cache-Control', 'no-store')
  return res
}
