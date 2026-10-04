import { beforeEach, describe, expect, it, vi } from "vitest"

import { completeSetup, signIn, signOut } from "@/lib/auth-actions"

const owner = { id: "1", app_metadata: { memocore_owner: true } }
const stranger = { id: "2", app_metadata: {} }

const mocks = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  createUser: vi.fn(),
  hasAccount: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT ${path}`)
  }),
}))

vi.mock("@/lib/supabase/server", () => ({
  createAuthClient: async () => ({
    auth: {
      signInWithPassword: mocks.signInWithPassword,
      signOut: mocks.signOut,
    },
  }),
  supabaseAdmin: { auth: { admin: { createUser: mocks.createUser } } },
}))
vi.mock("@/lib/auth", () => ({ hasAccount: mocks.hasAccount }))
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }))

function form(fields: Record<string, string>) {
  const data = new FormData()
  for (const [key, value] of Object.entries(fields)) data.set(key, value)
  return data
}

function authError(code: string, message: string) {
  return { data: { user: null, session: null }, error: { code, message } }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("signIn", () => {
  const initial = { error: null, email: "" }

  it("asks for missing fields without calling Supabase", async () => {
    const state = await signIn(initial, form({ email: " me@example.com " }))

    expect(state).toEqual({
      error: "Enter your email and password.",
      email: "me@example.com",
    })
    expect(mocks.signInWithPassword).not.toHaveBeenCalled()
  })

  it("reports wrong credentials and keeps the email", async () => {
    mocks.signInWithPassword.mockResolvedValue(
      authError("invalid_credentials", "Invalid login credentials"),
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

  it("passes other Supabase errors through", async () => {
    mocks.signInWithPassword.mockResolvedValue(
      authError("over_request_rate_limit", "Too many requests"),
    )

    const state = await signIn(
      initial,
      form({ email: "me@example.com", password: "password" }),
    )

    expect(state.error).toBe("Too many requests")
  })

  it("rejects other accounts on the same Supabase", async () => {
    mocks.signInWithPassword.mockResolvedValue({
      data: { user: stranger },
      error: null,
    })

    const state = await signIn(
      initial,
      form({ email: "other@example.com", password: "password" }),
    )

    expect(state.error).toBe("Invalid email or password")
    expect(mocks.signOut).toHaveBeenCalled()
  })

  it("redirects to the requested page after signing in", async () => {
    mocks.signInWithPassword.mockResolvedValue({
      data: { user: owner },
      error: null,
    })

    await expect(
      signIn(
        initial,
        form({
          email: "me@example.com",
          password: "correct-horse",
          next: "/repositories",
        }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT /repositories")

    expect(mocks.signInWithPassword).toHaveBeenCalledWith({
      email: "me@example.com",
      password: "correct-horse",
    })
  })

  it("ignores redirects to other sites", async () => {
    mocks.signInWithPassword.mockResolvedValue({
      data: { user: owner },
      error: null,
    })

    await expect(
      signIn(
        initial,
        form({
          email: "me@example.com",
          password: "correct-horse",
          next: "https://evil.example",
        }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT /chat")
  })
})

describe("signOut", () => {
  it("ends the session and returns to sign in", async () => {
    await expect(signOut()).rejects.toThrow("NEXT_REDIRECT /sign-in")
    expect(mocks.signOut).toHaveBeenCalled()
  })
})

describe("completeSetup", () => {
  const initial = {
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

  beforeEach(() => {
    mocks.hasAccount.mockResolvedValue(false)
    mocks.createUser.mockResolvedValue({ data: { user: owner }, error: null })
    mocks.signInWithPassword.mockResolvedValue({
      data: { user: owner },
      error: null,
    })
  })

  it("reports each invalid field and keeps name and email", async () => {
    const state = await completeSetup(
      initial,
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
    expect(mocks.createUser).not.toHaveBeenCalled()
  })

  it("creates a confirmed owner account, signs in and opens the app", async () => {
    await expect(completeSetup(initial, form(valid))).rejects.toThrow(
      "NEXT_REDIRECT /chat",
    )

    expect(mocks.createUser).toHaveBeenCalledWith({
      email: "me@example.com",
      password: "correct-horse",
      email_confirm: true,
      user_metadata: { name: "Ruben" },
      app_metadata: { memocore_owner: true },
    })
    expect(mocks.signInWithPassword).toHaveBeenCalledWith({
      email: "me@example.com",
      password: "correct-horse",
    })
  })

  it("sends you to sign in when the account already exists", async () => {
    mocks.hasAccount.mockResolvedValue(true)

    await expect(completeSetup(initial, form(valid))).rejects.toThrow(
      "NEXT_REDIRECT /sign-in",
    )
    expect(mocks.createUser).not.toHaveBeenCalled()
  })

  it("flags an email that another Supabase account uses", async () => {
    mocks.createUser.mockResolvedValue(
      authError("email_exists", "A user with this email already exists"),
    )

    const state = await completeSetup(initial, form(valid))

    expect(state.fieldErrors.email).toMatch(/already has a Supabase account/)
    expect(state.formError).toBeNull()
  })

  it("shows other Supabase errors on the form", async () => {
    mocks.createUser.mockResolvedValue(
      authError("unexpected_failure", "Database error creating new user"),
    )

    const state = await completeSetup(initial, form(valid))

    expect(state.formError).toBe("Database error creating new user")
    expect(state.values).toEqual({ name: "Ruben", email: "me@example.com" })
  })
})
