import "server-only"
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
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
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

export const env = parseEnv(process.env)
