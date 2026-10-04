import type { Metadata } from "next"
import { Suspense } from "react"

import { PageHeader } from "@/components/shell/page-header"
import { RepositoryList } from "@/components/repositories/repository-list"
import { RepositoryListSkeleton } from "@/components/repositories/repository-list-skeleton"

export const metadata: Metadata = { title: "Repositories · MemoCore" }

export default function RepositoriesPage() {
  return (
    <>
      <PageHeader title="Repositories" />
      <div className="mx-auto w-full max-w-5xl flex-1 p-4 md:p-6">
        <Suspense fallback={<RepositoryListSkeleton />}>
          <RepositoryList />
        </Suspense>
      </div>
    </>
  )
}
