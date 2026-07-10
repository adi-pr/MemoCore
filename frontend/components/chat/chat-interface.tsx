"use client"

import * as React from "react"

import { ChatHeader } from "@/components/chat/chat-header"
import { ChatMessages } from "@/components/chat/chat-messages"
import { PromptChips } from "@/components/chat/prompt-chips"
import { ChatComposer } from "@/components/chat/chat-composer"
import { DEMO_MESSAGES } from "@/components/chat/demo-messages"

export function ChatInterface() {
  const [input, setInput] = React.useState("")

  const messages = DEMO_MESSAGES
  const isEmpty = messages.length === 0

  return (
    <div className="flex h-full flex-col">
      <ChatHeader name="Personal Wiki" source="GitHub Wiki" lastSynced="2 hours ago" />

      <div className="min-h-0 flex-1">
        <ChatMessages messages={messages} isLoading={!isEmpty} />
      </div>

      <div className="shrink-0 space-y-3 px-4 pb-4 sm:px-6">
        {isEmpty && (
          <div className="mx-auto w-full max-w-3xl">
            <PromptChips onSelect={setInput} />
          </div>
        )}
        <ChatComposer value={input} onChange={setInput} />
      </div>
    </div>
  )
}
