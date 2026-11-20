import {
  isMailConfigured,
  isRateLimited,
  sendContactMail,
  validateEmailDomain,
  validatePayload,
} from '@/lib/contact'

const reply = (success: boolean, message: string, status = 200) =>
  Response.json({ success, message }, { status })

// The largest valid payload is under 3 KB; refuse anything far beyond that
// before reading the body.
const MAX_BODY_BYTES = 16_384

export async function POST(request: Request) {
  if (Number(request.headers.get('content-length') ?? 0) > MAX_BODY_BYTES) {
    return reply(false, 'Request too large.', 413)
  }

  let json: unknown
  try {
    json = await request.json()
  } catch {
    return reply(false, 'Invalid request.', 400)
  }

  const payload = validatePayload(json)
  if (!payload.ok) return reply(false, payload.message, payload.status)

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown'

  // With a backend configured, it owns contact handling (rate limit, domain
  // checks, persistence to the inbox, email). The browser stays same-origin.
  const backend = process.env.BACKEND_URL
  if (backend) {
    try {
      const res = await fetch(`${backend}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': ip },
        body: JSON.stringify(payload.value),
        // Bound the function's run time if the backend is cold or hung.
        signal: AbortSignal.timeout(10_000),
      })
      const body = await res.json()
      return reply(Boolean(body.success), body.message ?? 'Send failed.', res.status)
    } catch (e) {
      console.error('Contact form: backend unreachable.', e)
      return reply(false, 'Contact channel is offline. Please try again later.', 502)
    }
  }

  if (isRateLimited(ip)) {
    return reply(false, 'Too many submissions from your connection. Please try again later.', 429)
  }

  const domain = await validateEmailDomain(payload.value.email)
  if (!domain.ok) return reply(false, domain.message, domain.status)

  if (!isMailConfigured()) {
    console.error('Contact form: MAIL_USER / MAIL_PASS are not set; message was not delivered.')
    return reply(false, 'Contact channel is offline. Please reach out by email instead.', 503)
  }

  try {
    await sendContactMail(payload.value)
  } catch (e) {
    console.error('Contact form: mail delivery failed.', e)
    return reply(false, 'Message could not be delivered. Please try again later.', 502)
  }
  return reply(true, "Message received. I'll get back to you soon.")
}
