import { APIError } from "better-auth/api"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { completeSetup, signIn, signOut } from "@/lib/auth-actions"

const mocks = vi.hoisted(() => ({
  signInEmail: vi.fn(),
  signUpEmail: vi.fn(),
  signOut: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT ${path}`)
  }),
}))

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      signInEmail: mocks.signInEmail,
      signUpEmail: mocks.signUpEmail,
      signOut: mocks.signOut,
    },
  },
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

describe("completeSetup", () => {
  const initialSetup = {
    fieldErrors: {},
    formError: null,
    values: { name: "", email: "" },
  }
  const valid = {
    name: " Ruben ",
    email: " me@example.com ",
    password: "correct-horse",
    confirmPassword: "correct-horse",
  }

  it("reports each invalid field and keeps name and email", async () => {
    const state = await completeSetup(
      initialSetup,
      form({
        name: " ",
        email: "not-an-email",
        password: "short",
        confirmPassword: "different",
      }),
    )

    expect(state.fieldErrors).toEqual({
      name: "Enter your name.",
      email: "Enter a valid email address.",
      password: "Use at least 8 characters.",
      confirmPassword: "Passwords don't match.",
    })
    expect(state.values).toEqual({ name: "", email: "not-an-email" })
    expect(mocks.signUpEmail).not.toHaveBeenCalled()
  })

  it("rejects mismatched passwords", async () => {
    const state = await completeSetup(
      initialSetup,
      form({ ...valid, confirmPassword: "something-else" }),
    )

    expect(state.fieldErrors).toEqual({
      confirmPassword: "Passwords don't match.",
    })
  })

  it("creates the account with trimmed values and opens the app", async () => {
    mocks.signUpEmail.mockResolvedValue({})

    await expect(completeSetup(initialSetup, form(valid))).rejects.toThrow(
      "NEXT_REDIRECT /chat",
    )

    expect(mocks.signUpEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        body: {
          name: "Ruben",
          email: "me@example.com",
          password: "correct-horse",
        },
      }),
    )
  })

  it("sends you to sign in when an account already exists", async () => {
    mocks.signUpEmail.mockRejectedValue(
      APIError.from("FORBIDDEN", {
        code: "ACCOUNT_EXISTS",
        message: "MemoCore already has an account",
      }),
    )

    await expect(completeSetup(initialSetup, form(valid))).rejects.toThrow(
      "NEXT_REDIRECT /sign-in",
    )
  })

  it("shows other Better Auth errors on the form", async () => {
    mocks.signUpEmail.mockRejectedValue(
      APIError.from("TOO_MANY_REQUESTS", {
        code: "RATE_LIMITED",
        message: "Too many requests",
      }),
    )

    const state = await completeSetup(initialSetup, form(valid))

    expect(state.formError).toBe("Too many requests")
    expect(state.values).toEqual({ name: "Ruben", email: "me@example.com" })
  })
})
