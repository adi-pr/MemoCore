import "server-only"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import { env } from "@/lib/env"
import * as schema from "@/db/schema"

// Reuse one connection pool across dev hot reloads.
const globalForDb = globalThis as unknown as {
  sql?: ReturnType<typeof postgres>
}

const sql = globalForDb.sql ?? postgres(env.DATABASE_URL, { max: 5 })

if (process.env.NODE_ENV !== "production") {
  globalForDb.sql = sql
}

export const db = drizzle(sql, { schema })
