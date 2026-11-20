/**
 * Public address for "email me directly". Set NEXT_PUBLIC_CONTACT_EMAIL; no address
 * is hard-coded. Returns undefined when unset or not shaped like an address, so
 * callers render no link at all rather than a broken one. The reference must stay
 * a literal `process.env.NEXT_PUBLIC_…` for Next to inline it into the client bundle.
 */
export function publicContactEmail(): string | undefined {
  const value = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim()
  return value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? value : undefined
}
