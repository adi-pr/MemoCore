import "server-only"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { APIError } from "better-auth/api"
import { nextCookies } from "better-auth/next-js"
import { count } from "drizzle-orm"

import { db } from "@/db"
import * as schema from "@/db/schema"
import { env } from "@/lib/env"

const DAY_SECONDS = 60 * 60 * 24

/** MemoCore has a single account, created on first run. */
export async function hasAccount(): Promise<boolean> {
  const [row] = await db.select({ value: count() }).from(schema.user)
  return row.value > 0
}

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  session: {
    // Personal app: stay signed in for a month, refreshed daily on use.
    expiresIn: 30 * DAY_SECONDS,
    updateAge: DAY_SECONDS,
  },
  databaseHooks: {
    user: {
      create: {
        // Enforced here rather than with disableSignUp, which would also
        // block creating the first account during setup.
        before: async (user) => {
          if (await hasAccount()) {
            throw APIError.from("FORBIDDEN", {
              code: "ACCOUNT_EXISTS",
              message: "MemoCore already has an account",
            })
          }

          return { data: user }
        },
      },
    },
  },
  // Lets Server Actions set auth cookies. Must be the last plugin.
  plugins: [nextCookies()],
})
