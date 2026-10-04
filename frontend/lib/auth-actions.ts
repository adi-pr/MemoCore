"use server"

import { isAPIError } from "better-auth/api"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { z } from "zod"

import { auth } from "@/lib/auth"
import { safeRedirectPath } from "@/lib/redirects"

export type SignInState = {
  error: string | null
  email: string
}

export async function signIn(
  _previous: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim()
  const password = String(formData.get("password") ?? "")

  if (!email || !password) {
    return { error: "Enter your email and password.", email }
  }

  try {
    await auth.api.signInEmail({
      body: { email, password },
      headers: await headers(),
    })
  } catch (error) {
    if (isAPIError(error)) {
      return { error: error.message || "Sign in failed.", email }
    }

    throw error
  }

  redirect(safeRedirectPath(formData.get("next")))
}

export async function signOut() {
  await auth.api.signOut({ headers: await headers() })
  redirect("/sign-in")
}

const setupSchema = z
  .object({
    name: z.string().trim().min(1, "Enter your name."),
    email: z.string().trim().pipe(z.email("Enter a valid email address.")),
    password: z.string().min(8, "Use at least 8 characters."),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords don't match.",
    path: ["confirmPassword"],
  })

type SetupField = keyof z.infer<typeof setupSchema>

export type SetupState = {
  fieldErrors: Partial<Record<SetupField, string>>
  formError: string | null
  values: { name: string; email: string }
}

/** Creates the one MemoCore account, signs in and opens the app. */
export async function completeSetup(
  _previous: SetupState,
  formData: FormData,
): Promise<SetupState> {
  const input = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  }
  const values = { name: input.name.trim(), email: input.email.trim() }
  const parsed = setupSchema.safeParse(input)

  if (!parsed.success) {
    const fieldErrors: SetupState["fieldErrors"] = {}

    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as SetupField
      fieldErrors[field] ??= issue.message
    }

    return { fieldErrors, formError: null, values }
  }

  try {
    // Signs in automatically; nextCookies() sets the session cookie.
    await auth.api.signUpEmail({
      body: {
        name: parsed.data.name,
        email: parsed.data.email,
        password: parsed.data.password,
      },
      headers: await headers(),
    })
  } catch (error) {
    if (isAPIError(error)) {
      if (error.body?.code === "ACCOUNT_EXISTS") {
        redirect("/sign-in")
      }

      return {
        fieldErrors: {},
        formError: error.message || "Setup failed.",
        values,
      }
    }

    throw error
  }

  redirect("/chat")
}
