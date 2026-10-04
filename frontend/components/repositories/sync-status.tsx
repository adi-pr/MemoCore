import {
  CircleAlert,
  CircleCheck,
  CircleDashed,
  Clock,
  LoaderCircle,
  type LucideIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { SyncJob } from "@/lib/api/types"
import { cn } from "@/lib/utils"

type SyncStatusDisplay = {
  label: string
  icon: LucideIcon
  className: string
  variant: "outline" | "secondary" | "destructive"
  spin?: boolean
}

const NEVER_SYNCED: SyncStatusDisplay = {
  label: "Never synced",
  icon: CircleDashed,
  className: "text-muted-foreground",
  variant: "outline",
}

const DISPLAY: Record<SyncJob["status"], SyncStatusDisplay> = {
  pending: {
    label: "Queued",
    icon: Clock,
    className: "",
    variant: "secondary",
  },
  running: {
    label: "Syncing",
    icon: LoaderCircle,
    className: "text-primary",
    variant: "secondary",
    spin: true,
  },
  completed: {
    label: "Synced",
    icon: CircleCheck,
    className: "text-emerald-700 dark:text-emerald-400",
    variant: "outline",
  },
  failed: {
    label: "Failed",
    icon: CircleAlert,
    className: "",
    variant: "destructive",
  },
}

export function syncStatusDisplay(job: SyncJob | null): SyncStatusDisplay {
  return job ? DISPLAY[job.status] : NEVER_SYNCED
}

export function SyncStatusBadge({ job }: { job: SyncJob | null }) {
  const { label, icon: Icon, className, variant, spin } = syncStatusDisplay(job)

  return (
    <Badge variant={variant} className={className}>
      <Icon className={cn(spin && "animate-spin")} aria-hidden />
      {label}
    </Badge>
  )
}
