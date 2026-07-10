import { CircleCheck, Cpu, Database } from "lucide-react"

import { Badge } from "@/components/ui/badge"

interface ChatHeaderProps {
  name: string
  source: string
  lastSynced: string
}

export function ChatHeader({ name, source, lastSynced }: ChatHeaderProps) {
  return (
    <header className="flex shrink-0 items-center justify-between gap-4 border-b border-border px-4 py-3 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Database className="size-4.5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {source} <span aria-hidden="true">•</span> Last synced {lastSynced}
          </p>
        </div>
      </div>

      <div className="hidden shrink-0 items-center gap-2 sm:flex">
        <Badge variant="secondary" className="gap-1">
          <CircleCheck className="size-3" />
          Indexed
        </Badge>
        <Badge variant="outline" className="gap-1">
          <Cpu className="size-3" />
          Local AI
        </Badge>
      </div>
    </header>
  )
}
