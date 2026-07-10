import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"

export function KbPageHeader() {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Knowledge Bases
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your indexed knowledge sources used by MemoCore.
        </p>
      </div>

      <Button type="button" className="gap-1.5">
        <Plus className="size-4" />
        New Knowledge Base
      </Button>
    </div>
  )
}
