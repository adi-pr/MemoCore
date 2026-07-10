"use client"

import * as React from "react"

import { ScrollArea } from "@/components/ui/scroll-area"
import { ChatMessage } from "@/components/chat/chat-message"
import { EmptyState } from "@/components/chat/empty-state"
import { LoadingMessage } from "@/components/chat/loading-message"
import type { Message } from "@/components/chat/types"

interface ChatMessagesProps {
  messages: Message[]
}

export function ChatMessages({ messages }: ChatMessagesProps) {
  const viewportRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" })
  }, [messages])

  if (messages.length === 0) {
    return <EmptyState />
  }

  return (
    <ScrollArea className="h-full" viewportRef={viewportRef}>
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6">
        {messages.map((message) =>
          message.role === "assistant" && message.content === "" && !message.isError ? (
            <LoadingMessage key={message.id} />
          ) : (
            <ChatMessage key={message.id} {...message} />
          )
        )}
      </div>
    </ScrollArea>
  )
}
