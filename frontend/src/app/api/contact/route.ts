import {
  isMailConfigured,
  isRateLimited,
  sendContactMail,
  validateEmailDomain,
  validatePayload,
} from '@/lib/contact'

const reply = (success: boolean, message: string, status = 200) =>
  Response.json({ success, message }, { status })

export async function POST(request: Request) {
  let json: unknown
  try {
    json = await request.json()
  } catch {
    return reply(false, 'Invalid request.', 400)
  }

  const payload = validatePayload(json)
  if (!payload.ok) return reply(false, payload.message, payload.status)

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown'
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
