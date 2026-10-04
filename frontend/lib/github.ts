export type GitHubRepository = {
  owner: string
  repo: string
  fullName: string
}

const OWNER = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/
const REPO = /^[A-Za-z0-9._-]+$/

/**
 * Reads a GitHub repository from a URL (https, ssh, a /tree/... page) or
 * an "owner/repo" string. Returns null when it isn't one.
 */
export function parseGitHubRepository(input: string): GitHubRepository | null {
  const path = input
    .trim()
    .replace(/^(?:https?:\/\/)?(?:www\.)?github\.com\//i, "")
    .replace(/^(?:ssh:\/\/)?git@github\.com[:/]/i, "")

  // Anything still carrying a scheme or host isn't a GitHub repository.
  if (/^[a-z]+:\/\//i.test(path) || path.includes("@")) {
    return null
  }

  const [owner, rawRepo] = path.split(/[/?#]/)
  const repo = rawRepo?.replace(/\.git$/i, "")

  if (
    !owner ||
    !repo ||
    !OWNER.test(owner) ||
    !REPO.test(repo) ||
    repo === "." ||
    repo === ".."
  ) {
    return null
  }

  return { owner, repo, fullName: `${owner}/${repo}` }
}

/** Loose check for a usable git branch name. */
export function isValidBranch(branch: string): boolean {
  return (
    branch.length > 0 &&
    branch.length <= 255 &&
    !/[\s~^:?*[\\]/.test(branch) &&
    !branch.startsWith("-") &&
    !branch.includes("..")
  )
}
