from fastapi import APIRouter, HTTPException

from app.db.repositories.search import get_all_embedded_chunks
from app.schema.search import SearchRequest, SearchResult
from app.services.embeddings import embed_text
from app.services.search import search_chunks

router = APIRouter(tags=["search"])


@router.post("", response_model=list[SearchResult])
def search(request: SearchRequest):
    try:
        query_embedding = embed_text(request.query)
        chunks = get_all_embedded_chunks()

        return search_chunks(
            query_embedding=query_embedding,
            chunks=chunks,
            limit=request.limit,
            repository_id=request.repository_id,
        )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Search failed: {exc}",
        ) from exc