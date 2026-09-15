from uuid import UUID
from datetime import datetime, timezone

from app.db.supabase import get_supabase

def create_sync_job(
    repository_id: UUID,
):
    supabase = get_supabase()

    response = (
        supabase
        .table("sync_jobs")
        .insert({
            "repository_id": str(repository_id),
            "status": "pending",
        })
        .execute()
    )

    if not response.data:
        raise RuntimeError(
            "Failed to create sync job"
        )

    return response.data[0]

def get_sync_job(
    job_id: UUID,
):
    supabase = get_supabase()

    response = (
        supabase
        .table("sync_jobs")
        .select("*")
        .eq(
            "id",
            str(job_id),
        )
        .execute()
    )

    if not response.data:
        return None

    return response.data[0]

def get_sync_jobs_for_repository(
    repository_id: UUID,
):
    supabase = get_supabase()

    response = (
        supabase
        .table("sync_jobs")
        .select("*")
        .eq(
            "repository_id",
            str(repository_id),
        )
        .order(
            "created_at",
            desc=True,
        )
        .execute()
    )

    return response.data

def mark_sync_job_running(
    job_id: UUID,
):
    supabase = get_supabase()

    response = (
        supabase
        .table("sync_jobs")
        .update({
            "status": "running",
            "started_at": datetime.now(
                timezone.utc
            ).isoformat(),
        })
        .eq(
            "id",
            str(job_id),
        )
        .execute()
    )

    if not response.data:
        return None

    return response.data[0]

def update_sync_job_progress(
    job_id: UUID,
    files_discovered: int | None = None,
    files_processed: int | None = None,
    chunks_created: int | None = None,
    embeddings_created: int | None = None,
):
    supabase = get_supabase()

    updates = {}

    if files_discovered is not None:
        updates["files_discovered"] = files_discovered

    if files_processed is not None:
        updates["files_processed"] = files_processed

    if chunks_created is not None:
        updates["chunks_created"] = chunks_created

    if embeddings_created is not None:
        updates["embeddings_created"] = embeddings_created

    if not updates:
        return get_sync_job(job_id)

    response = (
        supabase
        .table("sync_jobs")
        .update(updates)
        .eq(
            "id",
            str(job_id),
        )
        .execute()
    )

    if not response.data:
        return None

    return response.data[0]

def mark_sync_job_completed(
    job_id: UUID,
    commit_sha: str,
):
    supabase = get_supabase()

    response = (
        supabase
        .table("sync_jobs")
        .update({
            "status": "completed",
            "commit_sha": commit_sha,
            "completed_at": datetime.now(
                timezone.utc
            ).isoformat(),
        })
        .eq(
            "id",
            str(job_id),
        )
        .execute()
    )

    if not response.data:
        return None

    return response.data[0]

def mark_sync_job_failed(
    job_id: UUID,
    error_message: str,
):
    supabase = get_supabase()

    response = (
        supabase
        .table("sync_jobs")
        .update({
            "status": "failed",
            "error_message": error_message,
            "completed_at": datetime.now(
                timezone.utc
            ).isoformat(),
        })
        .eq(
            "id",
            str(job_id),
        )
        .execute()
    )

    if not response.data:
        return None

    return response.data[0]

def get_pending_sync_job():
    supabase = get_supabase()

    response = (
        supabase
        .table("sync_jobs")
        .select("*")
        .eq(
            "status",
            "pending",
        )
        .order(
            "created_at",
            desc=False,
        )
        .limit(1)
        .execute()
    )

    if not response.data:
        return None

    return response.data[0]
