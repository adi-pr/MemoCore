import type { Metadata } from "next"
import { FolderGit2 } from "lucide-react"

import { PageHeader } from "@/components/shell/page-header"
import { PagePlaceholder } from "@/components/shell/page-placeholder"

export const metadata: Metadata = { title: "Repositories · MemoCore" }

export default function RepositoriesPage() {
  return (
    <>
      <PageHeader title="Repositories" />
      <PagePlaceholder
        icon={FolderGit2}
        title="No repositories yet"
        description="Repositories you index will appear here."
      />
    </>
  )
}
