import { describe, expect, it } from "vitest"

import { formatRelativeTime, shortSha } from "@/lib/format"

const now = new Date("2026-10-04T12:00:00Z")

describe("formatRelativeTime", () => {
  it.each([
    ["2026-10-04T11:59:30Z", "just now"],
    ["2026-10-04T11:55:00Z", "5 minutes ago"],
    ["2026-10-04T09:00:00Z", "3 hours ago"],
    ["2026-10-03T12:00:00Z", "yesterday"],
    ["2026-09-20T12:00:00Z", "2 weeks ago"],
    ["2025-09-01T12:00:00Z", "last year"],
  ])("formats %s as %s", (date, expected) => {
    expect(formatRelativeTime(date, now)).toBe(expected)
  })
})

describe("shortSha", () => {
  it("keeps the first seven characters", () => {
    expect(shortSha("abcdef1234567890")).toBe("abcdef1")
  })
})
