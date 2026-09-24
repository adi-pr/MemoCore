import { Database, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"

export function KbEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Database className="size-7" />
      </div>
      <h2 className="mt-5 text-lg font-semibold text-foreground">No knowledge bases yet</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Create your first knowledge base to begin chatting with your documentation.
      </p>
      <Button type="button" className="mt-5 gap-1.5">
        <Plus className="size-4" />
        Create Knowledge Base
      </Button>
    </div>
  )
}
