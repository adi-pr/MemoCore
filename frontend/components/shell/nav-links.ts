import {
  FolderGit2,
  MessageSquare,
  Settings,
  type LucideIcon,
} from "lucide-react"

export type NavLink = {
  title: string
  href: string
  icon: LucideIcon
}

export const navLinks: NavLink[] = [
  { title: "Chat", href: "/chat", icon: MessageSquare },
  { title: "Repositories", href: "/repositories", icon: FolderGit2 },
  { title: "Settings", href: "/settings", icon: Settings },
]
