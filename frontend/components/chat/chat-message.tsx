import { Bot, RotateCcw, User } from "lucide-react"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import type { Message } from "@/components/chat/types"

export function ChatMessage({ role, content, timestamp, isError }: Message) {
  const isAssistant = role === "assistant"
  const name = isAssistant ? "MemoCore" : "You"

  return (
    <div className="flex gap-3">
      <Avatar className="mt-0.5 shrink-0">
        {isAssistant ? (
          <AvatarFallback className="bg-primary text-primary-foreground">
            <Bot className="size-4" />
          </AvatarFallback>
        ) : (
          <AvatarFallback>
            <User className="size-4" />
          </AvatarFallback>
        )}
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium text-foreground">{name}</span>
          {timestamp && <span className="text-xs text-muted-foreground">{timestamp}</span>}
        </div>

        <div
          className={cn(
            "mt-1.5 text-sm leading-relaxed whitespace-pre-wrap text-foreground/90",
            isAssistant && "rounded-2xl bg-muted/60 px-4 py-3",
            isError && "text-destructive"
          )}
        >
          {content}
        </div>

        {isError && (
          <Button type="button" variant="outline" size="sm" className="mt-2 gap-1.5">
            <RotateCcw className="size-3.5" />
            Retry
          </Button>
        )}
      </div>
    </div>
  )
}
