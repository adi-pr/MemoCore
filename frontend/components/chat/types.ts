import type { ReactNode } from "react"

export type MessageRole = "user" | "assistant"

export interface ChatMessageData {
  id: string
  role: MessageRole
  name: string
  timestamp: string
  content: ReactNode
}
