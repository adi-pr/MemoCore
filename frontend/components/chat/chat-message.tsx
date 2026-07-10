import { Bot, User } from "lucide-react"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { ChatMessageData } from "@/components/chat/types"

const CONTENT_STYLES =
  "[&_p]:leading-relaxed [&_p+p]:mt-3 " +
  "[&_ul]:mt-2 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 " +
  "[&_ol]:mt-2 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5 " +
  "[&_code]:rounded [&_code]:bg-foreground/10 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.85em] [&_code]:font-mono " +
  "[&_pre]:mt-3 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-zinc-950 [&_pre]:p-3.5 [&_pre]:text-zinc-100 " +
  "[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-[0.85em]"

export function ChatMessage({ role, name, timestamp, content }: ChatMessageData) {
  const isAssistant = role === "assistant"

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
          <span className="text-xs text-muted-foreground">{timestamp}</span>
        </div>

        <div
          className={cn(
            "mt-1.5 text-sm text-foreground/90",
            CONTENT_STYLES,
            isAssistant && "rounded-2xl bg-muted/60 px-4 py-3"
          )}
        >
          {content}
        </div>
      </div>
    </div>
  )
}
