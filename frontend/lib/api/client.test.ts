import { describe, expect, expectTypeOf, it, vi } from "vitest"

import { createApiClient } from "@/lib/api/client"
import { ApiError, unwrap } from "@/lib/api/errors"
import type { Repository } from "@/lib/api/types"

const repository: Repository = {
  id: "00000000-0000-0000-0000-000000000001",
  provider: "github",
  external_id: null,
  name: "wiki",
  full_name: "me/wiki",
  clone_url: "https://github.com/me/wiki",
  default_branch: "main",
  is_active: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  latest_sync_job: null,
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  })
}

function clientReturning(response: Response | Error) {
  const fetch = vi.fn(async (request: Request) => {
    void request
    if (response instanceof Error) throw response
    return response
  })

  return {
    api: createApiClient(
      "http://backend.test",
      fetch as typeof globalThis.fetch,
    ),
    fetch,
  }
}

describe("api client", () => {
  it("requests paths on the backend URL", async () => {
    const { api, fetch } = clientReturning(json([repository]))

    await api.GET("/repositories/{repository_id}", {
      params: { path: { repository_id: repository.id } },
    })

    const request = fetch.mock.calls[0][0]
    expect(request.method).toBe("GET")
    expect(request.url).toBe(
      `http://backend.test/repositories/${repository.id}`,
    )
  })
})

describe("unwrap", () => {
  it("returns typed data", async () => {
    const { api } = clientReturning(json([repository]))

    const repositories = await unwrap(api.GET("/repositories"))

    expectTypeOf(repositories).toEqualTypeOf<Repository[]>()
    expect(repositories).toEqual([repository])
  })

  it("throws the backend's detail message", async () => {
    const { api } = clientReturning(
      json({ detail: "Repository not found" }, 404),
    )

    const error = await unwrap(
      api.GET("/repositories/{repository_id}", {
        params: { path: { repository_id: repository.id } },
      }),
    ).catch((error: unknown) => error)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({
      status: 404,
      message: "Repository not found",
    })
  })

  it("joins validation error messages", async () => {
    const { api } = clientReturning(
      json(
        {
          detail: [
            { loc: ["body", "name"], msg: "Field required", type: "missing" },
            { loc: ["body", "clone_url"], msg: "Invalid URL", type: "url" },
          ],
        },
        422,
      ),
    )

    await expect(
      unwrap(
        api.POST("/repositories", {
          body: {
            name: "",
            full_name: "me/wiki",
            clone_url: "https://github.com/me/wiki",
          },
        }),
      ),
    ).rejects.toMatchObject({
      status: 422,
      message: "Field required; Invalid URL",
    })
  })

  it("falls back to the status when there is no detail", async () => {
    const { api } = clientReturning(
      new Response("Bad Gateway", { status: 502 }),
    )

    await expect(unwrap(api.GET("/repositories"))).rejects.toMatchObject({
      status: 502,
      message: "Backend request failed with status 502",
    })
  })

  it("reports an unreachable backend", async () => {
    const { api } = clientReturning(new TypeError("fetch failed"))

    await expect(unwrap(api.GET("/repositories"))).rejects.toMatchObject({
      status: null,
      message: "Could not reach the backend",
    })
  })
})
