import {
  errorCode,
  isMailConfigured,
  isRateLimited,
  logContact,
  maskEmail,
  relayToBackend,
  sendContactMail,
  validateEmailDomain,
  validatePayload,
} from '@/lib/contact'

// Relay (4 s) + MX lookup (2 s) + SMTP (10 s) is 16 s at worst; cap the function above that.
export const maxDuration = 25

const reply = (success: boolean, message: string, status = 200) =>
  Response.json({ success, message }, { status })

// The largest valid payload is under 3 KB; refuse anything far beyond that
// before reading the body.
const MAX_BODY_BYTES = 16_384

const OFFLINE = 'Contact channel is offline. Please reach out by email instead.'

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
  const sender = maskEmail(payload.value.email)

  // 1. With a backend configured, it owns contact handling (rate limit, domain
  //    checks, persistence to the inbox, email). A definite answer, including a
  //    4xx such as validation or rate limit, goes straight back to the visitor.
  let fellBackBecause: string | undefined
  const backend = process.env.BACKEND_URL
  if (backend) {
    const relayed = await relayToBackend(backend, payload.value, ip)
    if (relayed.kind === 'reply') {
      logContact('relayed', { status: relayed.status, success: relayed.success })
      return reply(relayed.success, relayed.message, relayed.status)
    }
    fellBackBecause = relayed.reason
    if (isMailConfigured()) {
      logContact('fell-back', { reason: relayed.reason, to: 'smtp' })
    }
  }

  // 2. Direct SMTP, either as the only path or as the fallback. The handler's own
  //    rate limit and email-domain checks apply here, as the API's did not run.
  if (isRateLimited(ip)) {
    return reply(false, 'Too many submissions from your connection. Please try again later.', 429)
  }

  const domain = await validateEmailDomain(payload.value.email)
  if (!domain.ok) return reply(false, domain.message, domain.status)

  if (!isMailConfigured()) {
    logContact('undeliverable', {
      reason: fellBackBecause ?? 'no BACKEND_URL',
      detail: 'MAIL_USER / MAIL_PASS are not set',
      from: sender,
    })
    return reply(false, OFFLINE, 503)
  }

  try {
    await sendContactMail(payload.value)
  } catch (e) {
    logContact('undeliverable', {
      reason: fellBackBecause ?? 'smtp',
      detail: `smtp failed (${errorCode(e)})`,
      from: sender,
    })
    return reply(false, 'Message could not be delivered. Please try again later.', 502)
  }
  logContact('sent-smtp', { from: sender, afterFallback: Boolean(fellBackBecause) })
  return reply(true, "Message received. I'll get back to you soon.")
}
