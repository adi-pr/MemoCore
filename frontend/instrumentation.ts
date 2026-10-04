export async function register() {
  // Fail at startup, not on the first request that needs a missing variable.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./lib/env")
  }
}
