/**
 * Parses an ISO-ish date string into a Date, or returns null when the value is
 * missing, empty, or unparseable. Use this instead of `new Date(value)` so
 * callers never propagate an Invalid Date (which renders as NaN downstream).
 *
 * Note: this validates *parse-ability* only; it does not reject future dates.
 * Callers that need a "no future" rule (e.g. day-counters) should compare the
 * returned Date themselves.
 */
export function parseValidDate(value?: string | null): Date | null {
  if (!value) return null
  const t = Date.parse(value)
  if (!Number.isFinite(t)) return null
  return new Date(t)
}

/**
 * Calendar-day difference between `value` and today, both normalized to local
 * start-of-day. Returns null for missing/invalid values and for future dates.
 *
 * Calendar-day (not raw 24h elapsed) so "joined yesterday at 23:00" counts as 1
 * day even though < 24h have passed.
 */
export function calendarDaysSince(value?: string | null): number | null {
  const d = parseValidDate(value)
  if (!d) return null
  const joinedStart = new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate(),
  ).getTime()
  const now = new Date()
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime()
  const diffDays = Math.floor((todayStart - joinedStart) / 86_400_000)
  if (diffDays < 0) return null
  return diffDays
}
