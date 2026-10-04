import type { Metadata } from "next"
import { MessageSquare } from "lucide-react"

import { PageHeader } from "@/components/shell/page-header"
import { PagePlaceholder } from "@/components/shell/page-placeholder"

export const metadata: Metadata = { title: "Chat · MemoCore" }

export default function ChatPage() {
  return (
    <>
      <PageHeader title="Chat" />
      <PagePlaceholder
        icon={MessageSquare}
        title="Ask your knowledge base"
        description="Chat isn't connected yet."
      />
    </>
  )
}
