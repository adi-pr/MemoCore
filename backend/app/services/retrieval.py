import asyncio
from typing import Any

from app.core.config import get_settings
from app.db.repositories.search import get_all_embedded_chunks, get_all_chunks
from app.services.embeddings import embed_text
from app.services.reranker import merge_candidates, rerank_chunks
from app.services.search import dense_search_chunks, sparse_search


async def hybrid_search(
    query: str,
    top_k: int,
    repository_id: str | None = None,
) -> list[dict[str, Any]]:
    """Dense + BM25 retrieval, merged and reranked with a cross-encoder."""
    settings = get_settings()
    candidate_limit = top_k * settings.rerank_candidate_multiplier

    query_embedding, chunks, chunks_unbed = await asyncio.gather(
        asyncio.to_thread(embed_text, query),
        asyncio.to_thread(get_all_embedded_chunks),
        asyncio.to_thread(get_all_chunks),
    )

    sparse_res, dense_res = await asyncio.gather(
        asyncio.to_thread(
            sparse_search,
            query_raw=query,
            chunks=chunks_unbed,
            limit=candidate_limit,
            repository_id=repository_id,
        ),
        asyncio.to_thread(
            dense_search_chunks,
            query_embedding=query_embedding,
            chunks=chunks,
            limit=candidate_limit,
            repository_id=repository_id,
        ),
    )

    candidates = merge_candidates(dense_res, sparse_res)

    return await asyncio.to_thread(
        rerank_chunks,
        query=query,
        candidates=candidates,
        limit=top_k,
    )
