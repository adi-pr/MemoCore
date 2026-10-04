import { ExternalLink, GitBranch, GitCommitHorizontal } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { RepositoryActionsMenu } from "@/components/repositories/repository-actions-menu"
import { SyncStatusBadge } from "@/components/repositories/sync-status"
import type { Repository, SyncJob } from "@/lib/api/types"
import { formatDateTime, formatRelativeTime, shortSha } from "@/lib/format"
import { githubUrl } from "@/lib/repositories"
import { cn } from "@/lib/utils"

type RepositoryCardProps = {
  repository: Repository
  now?: Date
}

export function RepositoryCard({ repository, now }: RepositoryCardProps) {
  const job = repository.latest_sync_job

  return (
    <Card
      className={cn(!repository.is_active && "opacity-60")}
      aria-label={repository.full_name}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {repository.name}
          {!repository.is_active && <Badge variant="outline">Inactive</Badge>}
        </CardTitle>
        <CardDescription>
          <a
            href={githubUrl(repository)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 hover:text-foreground hover:underline"
          >
            {repository.full_name}
            <ExternalLink className="size-3" aria-hidden />
            <span className="sr-only">(opens GitHub)</span>
          </a>
        </CardDescription>
        <CardAction className="flex items-center gap-1">
          <SyncStatusBadge job={job} />
          <RepositoryActionsMenu repository={repository} />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="inline-flex items-center gap-1">
            <GitBranch className="size-4" aria-hidden />
            <span className="sr-only">Branch </span>
            {repository.default_branch}
          </span>
          {job?.commit_sha && (
            <span className="inline-flex items-center gap-1 font-mono text-xs">
              <GitCommitHorizontal className="size-4" aria-hidden />
              <span className="sr-only">Commit </span>
              {shortSha(job.commit_sha)}
            </span>
          )}
        </div>
        <SyncDetail job={job} now={now} />
      </CardContent>
    </Card>
  )
}

function SyncDetail({ job, now }: { job: SyncJob | null; now?: Date }) {
  if (!job) {
    return <p>Not indexed yet.</p>
  }

  switch (job.status) {
    case "pending":
      return <p>Waiting for the worker.</p>
    case "running":
      return (
        <p>
          {job.files_discovered > 0
            ? `${job.files_processed} of ${job.files_discovered} files processed`
            : "Discovering files…"}
        </p>
      )
    case "completed": {
      const finishedAt = job.completed_at ?? job.created_at
      return (
        <p>
          Last synced{" "}
          <time dateTime={finishedAt} title={formatDateTime(finishedAt)}>
            {formatRelativeTime(finishedAt, now)}
          </time>
        </p>
      )
    }
    case "failed":
      return (
        <p
          className="line-clamp-2 text-destructive"
          title={job.error_message ?? undefined}
        >
          {job.error_message ?? "Sync failed."}
        </p>
      )
  }
}
