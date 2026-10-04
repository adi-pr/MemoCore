import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { connection } from "next/server"

import { AuthCard } from "@/components/auth/auth-card"
import { SetupForm } from "@/components/auth/setup-form"
import { hasAccount } from "@/lib/auth"

export const metadata: Metadata = { title: "Set up · MemoCore" }

export default async function SetupPage() {
  // Depends on the database, so render per request, never at build time.
  await connection()

  if (await hasAccount()) {
    redirect("/sign-in")
  }

  return (
    <AuthCard
      title="Set up MemoCore"
      description="Create the account you'll sign in with. This is the only account MemoCore will have."
    >
      <SetupForm />
    </AuthCard>
  )
}
