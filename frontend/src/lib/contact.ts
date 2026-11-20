import { resolveMx } from 'node:dns/promises'
import nodemailer from 'nodemailer'
import type { ContactPayload } from './types'

// Server-only contact form logic, used by app/api/contact/route.ts.
// Ported from the Spring ContactController / EmailValidationService /
// RateLimitService so the form works without the Java backend.

export type Result<T> = { ok: true; value: T } | { ok: false; status: number; message: string }

const reject = (status: number, message: string) => ({ ok: false as const, status, message })

const LIMITS = { name: 100, email: 255, subject: 200, body: 2000 } as const
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Common throwaway inbox providers.
const DISPOSABLE = new Set([
  'mailinator.com', 'guerrillamail.com', 'guerrillamail.net', 'sharklasers.com', 'grr.la',
  'tempmail.com', 'temp-mail.org', 'throwaway.email', 'dispostable.com', 'maildrop.cc',
  'yopmail.com', 'trashmail.com', 'trashmail.net', '10minutemail.com', '20minutemail.com',
  'discard.email', 'fakeinbox.com', 'getnada.com', 'mohmal.com', 'mytrashmail.com',
  'spamgourmet.com', 'mailnull.com', 'meltmail.com', 'jetable.fr', 'notmailinator.com',
])

/** Shape, required-field and length checks. Trims every field. */
export function validatePayload(input: unknown): Result<ContactPayload> {
  if (typeof input !== 'object' || input === null) return reject(400, 'Invalid request.')
  const raw = input as Record<string, unknown>
  const value = {} as ContactPayload
  for (const field of ['name', 'email', 'subject', 'body'] as const) {
    const v = typeof raw[field] === 'string' ? raw[field].trim() : ''
    if (!v) return reject(400, `Missing ${field}.`)
    if (v.length > LIMITS[field]) return reject(400, `${field} is too long.`)
    value[field] = v
  }
  if (!EMAIL.test(value.email)) return reject(400, 'Invalid email format.')
  return { ok: true, value }
}

/** Rejects disposable domains and domains with no mail server. DNS errors fail open. */
export async function validateEmailDomain(
  email: string,
  lookupMx: (domain: string) => Promise<unknown[]> = resolveMx,
): Promise<Result<true>> {
  const domain = email.slice(email.lastIndexOf('@') + 1).toLowerCase()
  if (DISPOSABLE.has(domain)) {
    return reject(422, 'Disposable or throwaway email addresses are not accepted. Please use a real inbox.')
  }
  try {
    if ((await lookupMx(domain)).length === 0) {
      return reject(422, 'The email domain has no mail server. Please verify your email address.')
    }
  } catch (e) {
    const code = (e as NodeJS.ErrnoException).code
    if (code === 'ENOTFOUND' || code === 'ENODATA') {
      return reject(422, 'The email domain does not exist. Please check your address.')
    }
    // Timeout or resolver trouble: don't block a legitimate sender.
  }
  return { ok: true, value: true }
}

// Best-effort limiter: state is per server instance, so on serverless hosts it
// slows casual abuse rather than enforcing a hard cap.
const hits = new Map<string, number[]>()

export function isRateLimited(
  ip: string,
  now = Date.now(),
  max = Number(process.env.CONTACT_RATE_LIMIT_MAX ?? 3),
  windowMs = Number(process.env.CONTACT_RATE_LIMIT_WINDOW ?? 3600) * 1000,
): boolean {
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < windowMs)
  if (recent.length >= max) {
    hits.set(ip, recent)
    return true
  }
  hits.set(ip, [...recent, now])
  return false
}

export function resetRateLimit() {
  hits.clear()
}

export function isMailConfigured(): boolean {
  return Boolean(process.env.MAIL_USER && process.env.MAIL_PASS)
}

const oneLine = (s: string) => s.replace(/[\r\n]+/g, ' ')

/** Sends the notification email. Throws if SMTP rejects it. */
export async function sendContactMail(msg: ContactPayload): Promise<void> {
  const user = process.env.MAIL_USER!
  const port = Number(process.env.MAIL_PORT ?? 587)
  const transport = nodemailer.createTransport({
    host: process.env.MAIL_HOST ?? 'smtp.gmail.com',
    port,
    secure: port === 465,
    auth: { user, pass: process.env.MAIL_PASS! },
  })
  await transport.sendMail({
    from: user,
    to: process.env.CONTACT_NOTIFY_TO || user,
    replyTo: msg.email,
    subject: `[Resume Contact] ${oneLine(msg.subject)}`,
    text: `From: ${oneLine(msg.name)} <${msg.email}>\n\n${msg.body}`,
  })
}
