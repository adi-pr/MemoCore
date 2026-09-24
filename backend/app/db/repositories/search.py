import json
from typing import Any

from app.db.supabase import get_supabase


def get_all_embedded_chunks() -> list[dict[str, Any]]:
    supabase = get_supabase()

    response = (
        supabase
        .table("chunk_embeddings")
        .select(
            """
            chunk_id,
            embedding,
            embedding_model,
            document_chunks!inner(
                id,
                document_id,
                repository_version_id,
                content,
                heading_path,
                documents!inner(
                    repository_id,
                    path
                )
            )
            """
        )
        .execute()
    )

    results: list[dict[str, Any]] = []

    for row in response.data or []:
        chunk = row["document_chunks"]
        document = chunk["documents"]

        embedding = row["embedding"]

        if isinstance(embedding, str):
            embedding = json.loads(embedding)

        results.append(
            {
                "chunk_id": row["chunk_id"],
                "document_id": chunk["document_id"],
                "repository_id": document["repository_id"],
                "repository_version_id": chunk["repository_version_id"],
                "file_path": document["path"],
                "heading_path": chunk.get("heading_path"),
                "content": chunk["content"],
                "embedding": embedding,
            }
        )

    return results

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
            chunk_index,
            content,
            content_hash,
            token_count,
            heading_path,
            start_line,
            end_line,
            metadata,
            documents!inner(
                repository_id,
                path
            )
            """
        )
        .execute()
    )

    results: list[dict[str, Any]] = []

    for row in response.data or []:
        document = row["documents"]

        results.append(
            {
                "chunk_id": row["id"],
                "document_id": row["document_id"],
                "repository_id": document["repository_id"],
                "repository_version_id": row["repository_version_id"],
                "chunk_index": row["chunk_index"],
                "file_path": document["path"],
                "content": row["content"],
                "content_hash": row["content_hash"],
                "token_count": row["token_count"],
                "heading_path": row["heading_path"],
                "start_line": row["start_line"],
                "end_line": row["end_line"],
                "metadata": row["metadata"],
            }
        )

    return results