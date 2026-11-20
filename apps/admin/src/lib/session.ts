// Server-only: the admin session is the API's JWT kept in an httpOnly cookie.

export const SESSION_COOKIE = 'admin_session'

const base = {
  httpOnly: true,
  // Browsers refuse Secure cookies on plain-http localhost in some cases, so
  // only `next dev` gets a non-secure cookie.
  secure: process.env.NODE_ENV !== 'development',
  sameSite: 'strict' as const,
  path: '/admin',
}

/** Seconds until the JWT's `exp`, or undefined if it cannot be read. */
function secondsUntilExpiry(token: string): number | undefined {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'))
    if (typeof payload.exp !== 'number') return undefined
    return Math.max(0, Math.floor(payload.exp - Date.now() / 1000))
  } catch {
    return undefined
  }
}

/** Cookie that expires with the token (a session cookie if `exp` is unreadable). */
export function sessionCookie(token: string) {
  const maxAge = secondsUntilExpiry(token)
  return { name: SESSION_COOKIE, value: token, ...base, ...(maxAge === undefined ? {} : { maxAge }) }
}

export function clearedSessionCookie() {
  return { name: SESSION_COOKIE, value: '', ...base, maxAge: 0 }
}
