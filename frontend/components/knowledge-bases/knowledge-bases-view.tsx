"use client"

import * as React from "react"

import { fetchKnowledgeBases, type KnowledgeBase } from "@/lib/api"
import { KbPageHeader } from "@/components/knowledge-bases/kb-page-header"
import { KbToolbar } from "@/components/knowledge-bases/kb-toolbar"
import { KbCard } from "@/components/knowledge-bases/kb-card"
import { KbEmptyState } from "@/components/knowledge-bases/kb-empty-state"
import { KbErrorState } from "@/components/knowledge-bases/kb-error-state"
import { KbListSkeleton } from "@/components/knowledge-bases/kb-list-skeleton"

type Status = "loading" | "ready" | "error"

export function KnowledgeBasesView() {
  const [knowledgeBases, setKnowledgeBases] = React.useState<KnowledgeBase[]>([])
  const [status, setStatus] = React.useState<Status>("loading")

  const fetchAndSet = React.useCallback((signal?: AbortSignal) => {
    fetchKnowledgeBases(signal)
      .then((data) => {
        setKnowledgeBases(data)
        setStatus("ready")
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return
        setStatus("error")
      })
  }, [])

  const retry = React.useCallback(() => {
    setStatus("loading")
    fetchAndSet()
  }, [fetchAndSet])

  React.useEffect(() => {
    const controller = new AbortController()
    fetchAndSet(controller.signal)
    return () => controller.abort()
  }, [fetchAndSet])

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <KbPageHeader />
      <KbToolbar />

      {status === "loading" && <KbListSkeleton />}
      {status === "error" && <KbErrorState onRetry={retry} />}
      {status === "ready" &&
        (knowledgeBases.length === 0 ? (
          <KbEmptyState />
        ) : (
          <div className="flex flex-col gap-4">
            {knowledgeBases.map((knowledgeBase) => (
              <KbCard key={knowledgeBase.id} knowledgeBase={knowledgeBase} />
            ))}
          </div>
        ))}
    </div>
  )
}
