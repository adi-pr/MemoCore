import shutil
import tempfile
from pathlib import Path
from uuid import UUID

from app.db.repositories.repositories import (
    get_repository,
)

from app.db.repositories.sync_jobs import (
    get_pending_sync_job,
    get_sync_job,
    mark_sync_job_running,
    mark_sync_job_completed,
    mark_sync_job_failed,
)

from app.db.repositories.versions import (
    create_repository_version,
    get_repository_version,
)

from app.services.git import (
    clone_repository,
    get_commit_sha,
    get_commit_message,
)


def process_sync_job(
    job_id: UUID,
):
    job = get_sync_job(job_id)

    if not job:
        raise ValueError(
            "Sync job not found"
        )

    repository = get_repository(
        UUID(job["repository_id"])
    )

    if not repository:
        raise ValueError(
            "Repository not found"
        )

    mark_sync_job_running(job_id)

    temp_dir = Path(
        tempfile.mkdtemp(
            prefix="rag-repo-"
        )
    )

    try:
        repo_path = temp_dir / "repository"

        clone_repository(
            clone_url=repository["clone_url"],
            destination=repo_path,
            branch=repository["default_branch"],
        )

        commit_sha = get_commit_sha(
            repo_path
        )

        commit_message = get_commit_message(
            repo_path
        )

        existing_version = (
            get_repository_version(
                repository_id=UUID(
                    repository["id"]
                ),
                commit_sha=commit_sha,
            )
        )

        if not existing_version:
            create_repository_version(
                repository_id=UUID(
                    repository["id"]
                ),
                commit_sha=commit_sha,
                branch=repository[
                    "default_branch"
                ],
                commit_message=commit_message,
            )

        mark_sync_job_completed(
            job_id=job_id,
            commit_sha=commit_sha,
        )

    except Exception as exc:
        mark_sync_job_failed(
            job_id=job_id,
            error_message=str(exc),
        )

        raise

    finally:
        shutil.rmtree(
            temp_dir,
            ignore_errors=True,
        )

if __name__ == "__main__":
    job = get_pending_sync_job()

    if not job:
        print("No pending sync jobs.")
    else:
        print(
            f"Processing sync job {job['id']}"
        )

        process_sync_job(
            UUID(job["id"])
        )

        print("Sync job completed.")
