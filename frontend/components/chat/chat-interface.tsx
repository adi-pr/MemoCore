"use client"

import * as React from "react"

import { askStream, fetchKnowledgeBases, type KnowledgeBase } from "@/lib/api"
import { formatRelativeTime } from "@/lib/format"
import { ChatHeader } from "@/components/chat/chat-header"
import { ChatMessages } from "@/components/chat/chat-messages"
import { PromptChips } from "@/components/chat/prompt-chips"
import { ChatComposer } from "@/components/chat/chat-composer"
import type { Message } from "@/components/chat/types"

const ERROR_MESSAGE = "Sorry, something went wrong while contacting MemoCore."

type KnowledgeBaseStatus = "loading" | "ready" | "unavailable"

function createId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)
}

function formatTimestamp(date: Date) {
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
}

export function ChatInterface() {
  const [messages, setMessages] = React.useState<Message[]>([])
  const [input, setInput] = React.useState("")
  const [isStreaming, setIsStreaming] = React.useState(false)
  const [knowledgeBase, setKnowledgeBase] = React.useState<KnowledgeBase | null>(null)
  const [knowledgeBaseStatus, setKnowledgeBaseStatus] =
    React.useState<KnowledgeBaseStatus>("loading")

  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const sendAbortRef = React.useRef<AbortController | null>(null)

  React.useEffect(() => {
    const controller = new AbortController()

    fetchKnowledgeBases(controller.signal)
      .then((knowledgeBases) => {
        if (knowledgeBases.length > 0) {
          setKnowledgeBase(knowledgeBases[0])
          setKnowledgeBaseStatus("ready")
        } else {
          setKnowledgeBaseStatus("unavailable")
        }
      })
      .catch(() => {
        setKnowledgeBaseStatus("unavailable")
      })

    return () => controller.abort()
  }, [])

  React.useEffect(() => {
    return () => {
      sendAbortRef.current?.abort()
    }
  }, [])

  const isEmpty = messages.length === 0

  function handleChipSelect(prompt: string) {
    setInput(prompt)
    textareaRef.current?.focus()
  }

  async function handleSend() {
    const question = input.trim()
    if (!question || isStreaming || !knowledgeBase) return

    const userMessage: Message = {
      id: createId(),
      role: "user",
      content: question,
      timestamp: formatTimestamp(new Date()),
    }
    const assistantId = createId()
    const assistantMessage: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
      timestamp: formatTimestamp(new Date()),
    }

    setMessages((previous) => [...previous, userMessage, assistantMessage])
    setInput("")
    setIsStreaming(true)

    const controller = new AbortController()
    sendAbortRef.current = controller

    try {
      const reader = await askStream({
        knowledgeBaseId: knowledgeBase.id,
        question,
        topK: 4,
        signal: controller.signal,
      })
      const decoder = new TextDecoder()

      const appendChunk = (chunk: string) => {
        if (!chunk) return
        setMessages((previous) =>
          previous.map((message) =>
            message.id === assistantId
              ? { ...message, content: message.content + chunk }
              : message
          )
        )
      }

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          appendChunk(decoder.decode(value, { stream: true }))
        }
        appendChunk(decoder.decode())
      } finally {
        reader.releaseLock()
      }
    } catch {
      if (controller.signal.aborted) return

      setMessages((previous) =>
        previous.map((message) =>
          message.id === assistantId
            ? { ...message, content: ERROR_MESSAGE, isError: true }
            : message
        )
      )
    } finally {
      setIsStreaming(false)
      sendAbortRef.current = null
    }
  }

  return (
    <div className="flex h-full flex-col">
      <ChatHeader
        name={
          knowledgeBase?.name ??
          (knowledgeBaseStatus === "loading"
            ? "Loading knowledge base…"
            : "No knowledge base connected")
        }
        source={
          knowledgeBase
            ? knowledgeBase.giturl.replace(/^https?:\/\//, "")
            : "Connect a knowledge base to get started"
        }
        lastSynced={knowledgeBase ? formatRelativeTime(knowledgeBase.updated_at) : "—"}
      />

      <div className="min-h-0 flex-1">
        <ChatMessages messages={messages} />
      </div>

      <div className="shrink-0 space-y-3 px-4 pb-4 sm:px-6">
        {isEmpty && (
          <div className="mx-auto w-full max-w-3xl">
            <PromptChips onSelect={handleChipSelect} />
          </div>
        )}
        <ChatComposer
          value={input}
          onChange={setInput}
          onSend={handleSend}
          disabled={isStreaming}
          canSend={input.trim().length > 0 && !isStreaming && knowledgeBaseStatus === "ready"}
          isStreaming={isStreaming}
          textareaRef={textareaRef}
        />
        {knowledgeBaseStatus === "unavailable" && (
          <p className="text-center text-xs text-muted-foreground">
            Can&apos;t reach MemoCore right now. Check that the backend is running and a
            knowledge base is connected.
          </p>
        )}
      </div>
    </div>
  )
}
