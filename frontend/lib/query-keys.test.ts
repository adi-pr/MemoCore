import { QueryClient } from "@tanstack/react-query"
import { describe, expect, it } from "vitest"

import { queryKeys } from "@/lib/query-keys"

describe("queryKeys", () => {
  it("invalidates a repository's detail and sync jobs with the list", async () => {
    const client = new QueryClient()
    const id = "repo-1"

    client.setQueryData(queryKeys.repositories.all, [])
    client.setQueryData(queryKeys.repositories.detail(id), {})
    client.setQueryData(queryKeys.repositories.syncJobs(id), [])
    client.setQueryData(queryKeys.syncJobs.detail("job-1"), {})

    await client.invalidateQueries({ queryKey: queryKeys.repositories.all })

    const invalidated = (key: readonly unknown[]) =>
      client.getQueryState(key)?.isInvalidated

    expect(invalidated(queryKeys.repositories.all)).toBe(true)
    expect(invalidated(queryKeys.repositories.detail(id))).toBe(true)
    expect(invalidated(queryKeys.repositories.syncJobs(id))).toBe(true)
    expect(invalidated(queryKeys.syncJobs.detail("job-1"))).toBe(false)
  })
})
