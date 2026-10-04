import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  addRepository,
  setRepositoryActive,
  updateRepository,
} from "@/lib/repository-actions"

const mocks = vi.hoisted(() => ({
  POST: vi.fn(),
  PATCH: vi.fn(),
  DELETE: vi.fn(),
  requireUser: vi.fn(),
  revalidatePath: vi.fn(),
}))

vi.mock("@/lib/api/client", () => ({
  api: { POST: mocks.POST, PATCH: mocks.PATCH, DELETE: mocks.DELETE },
}))
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

describe("updateRepository", () => {
  const initialEdit = {
    status: "idle" as const,
    fieldErrors: {},
    formError: null,
  }
  const params = { path: { repository_id: "repo-1" } }

  it("validates the name and branch", async () => {
    const state = await updateRepository(
      "repo-1",
      initialEdit,
      form({ name: " ", branch: "bad branch" }),
    )

    expect(state.fieldErrors).toEqual({
      name: "Enter a name up to 255 characters.",
      branch: "Enter a valid branch name.",
    })
    expect(mocks.PATCH).not.toHaveBeenCalled()
  })

  it("saves trimmed values and refreshes the list", async () => {
    mocks.PATCH.mockResolvedValue(respond(200, { id: "repo-1" }))

    const state = await updateRepository(
      "repo-1",
      initialEdit,
      form({ name: " Wiki ", branch: " docs " }),
    )

    expect(mocks.PATCH).toHaveBeenCalledWith("/repositories/{repository_id}", {
      params,
      body: { name: "Wiki", default_branch: "docs" },
    })
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/repositories")
    expect(state.status).toBe("success")
  })

  it("shows backend errors", async () => {
    mocks.PATCH.mockResolvedValue(
      respond(404, { detail: "Repository not found" }),
    )

    const state = await updateRepository(
      "repo-1",
      initialEdit,
      form({ name: "Wiki", branch: "main" }),
    )

    expect(state.formError).toBe("Repository not found")
  })
})

describe("setRepositoryActive", () => {
  const params = { path: { repository_id: "repo-1" } }

  it("deactivates through DELETE", async () => {
    mocks.DELETE.mockResolvedValue(respond(200, { id: "repo-1" }))

    expect(await setRepositoryActive("repo-1", false)).toEqual({ error: null })
    expect(mocks.DELETE).toHaveBeenCalledWith("/repositories/{repository_id}", {
      params,
    })
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/repositories")
  })

  it("reactivates through PATCH", async () => {
    mocks.PATCH.mockResolvedValue(respond(200, { id: "repo-1" }))

    await setRepositoryActive("repo-1", true)

    expect(mocks.PATCH).toHaveBeenCalledWith("/repositories/{repository_id}", {
      params,
      body: { is_active: true },
    })
  })

  it("returns backend errors", async () => {
    mocks.DELETE.mockRejectedValue(new TypeError("fetch failed"))

    expect(await setRepositoryActive("repo-1", false)).toEqual({
      error: "Could not reach the backend",
    })
    expect(mocks.revalidatePath).not.toHaveBeenCalled()
  })

  it("checks the session first", async () => {
    mocks.requireUser.mockRejectedValue(new Error("NEXT_REDIRECT /sign-in"))

    await expect(setRepositoryActive("repo-1", false)).rejects.toThrow(
      "NEXT_REDIRECT",
    )
    expect(mocks.DELETE).not.toHaveBeenCalled()
  })
})
