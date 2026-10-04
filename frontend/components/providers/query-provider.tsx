"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Everything is on the local network, so data is cheap to refetch
        // and failures are unlikely to fix themselves on retry.
        staleTime: 10_000,
        retry: 1,
      },
    },
  })
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // One client per browser session, not per render.
  const [queryClient] = useState(createQueryClient)

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
