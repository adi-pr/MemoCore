"use server"

import { revalidatePath } from "next/cache"

import { api } from "@/lib/api/client"
import { ApiError, unwrap } from "@/lib/api/errors"
import { isValidBranch, parseGitHubRepository } from "@/lib/github"
import { requireUser } from "@/lib/session"

export type AddRepositoryState = {
  status: "idle" | "error" | "success"
  fieldErrors: { repository?: string; branch?: string }
  formError: string | null
  values: { repository: string; branch: string }
}

export async function addRepository(
  _previous: AddRepositoryState,
  formData: FormData,
): Promise<AddRepositoryState> {
  await requireUser()

  const values = {
    repository: String(formData.get("repository") ?? "").trim(),
    branch: String(formData.get("branch") ?? "").trim() || "main",
  }
  const parsed = parseGitHubRepository(values.repository)
  const fieldErrors: AddRepositoryState["fieldErrors"] = {}

  if (!parsed) {
    fieldErrors.repository =
      "Enter a GitHub URL or owner/repo, like github.com/me/wiki."
  }

  if (!isValidBranch(values.branch)) {
    fieldErrors.branch = "Enter a valid branch name."
  }

  if (!parsed || Object.keys(fieldErrors).length > 0) {
    return { status: "error", fieldErrors, formError: null, values }
  }

  try {
    await unwrap(
      api.POST("/repositories", {
        body: {
          name: parsed.repo,
          full_name: parsed.fullName,
          clone_url: `https://github.com/${parsed.fullName}`,
          default_branch: values.branch,
        },
      }),
    )
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 409) {
        return {
          status: "error",
          fieldErrors: { repository: `${parsed.fullName} is already added.` },
          formError: null,
          values,
        }
      }

      return {
        status: "error",
        fieldErrors: {},
        formError: error.message,
        values,
      }
    }

    throw error
  }

  revalidatePath("/repositories")

  return {
    status: "success",
    fieldErrors: {},
    formError: null,
    values: { repository: "", branch: "main" },
  }
}

export type EditRepositoryState = {
  status: "idle" | "error" | "success"
  fieldErrors: { name?: string; branch?: string }
  formError: string | null
}

export async function updateRepository(
  repositoryId: string,
  _previous: EditRepositoryState,
  formData: FormData,
): Promise<EditRepositoryState> {
  await requireUser()

  const name = String(formData.get("name") ?? "").trim()
  const branch = String(formData.get("branch") ?? "").trim()
  const fieldErrors: EditRepositoryState["fieldErrors"] = {}

  if (!name || name.length > 255) {
    fieldErrors.name = "Enter a name up to 255 characters."
  }

  if (!isValidBranch(branch)) {
    fieldErrors.branch = "Enter a valid branch name."
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { status: "error", fieldErrors, formError: null }
  }

  try {
    await unwrap(
      api.PATCH("/repositories/{repository_id}", {
        params: { path: { repository_id: repositoryId } },
        body: { name, default_branch: branch },
      }),
    )
  } catch (error) {
    if (error instanceof ApiError) {
      return { status: "error", fieldErrors: {}, formError: error.message }
    }

    throw error
  }

  revalidatePath("/repositories")

  return { status: "success", fieldErrors: {}, formError: null }
}

/**
 * Deactivating keeps the indexed data but stops syncing and removes the
 * repository from search; reactivating brings it back.
 */
export async function setRepositoryActive(
  repositoryId: string,
  active: boolean,
): Promise<{ error: string | null }> {
  await requireUser()

  const params = { path: { repository_id: repositoryId } }

  try {
    await unwrap(
      active
        ? api.PATCH("/repositories/{repository_id}", {
            params,
            body: { is_active: true },
          })
        : api.DELETE("/repositories/{repository_id}", { params }),
    )
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message }
    }

    throw error
  }

  revalidatePath("/repositories")

  return { error: null }
}
