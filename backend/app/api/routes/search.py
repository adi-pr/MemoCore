from fastapi import APIRouter, HTTPException

from app.core.config import get_settings
from app.db.repositories.search import get_all_embedded_chunks, get_all_chunks
from app.schema.search import SearchRequest, SearchResult
from app.services.embeddings import embed_text
from app.services.reranker import merge_candidates, rerank_chunks
from app.services.search import dense_search_chunks, sparse_search

import asyncio

router = APIRouter(tags=["search"])


@router.post("", response_model=list[SearchResult])
async def search(request: SearchRequest):
    try:
        settings = get_settings()
        candidate_limit = request.top_k * settings.rerank_candidate_multiplier

        query_embedding = embed_text(request.query)
        chunks = get_all_embedded_chunks()
        chunks_unbed = get_all_chunks()

        sparse_res, dense_res = await asyncio.gather(
            asyncio.to_thread(
                sparse_search,
                query_raw=request.query,
                chunks=chunks_unbed,
                limit=candidate_limit,
                repository_id=request.repository_id,
            ),
            asyncio.to_thread(
                dense_search_chunks,
                query_embedding=query_embedding,
                chunks=chunks,
                limit=candidate_limit,
                repository_id=request.repository_id,
            ),
        )

        candidates = merge_candidates(dense_res, sparse_res)

        return await asyncio.to_thread(
            rerank_chunks,
            query=request.query,
            candidates=candidates,
            limit=request.top_k,
        )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Search failed: {exc}",
        ) from exc
