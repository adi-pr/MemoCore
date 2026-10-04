/**
 * TanStack Query keys. Nested keys start with their parent's key, so
 * invalidating a parent also invalidates everything under it.
 */
export const queryKeys = {
  health: ["health"] as const,
  repositories: {
    all: ["repositories"] as const,
    detail: (repositoryId: string) => ["repositories", repositoryId] as const,
    syncJobs: (repositoryId: string) =>
      ["repositories", repositoryId, "sync-jobs"] as const,
  },
  syncJobs: {
    detail: (jobId: string) => ["sync-jobs", jobId] as const,
  },
}
