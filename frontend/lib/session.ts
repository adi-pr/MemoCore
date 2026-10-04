import "server-only"
import type { User } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import { cache } from "react"

import { isOwner } from "@/lib/owner"
import { createAuthClient } from "@/lib/supabase/server"

/**
 * The signed-in MemoCore user, or null. Verified with Supabase Auth, not
 * just read from the cookie. Deduplicated per request.
 */
export const getUser = cache(async (): Promise<User | null> => {
  const supabase = await createAuthClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return isOwner(user) ? user : null
})

/** The signed-in user; redirects to sign in when there is none. */
export async function requireUser(): Promise<User> {
  const user = await getUser()

  if (!user) {
    redirect("/sign-in")
  }

  return user
}

/** Name to show for the user, falling back to their email. */
export function displayName(user: User): string {
  const name = user.user_metadata?.name

  return typeof name === "string" && name.trim() ? name : (user.email ?? "")
}
