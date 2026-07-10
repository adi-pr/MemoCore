import { ScrollArea } from "@/components/ui/scroll-area"
import { ChatMessage } from "@/components/chat/chat-message"
import { EmptyState } from "@/components/chat/empty-state"
import { LoadingMessage } from "@/components/chat/loading-message"
import type { ChatMessageData } from "@/components/chat/types"

interface ChatMessagesProps {
  messages: ChatMessageData[]
  isLoading?: boolean
}

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  if (messages.length === 0) {
    return <EmptyState />
  }

  return (
    <ScrollArea className="h-full">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6">
        {messages.map((message) => (
          <ChatMessage key={message.id} {...message} />
        ))}
        {isLoading && <LoadingMessage />}
      </div>
    </ScrollArea>
  )
}
