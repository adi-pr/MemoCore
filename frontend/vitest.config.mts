import tsconfigPaths from "vite-tsconfig-paths"
import { defineConfig } from "vitest/config"

export default defineConfig({
  // Vite compiles JSX itself; the React plugin only adds Fast Refresh.
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      // The real package throws outside React Server Components.
      "server-only": new URL("./test/server-only.ts", import.meta.url).pathname,
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    // lib/env.ts validates on import, so tests need a valid environment.
    env: {
      API_URL: "http://backend.test",
      LMSTUDIO_HOST: "http://lmstudio.test",
      LLM_MODEL: "test-model",
      DATABASE_URL: "postgres://test:test@localhost:5432/test",
      BETTER_AUTH_SECRET: "test-secret-that-is-at-least-32-characters",
      BETTER_AUTH_URL: "http://localhost:3000",
    },
  },
})
