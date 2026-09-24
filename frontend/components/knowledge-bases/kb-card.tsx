import {
  CalendarDays,
  CheckCheck,
  CircleCheck,
  Clock,
  Database,
  FileText,
  Hammer,
  MoreHorizontal,
  RotateCw,
  Trash2,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { formatRelativeTime } from "@/lib/format"
import type { KnowledgeBase } from "@/lib/api"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function formatDate(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return "Unknown"
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

interface KbCardProps {
  knowledgeBase: KnowledgeBase
}

export function KbCard({ knowledgeBase }: KbCardProps) {
  return (
    <Card className="gap-4 p-5 transition-shadow hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Database className="size-5" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-foreground">
              {knowledgeBase.name}
            </h3>
            {knowledgeBase.description && (
              <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                {knowledgeBase.description}
              </p>
            )}
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {knowledgeBase.giturl}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <Badge variant="secondary" className="gap-1">
            <CircleCheck className="size-3" />
            Indexed
          </Badge>
          <Badge variant="outline" className="gap-1">
            <CheckCheck className="size-3" />
            Ready
          </Badge>
        </div>
      </div>

      <Separator />

      <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <FileText className="size-3.5" />
          Documents Indexed: <span className="text-foreground/70">—</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="size-3.5" />
          Last Synced:{" "}
          <span className="text-foreground/70">
            {formatRelativeTime(knowledgeBase.updated_at)}
          </span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="size-3.5" />
          Created:{" "}
          <span className="text-foreground/70">{formatDate(knowledgeBase.created_at)}</span>
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Tooltip>
          <TooltipTrigger
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
          >
            <RotateCw className="size-3.5" />
            Resync
          </TooltipTrigger>
          <TooltipContent>Resync this knowledge base</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
          >
            <Hammer className="size-3.5" />
            Rebuild Index
          </TooltipTrigger>
          <TooltipContent>Rebuild the search index</TooltipContent>
        </Tooltip>

        <Button type="button" variant="destructive" size="sm" className="gap-1.5">
          <Trash2 className="size-3.5" />
          Delete
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="More actions"
            className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
          >
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>View details</DropdownMenuItem>
            <DropdownMenuItem>Edit knowledge base</DropdownMenuItem>
            <DropdownMenuItem>Copy repository URL</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  )
}
