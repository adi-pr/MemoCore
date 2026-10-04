import { describe, expect, it } from "vitest"

import { githubUrl, sortRepositories } from "@/lib/repositories"
import { makeRepository } from "@/test/fixtures"

describe("githubUrl", () => {
  it("links to the repository on GitHub", () => {
    expect(githubUrl({ full_name: "me/wiki" })).toBe(
      "https://github.com/me/wiki",
    )
  })
})

describe("sortRepositories", () => {
  it("puts active repositories first and keeps their order", () => {
    const sorted = sortRepositories([
      makeRepository({ id: "a", is_active: false }),
      makeRepository({ id: "b" }),
      makeRepository({ id: "c", is_active: false }),
      makeRepository({ id: "d" }),
    ])

    expect(sorted.map((repository) => repository.id)).toEqual([
      "b",
      "d",
      "a",
      "c",
    ])
  })
})
