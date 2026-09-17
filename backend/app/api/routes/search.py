from fastapi import APIRouter, HTTPException

from app.db.repositories.search import get_all_embedded_chunks, get_all_chunks
from app.schema.search import SearchRequest, SearchResult
from app.services.embeddings import embed_text
from app.services.search import dense_search_chunks, sparse_search

import asyncio

router = APIRouter(tags=["search"])


@router.post("", response_model=list[SearchResult])
async def search(request: SearchRequest):
    try:
        query_embedding = embed_text(request.query)
        chunks = get_all_embedded_chunks()
        chunks_unbed = get_all_chunks()

        sparse_res, dense_res = await asyncio.gather(
            asyncio.to_thread(
                sparse_search,
                query_raw=request.query,
                chunks=chunks_unbed,
                limit=request.limit,
                repository_id=request.repository_id,
            ),
            asyncio.to_thread(
                dense_search_chunks,
                query_embedding=query_embedding,
                chunks=chunks,
                limit=request.limit,
                repository_id=request.repository_id,
            ),
        )

        # return unbed_res

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Search failed: {exc}",
        ) from exc