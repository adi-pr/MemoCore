"use server"

import { redirect } from "next/navigation"
import { z } from "zod"

import { hasAccount } from "@/lib/auth"
import { isOwner, OWNER_FLAG } from "@/lib/owner"
import { safeRedirectPath } from "@/lib/redirects"
import { createAuthClient, supabaseAdmin } from "@/lib/supabase/server"

const INVALID_CREDENTIALS = "Invalid email or password"

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

  const supabase = await createAuthClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return {
      error:
        error.code === "invalid_credentials"
          ? INVALID_CREDENTIALS
          : error.message || "Sign in failed.",
      email,
    }
  }

  // Another account on this Supabase: same message as a wrong password.
  if (!isOwner(data.user)) {
    await supabase.auth.signOut()
    return { error: INVALID_CREDENTIALS, email }
  }

  redirect(safeRedirectPath(formData.get("next")))
}

export async function signOut() {
  const supabase = await createAuthClient()
  await supabase.auth.signOut()
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

  if (await hasAccount()) {
    redirect("/sign-in")
  }

  const { name, email, password } = parsed.data

  // The admin API confirms the email directly, so no SMTP is needed.
  const { error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
    app_metadata: { [OWNER_FLAG]: true },
  })

  if (createError) {
    return {
      fieldErrors:
        createError.code === "email_exists"
          ? {
              email:
                "This email already has a Supabase account. Use a different one.",
            }
          : {},
      formError:
        createError.code === "email_exists"
          ? null
          : createError.message || "Setup failed.",
      values,
    }
  }

  const supabase = await createAuthClient()
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (signInError) {
    redirect("/sign-in")
  }

  redirect("/chat")
}
