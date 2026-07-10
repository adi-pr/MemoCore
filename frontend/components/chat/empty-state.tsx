import { Brain } from "lucide-react"

export function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-4 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Brain className="size-7" />
      </div>
      <h2 className="mt-5 text-xl font-semibold tracking-tight text-foreground">
        What would you like to know?
      </h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        Ask questions about your Wiki.js content and MemoCore will retrieve relevant
        information from your local knowledge base before generating an answer.
      </p>
    </div>
  )
}
