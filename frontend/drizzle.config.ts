import { loadEnvConfig } from "@next/env"
import { defineConfig } from "drizzle-kit"

loadEnvConfig(process.cwd())

export default defineConfig({
  dialect: "postgresql",
  schema: "./db/schema.ts",
  out: "./drizzle",
  // Only manage the frontend's schema; public belongs to the backend.
  schemaFilter: ["app"],
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
