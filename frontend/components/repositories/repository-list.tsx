import { FolderGit2 } from "lucide-react"

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { RepositoriesError } from "@/components/repositories/repositories-error"
import { RepositoryCard } from "@/components/repositories/repository-card"
import { api } from "@/lib/api/client"
import { ApiError, unwrap } from "@/lib/api/errors"
import type { Repository } from "@/lib/api/types"
import { sortRepositories } from "@/lib/repositories"

export async function RepositoryList() {
  let repositories: Repository[]

  try {
    repositories = await unwrap(api.GET("/repositories"))
  } catch (error) {
    if (error instanceof ApiError) {
      return <RepositoriesError message={error.message} />
    }

    throw error
  }

  if (repositories.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FolderGit2 />
          </EmptyMedia>
          <EmptyTitle>No repositories yet</EmptyTitle>
          <EmptyDescription>
            Add a GitHub repository to index its Markdown.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  const now = new Date()

  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {sortRepositories(repositories).map((repository) => (
        <li key={repository.id}>
          <RepositoryCard repository={repository} now={now} />
        </li>
      ))}
    </ul>
  )
}
