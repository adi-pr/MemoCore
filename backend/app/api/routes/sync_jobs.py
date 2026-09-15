from uuid import UUID

from fastapi import APIRouter, HTTPException, status

from app.db.repositories.sync_jobs import (
    create_sync_job,
    get_sync_job,
    get_sync_jobs_for_repository,
)

from app.schema.sync_jobs import SyncJobResponse


router = APIRouter(
    tags=["Sync Jobs"],
)

@router.post(
    "/repositories/{repository_id}/sync",
    response_model=SyncJobResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_sync(
    repository_id: UUID,
):
    try:
        return create_sync_job(
            repository_id
        )

    except RuntimeError as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc),
        )

@router.get(
    "/repositories/{repository_id}/sync-jobs",
    response_model=list[SyncJobResponse],
)
def list_sync_jobs(
    repository_id: UUID,
):
    return get_sync_jobs_for_repository(
        repository_id
    )

@router.get(
    "/sync-jobs/{job_id}",
    response_model=SyncJobResponse,
)
def get_sync_job_route(
    job_id: UUID,
):
    job = get_sync_job(job_id)

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Sync job not found",
        )

    return job
