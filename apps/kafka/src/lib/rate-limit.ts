export type Result<T> = { ok: true; value: T } | { ok: false; status: number; message: string }

// Best-effort limiter: state is per server instance, so on serverless hosts it
// slows casual abuse rather than enforcing a hard cap.
const hits = new Map<string, number[]>()

export function isRateLimited(key: string, now: number, max: number, windowMs: number): boolean {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs)
  if (recent.length >= max) {
    hits.set(key, recent)
    return true
  }
  hits.set(key, [...recent, now])
  return false
}

export function resetRateLimit() {
  hits.clear()
}
