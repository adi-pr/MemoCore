import { cookies } from "next/headers"

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/shell/app-sidebar"
import { requireSession } from "@/lib/session"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Restores the collapsed state the sidebar saves in a cookie.
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false"
  const session = await requireSession()

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-background px-4 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      <AppSidebar user={session.user} />
      <SidebarInset id="main" tabIndex={-1} className="outline-none">
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
