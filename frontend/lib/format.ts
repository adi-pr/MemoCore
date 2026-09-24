const UNITS: Array<[limitSeconds: number, name: string, divisor: number]> = [
  [60, "second", 1],
  [3600, "minute", 60],
  [86400, "hour", 3600],
  [2592000, "day", 86400],
]

export function formatRelativeTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return "unknown"

  const diffSeconds = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000))

  if (diffSeconds < 5) return "just now"

  for (const [limit, name, divisor] of UNITS) {
    if (diffSeconds < limit) {
      const value = Math.max(1, Math.round(diffSeconds / divisor))
      return `${value} ${name}${value === 1 ? "" : "s"} ago`
    }
  }

  return date.toLocaleDateString()
}
