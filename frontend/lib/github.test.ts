import { describe, expect, it } from "vitest"

import { isValidBranch, parseGitHubRepository } from "@/lib/github"

describe("parseGitHubRepository", () => {
  it.each([
    "me/wiki",
    "https://github.com/me/wiki",
    "http://github.com/me/wiki/",
    "https://www.github.com/me/wiki.git",
    "github.com/me/wiki",
    "https://github.com/me/wiki/tree/main/docs",
    "https://github.com/me/wiki?tab=readme",
    "git@github.com:me/wiki.git",
    "ssh://git@github.com/me/wiki.git",
    "  me/wiki  ",
  ])("reads %s", (input) => {
    expect(parseGitHubRepository(input)).toEqual({
      owner: "me",
      repo: "wiki",
      fullName: "me/wiki",
    })
  })

  it("keeps dots, dashes and underscores in repository names", () => {
    expect(parseGitHubRepository("adi-pr/memo.core_v2")?.fullName).toBe(
      "adi-pr/memo.core_v2",
    )
  })

  it.each([
    "",
    "wiki",
    "me/",
    "https://gitlab.com/me/wiki",
    "git@gitlab.com:me/wiki.git",
    "-me/wiki",
    "me/..",
    "me/wi ki",
  ])("rejects %j", (input) => {
    expect(parseGitHubRepository(input)).toBeNull()
  })
})

describe("isValidBranch", () => {
  it.each(["main", "release/2.0", "feature_x"])("accepts %s", (branch) => {
    expect(isValidBranch(branch)).toBe(true)
  })

  it.each(["", "has space", "-flag", "a..b", "what?"])(
    "rejects %j",
    (branch) => {
      expect(isValidBranch(branch)).toBe(false)
    },
  )
})
