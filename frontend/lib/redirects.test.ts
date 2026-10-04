import { describe, expect, it } from "vitest"

import { DEFAULT_REDIRECT, safeRedirectPath } from "@/lib/redirects"

describe("safeRedirectPath", () => {
  it.each(["/chat", "/repositories/123", "/settings?tab=models"])(
    "allows the app path %s",
    (path) => {
      expect(safeRedirectPath(path)).toBe(path)
    },
  )

  it.each([
    ["an absolute URL", "https://evil.example"],
    ["a protocol-relative URL", "//evil.example"],
    ["a backslash trick", "/\\evil.example"],
    ["a relative path", "chat"],
    ["an empty string", ""],
    ["a missing value", null],
  ])("falls back for %s", (_label, value) => {
    expect(safeRedirectPath(value)).toBe(DEFAULT_REDIRECT)
  })
})
