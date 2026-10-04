import type { Metadata } from "next"

import { AuthCard } from "@/components/auth/auth-card"
import { SignInForm } from "@/components/auth/sign-in-form"

export const metadata: Metadata = { title: "Sign in · MemoCore" }

export default async function SignInPage({
  searchParams,
}: PageProps<"/sign-in">) {
  const { next } = await searchParams

  return (
    <AuthCard title="Sign in" description="Welcome back to MemoCore.">
      <SignInForm next={typeof next === "string" ? next : undefined} />
    </AuthCard>
  )
}
