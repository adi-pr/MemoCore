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
