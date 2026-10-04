import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

import { isOwner } from "@/lib/owner"

const PUBLIC_PATHS = new Set(["/sign-in", "/setup"])

/**
 * Refreshes the Supabase session on every request (pages can't write
 * cookies) and keeps signed-out visitors away from the app. Pages still
 * check the user themselves with requireUser().
 *
 * Reads process.env directly because lib/env is server-only; the values
 * are validated at startup.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value)
          }
          response = NextResponse.next({ request })
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options)
          }
        },
      },
    },
  )

  const { pathname, search } = request.nextUrl

  if (PUBLIC_PATHS.has(pathname)) {
    return response
  }

  // Skip the network round trip when there is no auth cookie at all.
  const hasAuthCookie = request.cookies
    .getAll()
    .some(({ name }) => name.startsWith("sb-") && name.includes("-auth-token"))

  const user = hasAuthCookie ? (await supabase.auth.getUser()).data.user : null

  if (isOwner(user)) {
    return response
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const signIn = new URL("/sign-in", request.url)

  if (pathname !== "/") {
    signIn.searchParams.set("next", `${pathname}${search}`)
  }

  return NextResponse.redirect(signIn)
}

export const config = {
  // Everything except Next internals and files.
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
}
