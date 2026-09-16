from fastapi import APIRouter, HTTPException

from app.db.repositories.search import search_chunks
from app.schema.search import SearchRequest, SearchResult
from app.services.embeddings import embed_text

router = APIRouter(tags=["Search"])


@router.post("", response_model=list[SearchResult])
def search(request: SearchRequest):
    try:
        query_embedding = embed_text(request.query)

        results = search_chunks(
            query_embedding=query_embedding,
            match_count=request.limit,
            repository_id=request.repository_id,
        )

        return results

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Search failed: {exc}",
        ) from exc