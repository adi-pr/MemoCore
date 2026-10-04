import type { Repository } from "@/lib/api/types"

export function githubUrl(repository: Pick<Repository, "full_name">): string {
  return `https://github.com/${repository.full_name}`
}

/** Active repositories first, keeping the backend's newest-first order. */
export function sortRepositories(repositories: Repository[]): Repository[] {
  return [...repositories].sort(
    (a, b) => Number(b.is_active) - Number(a.is_active),
  )
}
