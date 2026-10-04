import "server-only"
import createClient from "openapi-fetch"

import { env } from "@/lib/env"
import type { paths } from "@/lib/api/schema"

export function createApiClient(
  baseUrl: string,
  fetch?: typeof globalThis.fetch,
) {
  return createClient<paths>({ baseUrl, fetch })
}

/** Typed client for the FastAPI backend. Server-side only. */
export const api = createApiClient(env.API_URL)
