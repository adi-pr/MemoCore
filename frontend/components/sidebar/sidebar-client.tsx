"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Brain,
  MessageSquarePlus,
  MessageSquare,
  Database,
  ChevronRight,
  Activity,
  RefreshCw,
  Hammer,
  Settings,
  PanelLeft,
  PanelLeftClose,
  LogOut,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const CONVERSATIONS = [
  { id: "api-documentation", title: "API Documentation" },
  { id: "project-planning", title: "Project Planning" },
  { id: "meeting-notes", title: "Meeting Notes" },
  { id: "linux-commands", title: "Linux Commands" },
  { id: "research-ideas", title: "Research Ideas" },
  { id: "onboarding-checklist", title: "Onboarding Checklist" },
]

const ACTIVE_CONVERSATION_ID = CONVERSATIONS[0].id

const SYSTEM_ITEMS = [
  { id: "index-status", label: "Index Status", icon: Activity },
  { id: "sync-wiki", label: "Sync Wiki", icon: RefreshCw },
  { id: "rebuild-index", label: "Rebuild Index", icon: Hammer },
]

interface SidebarUser {
  name: string
  email: string | null
  image: string | null
  initials: string
}

function NavItem({
  icon: Icon,
  label,
  collapsed,
  active,
  trailing,
  href,
}: {
  icon: React.ElementType
  label: string
  collapsed: boolean
  active?: boolean
  trailing?: React.ReactNode
  href?: string
}) {
  const className = cn(
    "group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm text-foreground/80 transition-colors hover:bg-muted hover:text-foreground",
    collapsed && "justify-center px-0",
    active && "bg-muted font-medium text-foreground"
  )

  const content = (
    <>
      <Icon
        className={cn(
          "size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground",
          active && "text-foreground"
        )}
      />
      {!collapsed && <span className="flex-1 truncate text-left">{label}</span>}
      {!collapsed && trailing}
    </>
  )

  if (href) {
    return (
      <Link href={href} title={collapsed ? label : undefined} className={className}>
        {content}
      </Link>
    )
  }

  return (
    <button type="button" title={collapsed ? label : undefined} className={className}>
      {content}
    </button>
  )
}

function SectionLabel({ children, collapsed }: { children: React.ReactNode; collapsed: boolean }) {
  if (collapsed) return null
  return (
    <h3 className="px-2.5 pt-3 pb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
      {children}
    </h3>
  )
}

export function SidebarClient({ user }: { user: SidebarUser }) {
  const [collapsed, setCollapsed] = React.useState(false)
  const router = useRouter()
  const pathname = usePathname()

  function handleSignOut() {
    authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/sign-in")
        },
      },
    })
  }

  return (
    <aside
      className={cn(
        "flex h-screen shrink-0 flex-col border-r border-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-in-out",
        collapsed ? "w-[68px]" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex shrink-0 flex-col gap-3 p-3">
        <div className={cn("flex items-center gap-2", collapsed && "justify-center")}>
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Brain className="size-4" />
          </div>
          {!collapsed && (
            <span className="flex-1 truncate text-base font-semibold tracking-tight">
              MemoCore
            </span>
          )}
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setCollapsed(true)}
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="size-4" />
            </Button>
          )}
        </div>

        {collapsed && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setCollapsed(false)}
            aria-label="Expand sidebar"
            className="mx-auto"
          >
            <PanelLeft className="size-4" />
          </Button>
        )}

        <Button
          render={<Link href="/dashboard" />}
          className={cn("w-full justify-start gap-2", collapsed && "justify-center px-0")}
          title={collapsed ? "New Chat" : undefined}
        >
          <MessageSquarePlus className="size-4" />
          {!collapsed && "New Chat"}
        </Button>
      </div>

      <Separator />

      {/* Main navigation */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-2 pb-2">
        <div className="flex min-h-0 flex-1 flex-col">
          <SectionLabel collapsed={collapsed}>Conversation History</SectionLabel>
          <ScrollArea className="min-h-0 flex-1">
            <div className="flex flex-col gap-0.5 pr-1">
              {CONVERSATIONS.map((conversation) => (
                <NavItem
                  key={conversation.id}
                  icon={MessageSquare}
                  label={conversation.title}
                  collapsed={collapsed}
                  active={conversation.id === ACTIVE_CONVERSATION_ID}
                />
              ))}
            </div>
          </ScrollArea>
        </div>

        <Separator className="my-2 shrink-0" />

        <div className="shrink-0">
          <NavItem
            icon={Database}
            label="Knowledge Bases"
            collapsed={collapsed}
            href="/knowledge-bases"
            active={pathname.startsWith("/knowledge-bases")}
            trailing={<ChevronRight className="size-4 shrink-0 text-muted-foreground" />}
          />
        </div>

        <Separator className="my-2 shrink-0" />

        <div className="shrink-0">
          <SectionLabel collapsed={collapsed}>System</SectionLabel>
          <div className="flex flex-col gap-0.5">
            {SYSTEM_ITEMS.map((item) => (
              <NavItem key={item.id} icon={item.icon} label={item.label} collapsed={collapsed} />
            ))}
          </div>
        </div>

        <div className="mt-1 shrink-0">
          <NavItem icon={Settings} label="Settings" collapsed={collapsed} />
        </div>
      </div>

      <Separator />

      {/* User profile */}
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "flex w-full shrink-0 items-center gap-2.5 p-3 text-left transition-colors hover:bg-muted",
            collapsed && "justify-center"
          )}
        >
          <Avatar>
            {user.image && <AvatarImage src={user.image} alt={user.name} />}
            <AvatarFallback>{user.initials}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium text-foreground">{user.name}</span>
              {user.email && (
                <span className="truncate text-xs text-muted-foreground">{user.email}</span>
              )}
            </div>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align={collapsed ? "center" : "start"} className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel>{user.name}</DropdownMenuLabel>
            {user.email && (
              <DropdownMenuLabel className="-mt-2 font-normal">{user.email}</DropdownMenuLabel>
            )}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
            <LogOut className="size-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </aside>
  )
}
