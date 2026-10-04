const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 60 * 60 * 24 * 365],
  ["month", 60 * 60 * 24 * 30],
  ["week", 60 * 60 * 24 * 7],
  ["day", 60 * 60 * 24],
  ["hour", 60 * 60],
  ["minute", 60],
]

const relativeTime = new Intl.RelativeTimeFormat("en", { numeric: "auto" })

/** "just now", "5 minutes ago", "yesterday", "3 weeks ago". */
export function formatRelativeTime(
  date: string | Date,
  now: Date = new Date(),
): string {
  const seconds = Math.round((new Date(date).getTime() - now.getTime()) / 1000)

  for (const [unit, unitSeconds] of UNITS) {
    if (Math.abs(seconds) >= unitSeconds) {
      return relativeTime.format(Math.trunc(seconds / unitSeconds), unit)
    }
  }

  return "just now"
}

/** Full local date and time, for tooltips next to relative times. */
export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString("en", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

export function shortSha(sha: string): string {
  return sha.slice(0, 7)
}
