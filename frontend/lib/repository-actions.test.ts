import { beforeEach, describe, expect, it, vi } from "vitest"

import { addRepository } from "@/lib/repository-actions"

const mocks = vi.hoisted(() => ({
  POST: vi.fn(),
  requireUser: vi.fn(),
  revalidatePath: vi.fn(),
}))

vi.mock("@/lib/api/client", () => ({ api: { POST: mocks.POST } }))
vi.mock("@/lib/session", () => ({ requireUser: mocks.requireUser }))
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }))

const initial = {
  status: "idle" as const,
  fieldErrors: {},
  formError: null,
  values: { repository: "", branch: "main" },
}

function form(fields: Record<string, string>) {
  const data = new FormData()
  for (const [key, value] of Object.entries(fields)) data.set(key, value)
  return data
}

function respond(status: number, body: unknown) {
  const response = new Response(JSON.stringify(body), { status })
  return status < 400 ? { data: body, response } : { error: body, response }
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.requireUser.mockResolvedValue({ id: "owner" })
})

describe("addRepository", () => {
  it("checks the session first", async () => {
    mocks.requireUser.mockRejectedValue(new Error("NEXT_REDIRECT /sign-in"))

    await expect(
      addRepository(initial, form({ repository: "me/wiki" })),
    ).rejects.toThrow("NEXT_REDIRECT /sign-in")
    expect(mocks.POST).not.toHaveBeenCalled()
  })

  it("rejects input that isn't a GitHub repository", async () => {
    const state = await addRepository(
      initial,
      form({ repository: "https://gitlab.com/me/wiki", branch: "bad branch" }),
    )

    expect(state.status).toBe("error")
    expect(state.fieldErrors.repository).toMatch(/GitHub URL/)
    expect(state.fieldErrors.branch).toBe("Enter a valid branch name.")
    expect(state.values.repository).toBe("https://gitlab.com/me/wiki")
    expect(mocks.POST).not.toHaveBeenCalled()
  })

  it("adds the repository and refreshes the list", async () => {
    mocks.POST.mockResolvedValue(respond(201, { id: "repo-1" }))

    const state = await addRepository(
      initial,
      form({ repository: "https://github.com/me/wiki.git", branch: "" }),
    )

    expect(mocks.POST).toHaveBeenCalledWith("/repositories", {
      body: {
        name: "wiki",
        full_name: "me/wiki",
        clone_url: "https://github.com/me/wiki",
        default_branch: "main",
      },
    })
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/repositories")
    expect(state.status).toBe("success")
  })

  it("explains when the repository is already added", async () => {
    mocks.POST.mockResolvedValue(
      respond(409, { detail: "Repository already exists" }),
    )

    const state = await addRepository(initial, form({ repository: "me/wiki" }))

    expect(state.fieldErrors.repository).toBe("me/wiki is already added.")
    expect(mocks.revalidatePath).not.toHaveBeenCalled()
  })

  it("shows other backend errors on the form", async () => {
    mocks.POST.mockRejectedValue(new TypeError("fetch failed"))

    const state = await addRepository(initial, form({ repository: "me/wiki" }))

    expect(state.formError).toBe("Could not reach the backend")
  })
})
