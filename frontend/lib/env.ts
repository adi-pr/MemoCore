import "server-only"
import { PHASE_PRODUCTION_BUILD } from "next/constants"
import { z } from "zod"

// Base URLs are stored without a trailing slash so paths can be appended.
// The protocol check rejects "localhost:8000", which parses as a URL with
// a "localhost:" scheme.
const baseUrl = z
  .url({ protocol: /^https?$/ })
  .transform((url) => url.replace(/\/+$/, ""))

const envSchema = z.object({
  API_URL: baseUrl,
  LMSTUDIO_HOST: baseUrl,
  LLM_MODEL: z.string().min(1),
  SUPABASE_URL: baseUrl,
  // Secret key (sb_secret_...): admin access, so it must stay server-side.
  SUPABASE_SECRET_KEY: z.string().min(1),
})

export type Env = z.infer<typeof envSchema>

export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(source)

  if (!result.success) {
    throw new Error(
      `Invalid environment variables:\n${z.prettifyError(result.error)}`,
    )
  }

  return result.data
}

// next build imports server modules to collect page data but never serves
// a request, so it gets placeholders instead of runtime config (e.g. in a
// Docker build). The server validates the real values at startup.
const BUILD_PLACEHOLDERS: Env = {
  API_URL: "http://build.invalid",
  LMSTUDIO_HOST: "http://build.invalid",
  LLM_MODEL: "build-placeholder",
  SUPABASE_URL: "http://build.invalid",
  SUPABASE_SECRET_KEY: "build-placeholder",
}

export const env: Env =
  process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD
    ? BUILD_PLACEHOLDERS
    : parseEnv(process.env)
