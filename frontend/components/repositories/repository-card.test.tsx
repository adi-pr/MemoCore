import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { RepositoryCard } from "@/components/repositories/repository-card"
import { makeRepository, makeSyncJob } from "@/test/fixtures"

const now = new Date("2026-10-04T12:00:00Z")

function renderCard(...args: Parameters<typeof makeRepository>) {
  render(<RepositoryCard repository={makeRepository(...args)} now={now} />)
}

describe("RepositoryCard", () => {
  it("shows the repository, branch and a GitHub link", () => {
    renderCard()

    expect(screen.getByText("wiki")).toBeInTheDocument()
    expect(screen.getByText("main")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /me\/wiki/ })).toHaveAttribute(
      "href",
      "https://github.com/me/wiki",
    )
  })

  it("shows when a completed sync finished and its commit", () => {
    renderCard()

    expect(screen.getByText("Synced")).toBeInTheDocument()
    expect(screen.getByText("3 days ago")).toBeInTheDocument()
    expect(screen.getByText("abcdef1")).toBeInTheDocument()
  })

  it("shows progress while syncing", () => {
    renderCard({
      latest_sync_job: makeSyncJob({
        status: "running",
        files_discovered: 40,
        files_processed: 12,
        commit_sha: null,
        completed_at: null,
      }),
    })

    expect(screen.getByText("Syncing")).toBeInTheDocument()
    expect(screen.getByText("12 of 40 files processed")).toBeInTheDocument()
  })

  it("shows queued jobs", () => {
    renderCard({ latest_sync_job: makeSyncJob({ status: "pending" }) })

    expect(screen.getByText("Queued")).toBeInTheDocument()
    expect(screen.getByText("Waiting for the worker.")).toBeInTheDocument()
  })

  it("shows the error of a failed sync", () => {
    renderCard({
      latest_sync_job: makeSyncJob({
        status: "failed",
        error_message: "Permission denied (publickey)",
      }),
    })

    expect(screen.getByText("Failed")).toBeInTheDocument()
    expect(
      screen.getByText("Permission denied (publickey)"),
    ).toBeInTheDocument()
  })

  it("shows repositories that were never synced", () => {
    renderCard({ latest_sync_job: null })

    expect(screen.getByText("Never synced")).toBeInTheDocument()
    expect(screen.getByText("Not indexed yet.")).toBeInTheDocument()
  })

  it("marks inactive repositories", () => {
    renderCard({ is_active: false })

    expect(screen.getByText("Inactive")).toBeInTheDocument()
  })
})
