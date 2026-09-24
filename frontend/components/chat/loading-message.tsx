import { Bot } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"

export function LoadingMessage() {
  return (
    <div className="flex gap-3">
      <Avatar className="mt-0.5 shrink-0">
        <AvatarFallback className="bg-primary text-primary-foreground">
          <Bot className="size-4" />
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium text-foreground">MemoCore</span>
        </div>

        <div className="mt-1.5 flex flex-col gap-2 rounded-2xl bg-muted/60 px-4 py-3.5">
          <div className="flex items-center gap-1">
            <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
            <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
            <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" />
          </div>
          <Skeleton className="h-3 w-4/5" />
          <Skeleton className="h-3 w-3/5" />
        </div>
      </div>
    </div>
  )
}
