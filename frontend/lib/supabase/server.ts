import "server-only"
import { createServerClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

import { env } from "@/lib/env"

/**
 * Supabase client bound to this request's auth cookies, for sign-in,
 * sign-out and reading the current user.
 */
export async function createAuthClient() {
  const cookieStore = await cookies()

  return createServerClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options)
          }
        } catch {
          // Server Components can't set cookies. proxy.ts refreshes the
          // session on every request, so nothing is lost.
        }
      },
    },
  })
}

/**
 * Admin client using the secret key and no user session. It bypasses row
 * level security, so only call it after checking the user is signed in.
 */
export const supabaseAdmin = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SECRET_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
)
