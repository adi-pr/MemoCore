import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { proxy } from "@/proxy"

const AUTH_COOKIE = "sb-192-auth-token=base64-session"

const mocks = vi.hoisted(() => ({ getUser: vi.fn() }))

vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({ auth: { getUser: mocks.getUser } }),
}))

function request(path: string, cookie?: string) {
  return new NextRequest(`http://localhost:3000${path}`, {
    headers: cookie ? { cookie } : {},
  })
}

function signedInAs(appMetadata: Record<string, unknown>) {
  mocks.getUser.mockResolvedValue({
    data: { user: { id: "1", app_metadata: appMetadata } },
  })
}

function redirectTarget(response: Response) {
  const location = response.headers.get("location")
  return location && new URL(location).pathname + new URL(location).search
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.getUser.mockResolvedValue({ data: { user: null } })
})

describe("proxy", () => {
  it("lets the MemoCore owner through", async () => {
    signedInAs({ memocore_owner: true })

    const response = await proxy(request("/repositories", AUTH_COOKIE))

    expect(response.headers.get("x-middleware-next")).toBe("1")
  })

  it.each(["/sign-in", "/setup"])("leaves %s public", async (path) => {
    const response = await proxy(request(path))

    expect(response.headers.get("x-middleware-next")).toBe("1")
  })

  it("skips Supabase when there is no auth cookie", async () => {
    const response = await proxy(request("/chat"))

    expect(mocks.getUser).not.toHaveBeenCalled()
    expect(redirectTarget(response)).toBe("/sign-in?next=%2Fchat")
  })

  it("sends signed-out visitors to sign in and back afterwards", async () => {
    const response = await proxy(request("/repositories?tab=jobs", AUTH_COOKIE))

    expect(response.status).toBe(307)
    expect(redirectTarget(response)).toBe(
      "/sign-in?next=%2Frepositories%3Ftab%3Djobs",
    )
  })

  it("treats other Supabase accounts as signed out", async () => {
    signedInAs({})

    const response = await proxy(request("/chat", AUTH_COOKIE))

    expect(redirectTarget(response)).toBe("/sign-in?next=%2Fchat")
  })

  it("does not add a redirect for the home page", async () => {
    const response = await proxy(request("/"))

    expect(redirectTarget(response)).toBe("/sign-in")
  })

  it("answers API requests with 401 instead of a redirect", async () => {
    const response = await proxy(request("/api/chat"))

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: "Unauthorized" })
  })
})
