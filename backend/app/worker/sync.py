import logging
import shutil
import tempfile
from pathlib import Path
from uuid import UUID

from app.db.repositories.repositories import get_repository
from app.db.repositories.sync_jobs import (
    get_pending_sync_job,
    get_sync_job,
    mark_sync_job_completed,
    mark_sync_job_failed,
    mark_sync_job_running,
    update_sync_job_progress,
)
from app.db.repositories.versions import (
    create_repository_version,
    get_repository_version,
)
from app.db.repositories.documents import upsert_document
from app.db.repositories.chunks import replace_document_chunks

from app.services.chunking import chunk_document
from app.services.discovery import (
    discover_markdown_files,
    extract_title,
)
from app.services.git import (
    clone_repository,
    get_commit_message,
    get_commit_sha,
)

logger = logging.getLogger(__name__)


def process_sync_job(job_id: UUID) -> dict:
    job = get_sync_job(job_id)

    if not job:
        raise ValueError(f"Sync job {job_id} not found")

    repository_id = UUID(job["repository_id"])

    repository = get_repository(repository_id)

    if not repository:
        raise ValueError(
            f"Repository {repository_id} not found"
        )

    if not repository.get("is_active", True):
        raise ValueError(
            f"Repository {repository_id} is inactive"
        )

    mark_sync_job_running(job_id)

    temp_dir = Path(
        tempfile.mkdtemp(prefix="memocore-sync-")
    )

    files_processed = 0
    chunks_created = 0

    try:
        repo_path = temp_dir / "repository"

        clone_repository(
            clone_url=repository["clone_url"],
            destination=repo_path,
            branch=repository["default_branch"],
        )

        commit_sha = get_commit_sha(repo_path)

        commit_message = get_commit_message(repo_path)

        version = get_repository_version(
            repository_id,
            commit_sha,
        )

        if version is None:
            version = create_repository_version(
                repository_id=repository_id,
                commit_sha=commit_sha,
                branch=repository["default_branch"],
                commit_message=commit_message,
            )

        version_id = UUID(version["id"])

        files = discover_markdown_files(repo_path)

        update_sync_job_progress(
            job_id,
            files_discovered=len(files),
            files_processed=0,
            chunks_created=0,
            embeddings_created=0,
        )

        for file_info in files:

            document = upsert_document(
                repository_id=repository_id,
                repository_version_id=version_id,
                path=file_info["path"],
                filename=file_info["filename"],
                content=file_info["content"],
                title=extract_title(
                    file_info["content"]
                ),
                language="markdown",
                file_size=file_info["file_size"],
            )

            document_id = UUID(document["id"])

            chunks = chunk_document(
                file_info["content"]
            )

            replace_document_chunks(
                document_id=document_id,
                repository_version_id=version_id,
                chunks=chunks,
            )

            files_processed += 1
            chunks_created += len(chunks)

            update_sync_job_progress(
                job_id,
                files_processed=files_processed,
                chunks_created=chunks_created,
            )

            logger.info(
                "Processed %s (%s/%s)",
                file_info["path"],
                files_processed,
                len(files),
            )

        result = mark_sync_job_completed(
            job_id,
            commit_sha,
        )

        logger.info(
            "Sync job %s completed: %s files, %s chunks",
            job_id,
            files_processed,
            chunks_created,
        )

        return result

    except Exception as exc:

        logger.exception(
            "Sync job %s failed",
            job_id,
        )

        mark_sync_job_failed(
            job_id,
            f"{type(exc).__name__}: {exc}",
        )

        raise

    finally:
        shutil.rmtree(
            temp_dir,
            ignore_errors=True,
        )


def run_one_pending_job() -> bool:

    job = get_pending_sync_job()

    if not job:
        logger.info("No pending sync jobs")
        return False

    process_sync_job(
        UUID(job["id"])
    )

    return True


if __name__ == "__main__":

    logging.basicConfig(
        level=logging.INFO
    )

    if run_one_pending_job():
        print("Processed one pending sync job.")
    else:
        print("No pending sync jobs.")