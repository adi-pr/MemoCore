from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class SyncJobResponse(BaseModel):
    id: UUID
    repository_id: UUID

    status: str
    commit_sha: str | None

    files_discovered: int
    files_processed: int
    chunks_created: int
    embeddings_created: int

    error_message: str | None

    started_at: datetime | None
    completed_at: datetime | None

    created_at: datetime
