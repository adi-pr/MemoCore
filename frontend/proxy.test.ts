import { NextRequest } from "next/server"
import { describe, expect, it } from "vitest"

import { proxy } from "@/proxy"

const SESSION_COOKIE = "better-auth.session_token=abc.def"

function request(path: string, cookie?: string) {
  return new NextRequest(`http://localhost:3000${path}`, {
    headers: cookie ? { cookie } : {},
  })
}

function redirectTarget(response: Response) {
  const location = response.headers.get("location")
  return location && new URL(location).pathname + new URL(location).search
}

describe("proxy", () => {
  it("lets requests with a session cookie through", () => {
    const response = proxy(request("/repositories", SESSION_COOKIE))

    expect(response.headers.get("x-middleware-next")).toBe("1")
  })

  it.each(["/sign-in", "/setup"])("leaves %s public", (path) => {
    const response = proxy(request(path))

    expect(response.headers.get("x-middleware-next")).toBe("1")
  })

  it("sends signed-out visitors to sign in and back afterwards", () => {
    const response = proxy(request("/repositories?tab=jobs"))

    expect(response.status).toBe(307)
    expect(redirectTarget(response)).toBe(
      "/sign-in?next=%2Frepositories%3Ftab%3Djobs",
    )
  })

  it("does not add a redirect for the home page", () => {
    const response = proxy(request("/"))

    expect(redirectTarget(response)).toBe("/sign-in")
  })

  it("answers API requests with 401 instead of a redirect", async () => {
    const response = proxy(request("/api/chat"))

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: "Unauthorized" })
  })
})
