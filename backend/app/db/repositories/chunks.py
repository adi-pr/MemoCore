from uuid import UUID
from typing import Any

from app.db.supabase import get_supabase

def replace_document_chunks(
    document_id: UUID,
    repository_version_id: UUID,
    chunks,
):

    supabase = get_supabase()

    (
        supabase
        .table("document_chunks")
        .delete()
        .eq("document_id", str(document_id))
        .execute()
    )

    if not chunks:
        return []

    rows = []

    for chunk in chunks:
        rows.append(
            {
                "document_id": str(document_id),
                "repository_version_id": str(
                    repository_version_id
                ),
                "chunk_index": chunk.chunk_index,
                "content": chunk.content,
                "content_hash": chunk.content_hash,
                "token_count": chunk.token_count,
                "heading_path": chunk.heading_path,
                "start_line": chunk.start_line,
                "end_line": chunk.end_line,
            }
        )

    response = (
        supabase
        .table("document_chunks")
        .insert(rows)
        .execute()
    )

    if not response.data:
        raise RuntimeError(
            "Failed to insert document chunks"
        )

    return response.data


create_chunks = replace_document_chunks

def get_all_chunks() -> list[dict[str, Any]]:

    supabase = get_supabase()

    response = (
        supabase
        .table("document_chunks")
        .select(
            """
            id,
            document_id,
            repository_version_id,
            content,
            heading_path,
            documents!inner(
                repository_id,
                path
            )
            """
        )
        .execute()
    )

    chunks: list[dict[str, Any]] = []

    for row in response.data or []:
        document = row["documents"]

        chunks.append(
            {
                "id": row["id"],
                "document_id": row["document_id"],
                "repository_id": document["repository_id"],
                "repository_version_id": (
                    row["repository_version_id"]
                ),
                "file_path": document["path"],
                "heading_path": row.get("heading_path"),
                "content": row["content"],
            }
        )

    return chunks