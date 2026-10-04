export const DEFAULT_REDIRECT = "/chat"

/**
 * Returns value if it is a path within this app, otherwise the fallback.
 * Rejects absolute and protocol-relative URLs so a crafted ?next= link
 * can't send you to another site after signing in.
 */
export function safeRedirectPath(
  value: unknown,
  fallback: string = DEFAULT_REDIRECT,
): string {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.startsWith("/\\")
  ) {
    return fallback
  }

  return value
}
