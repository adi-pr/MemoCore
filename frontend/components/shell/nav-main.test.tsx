import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { NavMain } from "@/components/shell/nav-main"

const pathname = vi.hoisted(() => ({ current: "/chat" }))

vi.mock("next/navigation", () => ({
  usePathname: () => pathname.current,
}))

function renderNav(path: string) {
  pathname.current = path

  render(
    <TooltipProvider>
      <SidebarProvider>
        <NavMain />
      </SidebarProvider>
    </TooltipProvider>,
  )
}

describe("NavMain", () => {
  it("renders a link for each section", () => {
    renderNav("/chat")

    expect(screen.getByRole("link", { name: "Chat" })).toHaveAttribute(
      "href",
      "/chat",
    )
    expect(screen.getByRole("link", { name: "Repositories" })).toHaveAttribute(
      "href",
      "/repositories",
    )
    expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute(
      "href",
      "/settings",
    )
  })

  it("marks the current section", () => {
    renderNav("/repositories")

    expect(screen.getByRole("link", { name: "Repositories" })).toHaveAttribute(
      "aria-current",
      "page",
    )
    expect(screen.getByRole("link", { name: "Chat" })).not.toHaveAttribute(
      "aria-current",
    )
  })

  it("keeps the section active on nested routes", () => {
    renderNav("/repositories/123")

    expect(screen.getByRole("link", { name: "Repositories" })).toHaveAttribute(
      "aria-current",
      "page",
    )
  })

  it("does not match sections that only share a prefix", () => {
    renderNav("/chatter")

    expect(screen.getByRole("link", { name: "Chat" })).not.toHaveAttribute(
      "aria-current",
    )
  })
})
