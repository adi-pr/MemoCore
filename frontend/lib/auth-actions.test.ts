import { APIError } from "better-auth/api"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { signIn, signOut } from "@/lib/auth-actions"

const mocks = vi.hoisted(() => ({
  signInEmail: vi.fn(),
  signOut: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT ${path}`)
  }),
}))

vi.mock("@/lib/auth", () => ({
  auth: { api: { signInEmail: mocks.signInEmail, signOut: mocks.signOut } },
}))
vi.mock("next/headers", () => ({ headers: async () => new Headers() }))
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }))

const initial = { error: null, email: "" }

function form(fields: Record<string, string>) {
  const data = new FormData()
  for (const [key, value] of Object.entries(fields)) data.set(key, value)
  return data
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("signIn", () => {
  it("asks for missing fields without calling Better Auth", async () => {
    const state = await signIn(initial, form({ email: " me@example.com " }))

    expect(state).toEqual({
      error: "Enter your email and password.",
      email: "me@example.com",
    })
    expect(mocks.signInEmail).not.toHaveBeenCalled()
  })

  it("returns Better Auth's error and keeps the email", async () => {
    mocks.signInEmail.mockRejectedValue(
      APIError.from("UNAUTHORIZED", {
        code: "INVALID_EMAIL_OR_PASSWORD",
        message: "Invalid email or password",
      }),
    )

    const state = await signIn(
      initial,
      form({ email: "me@example.com", password: "wrong-password" }),
    )

    expect(state).toEqual({
      error: "Invalid email or password",
      email: "me@example.com",
    })
  })

  it("redirects to the requested page after signing in", async () => {
    mocks.signInEmail.mockResolvedValue({})

    await expect(
      signIn(
        initial,
        form({
          email: "me@example.com",
          password: "correct-password",
          next: "/repositories",
        }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT /repositories")

    expect(mocks.signInEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        body: { email: "me@example.com", password: "correct-password" },
      }),
    )
  })

  it("ignores redirects to other sites", async () => {
    mocks.signInEmail.mockResolvedValue({})

    await expect(
      signIn(
        initial,
        form({
          email: "me@example.com",
          password: "correct-password",
          next: "https://evil.example",
        }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT /chat")
  })

  it("rethrows unexpected errors", async () => {
    mocks.signInEmail.mockRejectedValue(new Error("database down"))

    await expect(
      signIn(initial, form({ email: "me@example.com", password: "password" })),
    ).rejects.toThrow("database down")
  })
})

describe("signOut", () => {
  it("ends the session and returns to sign in", async () => {
    await expect(signOut()).rejects.toThrow("NEXT_REDIRECT /sign-in")
    expect(mocks.signOut).toHaveBeenCalled()
  })
})
