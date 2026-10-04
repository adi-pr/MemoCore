import { describe, expect, it } from "vitest"

import { parseEnv } from "@/lib/env"

const valid = {
  API_URL: "http://localhost:8000",
  LMSTUDIO_HOST: "http://localhost:1234",
  LLM_MODEL: "openai/gpt-oss-20b",
  SUPABASE_URL: "http://192.168.100.221:8000",
  SUPABASE_SECRET_KEY: "sb_secret_example",
}

describe("parseEnv", () => {
  it("returns the parsed variables", () => {
    expect(parseEnv(valid)).toEqual(valid)
  })

  it("strips trailing slashes from base URLs", () => {
    const env = parseEnv({
      ...valid,
      API_URL: "http://localhost:8000/",
      LMSTUDIO_HOST: "http://localhost:1234//",
    })

    expect(env.API_URL).toBe("http://localhost:8000")
    expect(env.LMSTUDIO_HOST).toBe("http://localhost:1234")
  })

  it("lists every missing variable", () => {
    expect(() => parseEnv({})).toThrow(
      /API_URL[\s\S]*LMSTUDIO_HOST[\s\S]*LLM_MODEL/,
    )
  })

  it("rejects an invalid URL", () => {
    expect(() => parseEnv({ ...valid, API_URL: "localhost:8000" })).toThrow(
      /API_URL/,
    )
  })

  it("requires the Supabase secret key", () => {
    expect(() => parseEnv({ ...valid, SUPABASE_SECRET_KEY: "" })).toThrow(
      /SUPABASE_SECRET_KEY/,
    )
  })

  it("rejects an empty model name", () => {
    expect(() => parseEnv({ ...valid, LLM_MODEL: "" })).toThrow(/LLM_MODEL/)
  })
})
