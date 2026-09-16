from uuid import UUID

from app.core.config import get_settings
from app.db.supabase import get_supabase


def create_embedding(
    chunk_id: UUID,
    embedding: list[float],
):
    settings = get_settings()

    if len(embedding) != settings.embedding_dimension:
        raise ValueError(
            "Embedding dimension does not match configuration"
        )

    data = {
        "chunk_id": str(chunk_id),
        "embedding_model": settings.embedding_model,
        "embedding": embedding,
    }

    response = (
        get_supabase()
        .table("chunk_embeddings")
        .upsert(
            data,
            on_conflict="chunk_id,embedding_model",
        )
        .execute()
    )

    if not response.data:
        raise RuntimeError(
            f"Failed to store embedding for chunk {chunk_id}"
        )

    return response.data[0]