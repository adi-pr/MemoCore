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
