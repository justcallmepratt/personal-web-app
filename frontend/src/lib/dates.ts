// Date helpers for content dates, which are ISO strings written at whatever
// precision is known: '2023', '2023-05' or '2023-05-14' (API dates may carry a
// time part, which is ignored).

/**
 * Formats an ISO date at the precision it was written with: '2023' stays a
 * year, '2023-05' and '2023-05-14' become "May 2023". Anything else returns
 * null, so a typo never renders as "Invalid Date".
 */
export function formatIsoDate(date: string | null | undefined): string | null {
  if (typeof date !== 'string') return null
  const match = date.trim().match(/^(\d{4})(?:-(\d{2}))?(?:-\d{2})?(?:T.*)?$/)
  if (!match) return null
  const [, year, month] = match
  if (!month) return year
  if (Number(month) < 1 || Number(month) > 12) return null
  // Built and formatted in UTC so the month never shifts with the time zone.
  const d = new Date(Date.UTC(Number(year), Number(month) - 1, 1))
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })
}

/**
 * "Jul 2024 – Present", "Jun 2021 – Aug 2021" or just the start. A past role
 * with no known end date shows its start only, never "Present"; a missing or
 * unreadable start yields null so nothing is printed.
 */
export function formatDateRange(
  start: string | null | undefined,
  end: string | null | undefined,
  current: boolean | undefined,
): string | null {
  const from = formatIsoDate(start)
  const to = formatIsoDate(end)
  if (current === true) return from ? `${from} – Present` : 'Present'
  if (from && to) return from === to ? from : `${from} – ${to}`
  return from ?? to
}
