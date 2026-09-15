import hashlib
from uuid import UUID

from app.db.supabase import get_supabase


def create_document(
    repository_id: UUID,
    repository_version_id: UUID,
    path: str,
    filename: str,
    content: str,
    title: str | None,
    language: str = "markdown",
    file_size: int | None = None,
):
    supabase = get_supabase()

    content_hash = hashlib.sha256(
        content.encode("utf-8")
    ).hexdigest()

    response = (
        supabase
        .table("documents")
        .insert({
            "repository_id": str(repository_id),
            "repository_version_id": str(
                repository_version_id
            ),
            "path": path,
            "filename": filename,
            "title": title,
            "content": content,
            "content_hash": content_hash,
            "language": language,
            "file_size": file_size,
        })
        .execute()
    )

    if not response.data:
        raise RuntimeError(
            f"Failed to create document: {path}"
        )

    return response.data[0]
