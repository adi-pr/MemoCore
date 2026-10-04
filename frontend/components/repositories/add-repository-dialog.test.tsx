import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { AddRepositoryDialog } from "@/components/repositories/add-repository-dialog"

const mocks = vi.hoisted(() => ({ addRepository: vi.fn() }))

vi.mock("@/lib/repository-actions", () => ({
  addRepository: mocks.addRepository,
}))

beforeEach(() => {
  vi.clearAllMocks()
})

async function openDialog() {
  const user = userEvent.setup()
  render(<AddRepositoryDialog />)
  await user.click(screen.getByRole("button", { name: "Add repository" }))
  return user
}

describe("AddRepositoryDialog", () => {
  it("previews the repository it will add", async () => {
    const user = await openDialog()

    expect(screen.getByText("A repository URL or owner/repo.")).toBeVisible()

    await user.type(
      screen.getByLabelText("GitHub repository"),
      "https://github.com/me/wiki/tree/main",
    )

    expect(screen.getByText("Adds me/wiki")).toBeVisible()
  })

  it("closes after the repository is added", async () => {
    mocks.addRepository.mockResolvedValue({
      status: "success",
      fieldErrors: {},
      formError: null,
      values: { repository: "", branch: "main" },
    })
    const user = await openDialog()

    await user.type(screen.getByLabelText("GitHub repository"), "me/wiki")
    await user.click(
      screen.getByRole("button", { name: "Add repository", hidden: false }),
    )

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    )
    expect(mocks.addRepository).toHaveBeenCalledTimes(1)
  })

  it("stays open and shows errors from the server", async () => {
    mocks.addRepository.mockResolvedValue({
      status: "error",
      fieldErrors: { repository: "me/wiki is already added." },
      formError: null,
      values: { repository: "me/wiki", branch: "main" },
    })
    const user = await openDialog()

    await user.type(screen.getByLabelText("GitHub repository"), "me/wiki")
    await user.click(screen.getByRole("button", { name: "Add repository" }))

    expect(await screen.findByText("me/wiki is already added.")).toBeVisible()
    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })
})
