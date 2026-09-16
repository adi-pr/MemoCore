from typing import Any

from app.db.supabase import get_supabase

def search_chunks(
    query_embedding: list[float],
    match_count: int = 5,
    repository_id: str | None = None,
) -> list[dict[str, Any]]:
    supabase = get_supabase()
    
    response = supabase.rpc(
        "match_chunk_embeddings",
        {
            "query_embedding": query_embedding,
            "match_count": match_count,
            "filter_repository_id": repository_id,
        },
    ).execute()

    return response.data or []