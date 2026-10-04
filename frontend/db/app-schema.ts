import { pgSchema } from "drizzle-orm/pg-core"

/**
 * Frontend tables live in their own Postgres schema so they never mix
 * with the backend's tables in public.
 */
export const appSchema = pgSchema("app")
