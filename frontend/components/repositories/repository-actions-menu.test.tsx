import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { RepositoryActionsMenu } from "@/components/repositories/repository-actions-menu"
import { makeRepository } from "@/test/fixtures"

const mocks = vi.hoisted(() => ({
  setRepositoryActive: vi.fn(),
  updateRepository: vi.fn(),
}))

vi.mock("@/lib/repository-actions", () => mocks)

beforeEach(() => {
  vi.clearAllMocks()
})

async function openMenu(...args: Parameters<typeof makeRepository>) {
  const user = userEvent.setup()
  render(<RepositoryActionsMenu repository={makeRepository(...args)} />)
  await user.click(screen.getByRole("button", { name: "Actions for me/wiki" }))
  return user
}

describe("RepositoryActionsMenu", () => {
  it("deactivates after confirming", async () => {
    mocks.setRepositoryActive.mockResolvedValue({ error: null })
    const user = await openMenu()

    await user.click(screen.getByRole("menuitem", { name: /Deactivate/ }))
    expect(
      screen.getByRole("alertdialog", { name: "Deactivate me/wiki?" }),
    ).toBeVisible()

    await user.click(screen.getByRole("button", { name: "Deactivate" }))

    expect(mocks.setRepositoryActive).toHaveBeenCalledWith(
      "00000000-0000-0000-0000-000000000001",
      false,
    )
    await waitFor(() =>
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
    )
  })

  it("keeps the confirmation open and shows errors", async () => {
    mocks.setRepositoryActive.mockResolvedValue({
      error: "Could not reach the backend",
    })
    const user = await openMenu()

    await user.click(screen.getByRole("menuitem", { name: /Deactivate/ }))
    await user.click(screen.getByRole("button", { name: "Deactivate" }))

    expect(await screen.findByText("Could not reach the backend")).toBeVisible()
    expect(screen.getByRole("alertdialog")).toBeInTheDocument()
  })

  it("does nothing when the confirmation is cancelled", async () => {
    const user = await openMenu()

    await user.click(screen.getByRole("menuitem", { name: /Deactivate/ }))
    await user.click(screen.getByRole("button", { name: "Cancel" }))

    expect(mocks.setRepositoryActive).not.toHaveBeenCalled()
  })

  it("reactivates inactive repositories without confirming", async () => {
    mocks.setRepositoryActive.mockResolvedValue({ error: null })
    const user = await openMenu({ is_active: false })

    await user.click(screen.getByRole("menuitem", { name: "Reactivate" }))

    expect(mocks.setRepositoryActive).toHaveBeenCalledWith(
      "00000000-0000-0000-0000-000000000001",
      true,
    )
  })

  it("edits the name and branch", async () => {
    mocks.updateRepository.mockResolvedValue({
      status: "success",
      fieldErrors: {},
      formError: null,
    })
    const user = await openMenu()

    await user.click(screen.getByRole("menuitem", { name: /Edit/ }))
    const branch = screen.getByLabelText("Branch")
    expect(branch).toHaveValue("main")

    await user.clear(branch)
    await user.type(branch, "docs")
    await user.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    )
    const formData = mocks.updateRepository.mock.calls[0][2] as FormData
    expect(mocks.updateRepository.mock.calls[0][0]).toBe(
      "00000000-0000-0000-0000-000000000001",
    )
    expect(formData.get("branch")).toBe("docs")
    expect(formData.get("name")).toBe("wiki")
  })
})
