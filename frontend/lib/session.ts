import "server-only"
import { headers } from "next/headers"
import { cache } from "react"

import { auth } from "@/lib/auth"

/** The current session, or null. Deduplicated per request. */
export const getSession = cache(async () =>
  auth.api.getSession({ headers: await headers() }),
)
