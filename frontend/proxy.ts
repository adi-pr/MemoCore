import { getSessionCookie } from "better-auth/cookies"
import { NextResponse, type NextRequest } from "next/server"

const PUBLIC_PATHS = new Set(["/sign-in", "/setup"])

/**
 * Optimistic auth check: only looks for a session cookie, so it needs no
 * database. Pages verify the session itself (see requireSession).
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  if (PUBLIC_PATHS.has(pathname) || getSessionCookie(request)) {
    return NextResponse.next()
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
  // Everything except Better Auth's own routes, Next internals and files.
  matcher: ["/((?!api/auth|_next/static|_next/image|.*\\..*).*)"],
}
