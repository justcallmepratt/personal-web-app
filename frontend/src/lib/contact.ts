import { resolveMx } from 'node:dns/promises'
import nodemailer from 'nodemailer'
import type { ContactPayload } from './types'

// Server-only contact form logic, used by app/api/contact/route.ts.
// Ported from the Spring ContactController / EmailValidationService /
// RateLimitService so the form works without the Java backend.

export type Result<T> = { ok: true; value: T } | { ok: false; status: number; message: string }

const reject = (status: number, message: string) => ({ ok: false as const, status, message })

// Time budget for one submission (the route sets maxDuration = 25 s):
// relay 4 s + MX lookup 2 s + SMTP 10 s = 16 s worst case, leaving headroom.
export const RELAY_TIMEOUT_MS = 4_000
export const MX_TIMEOUT_MS = 2_000
export const SMTP_TIMEOUT_MS = 10_000

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
    const records = await withTimeout(lookupMx(domain), MX_TIMEOUT_MS, 'MX lookup')
    if (records.length === 0) {
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

/** A positive whole number from the environment, or the fallback when unset, blank or invalid. */
export function positiveIntEnv(value: string | undefined, fallback: number): number {
  const n = Number.parseInt(value ?? '', 10)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

// Past this many tracked addresses, a call first drops the ones with no recent hits.
const SWEEP_AT = 1000

export function isRateLimited(
  ip: string,
  now = Date.now(),
  max = positiveIntEnv(process.env.CONTACT_RATE_LIMIT_MAX, 3),
  windowMs = positiveIntEnv(process.env.CONTACT_RATE_LIMIT_WINDOW, 3600) * 1000,
): boolean {
  if (hits.size >= SWEEP_AT) {
    for (const [key, times] of hits) {
      if (!times.some((t) => now - t < windowMs)) hits.delete(key)
    }
  }
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < windowMs)
  if (recent.length >= max) {
    hits.set(ip, recent)
    return true
  }
  hits.set(ip, [...recent, now])
  return false
}

/** How many addresses the limiter is tracking (for tests). */
export function trackedAddresses(): number {
  return hits.size
}

export function resetRateLimit() {
  hits.clear()
}

export function isMailConfigured(): boolean {
  return Boolean(process.env.MAIL_USER && process.env.MAIL_PASS)
}

const oneLine = (s: string) => s.replace(/[\r\n]+/g, ' ')

/** Rejects if `promise` has not settled after `ms`. Clears its timer either way. */
export function withTimeout<T>(promise: Promise<T>, ms: number, what: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(Object.assign(new Error(`${what} timed out`), { code: 'ETIMEOUT' })), ms)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}

/** Sends the notification email. Throws if SMTP rejects it or takes longer than the timeout. */
export async function sendContactMail(msg: ContactPayload, timeoutMs = SMTP_TIMEOUT_MS): Promise<void> {
  const user = process.env.MAIL_USER!
  const port = Number(process.env.MAIL_PORT ?? 587)
  const transport = nodemailer.createTransport({
    host: process.env.MAIL_HOST ?? 'smtp.gmail.com',
    port,
    secure: port === 465,
    auth: { user, pass: process.env.MAIL_PASS! },
    // Socket-level limits; the race below bounds the whole send regardless.
    connectionTimeout: timeoutMs,
    greetingTimeout: timeoutMs,
    socketTimeout: timeoutMs,
  })
  try {
    await withTimeout(
      transport.sendMail({
        from: user,
        to: process.env.CONTACT_NOTIFY_TO || user,
        replyTo: msg.email,
        subject: `[Resume Contact] ${oneLine(msg.subject)}`,
        text: `From: ${oneLine(msg.name)} <${msg.email}>\n\n${msg.body}`,
      }),
      timeoutMs,
      'SMTP send',
    )
  } finally {
    transport.close()
  }
}

// The API's own answers that the visitor should see: bad input, an address that
// cannot receive mail, and its rate limit.
const DEFINITE_CLIENT_ERRORS = new Set([400, 422, 429])

export type RelayResult =
  | { kind: 'reply'; status: number; success: boolean; message: string }
  | { kind: 'unavailable'; reason: string }

/**
 * Relays to the Spring API. A definite answer is returned as a reply to pass on:
 * a 2xx, or a 400 / 422 / 429 (validation, undeliverable address, rate limit),
 * with the API's `{ success, message }` body. Anything else is "unavailable", so
 * the caller can fall back to SMTP: unreachable, timed out, 5xx, non-JSON, a body
 * without a boolean `success`, or another status such as a 404 / 401 / 403 from a
 * misrouted or protected backend.
 */
export async function relayToBackend(
  backend: string,
  payload: ContactPayload,
  ip: string,
  timeoutMs = RELAY_TIMEOUT_MS,
): Promise<RelayResult> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(`${backend}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': ip },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
    const definite = res.ok || DEFINITE_CLIENT_ERRORS.has(res.status)
    if (!definite) return { kind: 'unavailable', reason: `backend ${res.status}` }
    let body: { success?: unknown; message?: unknown }
    try {
      body = await res.json()
    } catch {
      return { kind: 'unavailable', reason: 'backend returned non-JSON' }
    }
    if (typeof body !== 'object' || body === null || typeof body.success !== 'boolean') {
      return { kind: 'unavailable', reason: 'backend returned an unexpected body' }
    }
    return {
      kind: 'reply',
      status: res.status,
      success: body.success,
      message: typeof body.message === 'string' ? body.message : 'Send failed.',
    }
  } catch (e) {
    return { kind: 'unavailable', reason: controller.signal.aborted ? 'backend timed out' : `backend unreachable (${errorCode(e)})` }
  } finally {
    clearTimeout(timer)
  }
}

/** Keeps the first character and the domain: `a***@example.com`. */
export function maskEmail(email: string): string {
  const at = email.lastIndexOf('@')
  return at < 1 ? '***' : `${email[0]}***${email.slice(at)}`
}

export function errorCode(e: unknown): string {
  const err = e as { code?: unknown; responseCode?: unknown; name?: unknown }
  return String(err?.code ?? err?.responseCode ?? err?.name ?? 'unknown')
}

export type ContactOutcome = 'relayed' | 'sent-smtp' | 'fell-back' | 'undeliverable'

/**
 * One structured line per outcome. Never logs the message body, subject, name or
 * a full email address; read these in the Vercel function logs.
 */
export function logContact(
  outcome: ContactOutcome,
  fields: Record<string, string | number | boolean>,
): void {
  const line = JSON.stringify({ event: 'contact', outcome, ...fields })
  if (outcome === 'undeliverable') console.error(line)
  else if (outcome === 'fell-back') console.warn(line)
  else console.info(line)
}
