// Shared date helpers for the Work Log Sheet feature (server local time, matching the legacy
// PHP endpoints' use of CURDATE()/NOW() against the same server clock).

export function todayDateOnly(): Date {
  const now = new Date()
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
}

// Monday of the current week, as a date-only value — mirrors getWeekLog.php's
// `date('N')` (1=Mon..7=Sun) + `strtotime('-N days')` computation.
export function mondayOfWeek(reference: Date): Date {
  const isoDow = reference.getUTCDay() === 0 ? 7 : reference.getUTCDay()
  const monday = new Date(reference)
  monday.setUTCDate(reference.getUTCDate() - (isoDow - 1))
  return monday
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setUTCDate(d.getUTCDate() + days)
  return d
}

export function isSameDate(a: Date, b: Date): boolean {
  return a.getUTCFullYear() === b.getUTCFullYear() && a.getUTCMonth() === b.getUTCMonth() && a.getUTCDate() === b.getUTCDate()
}
