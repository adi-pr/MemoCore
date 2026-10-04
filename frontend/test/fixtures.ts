import type { Repository, SyncJob } from "@/lib/api/types"

export function makeSyncJob(overrides: Partial<SyncJob> = {}): SyncJob {
  return {
    id: "00000000-0000-0000-0000-0000000000a1",
    repository_id: "00000000-0000-0000-0000-000000000001",
    status: "completed",
    commit_sha: "abcdef1234567890",
    files_discovered: 12,
    files_processed: 12,
    chunks_created: 40,
    embeddings_created: 40,
    error_message: null,
    started_at: "2026-10-01T10:00:00Z",
    completed_at: "2026-10-01T10:02:00Z",
    created_at: "2026-10-01T09:59:00Z",
    ...overrides,
  }
}

export function makeRepository(
  overrides: Partial<Repository> = {},
): Repository {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    provider: "github",
    external_id: null,
    name: "wiki",
    full_name: "me/wiki",
    clone_url: "git@github.com:me/wiki.git",
    default_branch: "main",
    is_active: true,
    created_at: "2026-09-01T00:00:00Z",
    updated_at: "2026-09-01T00:00:00Z",
    latest_sync_job: makeSyncJob(),
    ...overrides,
  }
}
