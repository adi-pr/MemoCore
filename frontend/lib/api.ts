const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(
  /\/$/,
  ""
)

export interface KnowledgeBase {
  id: string
  giturl: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export async function fetchKnowledgeBases(signal?: AbortSignal): Promise<KnowledgeBase[]> {
  const response = await fetch(`${API_BASE_URL}/knowledge-bases`, { signal })

  if (!response.ok) {
    throw new Error(`Failed to load knowledge bases (${response.status})`)
  }

  return response.json()
}

interface AskStreamParams {
  knowledgeBaseId: string
  question: string
  topK?: number
  signal?: AbortSignal
}

export async function askStream({
  knowledgeBaseId,
  question,
  topK = 4,
  signal,
}: AskStreamParams): Promise<ReadableStreamDefaultReader<Uint8Array>> {
  const response = await fetch(`${API_BASE_URL}/ask/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      knowledge_base_id: knowledgeBaseId,
      question,
      top_k: topK,
    }),
    signal,
  })

  if (!response.ok || !response.body) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  return response.body.getReader()
}
