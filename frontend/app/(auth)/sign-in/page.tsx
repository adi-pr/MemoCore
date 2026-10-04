import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { connection } from "next/server"

import { AuthCard } from "@/components/auth/auth-card"
import { SignInForm } from "@/components/auth/sign-in-form"
import { hasAccount } from "@/lib/auth"
import { safeRedirectPath } from "@/lib/redirects"
import { getUser } from "@/lib/session"

export const metadata: Metadata = { title: "Sign in · MemoCore" }

export default async function SignInPage({
  searchParams,
}: PageProps<"/sign-in">) {
  // Depends on the database, so render per request, never at build time.
  await connection()

  if (!(await hasAccount())) {
    redirect("/setup")
  }

  const { next } = await searchParams

  if (await getUser()) {
    redirect(safeRedirectPath(next))
  }

  return (
    <AuthCard title="Sign in" description="Welcome back to MemoCore.">
      <SignInForm next={typeof next === "string" ? next : undefined} />
    </AuthCard>
  )
}
