"use server"

import { isAPIError } from "better-auth/api"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

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
