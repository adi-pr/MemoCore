from fastapi import APIRouter, HTTPException

from app.schema.search import SearchRequest, SearchResult
from app.services.retrieval import hybrid_search

router = APIRouter(tags=["search"])


@router.post("", response_model=list[SearchResult])
async def search(request: SearchRequest):
    try:
        return await hybrid_search(
            query=request.query,
            top_k=request.top_k,
            repository_id=request.repository_id,
        )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Search failed: {exc}",
        ) from exc
