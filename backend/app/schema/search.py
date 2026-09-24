from pydantic import BaseModel, Field


class SearchRequest(BaseModel):
    query: str = Field(min_length=1)
    repository_id: str | None = None
    top_k: int = Field(default=5, ge=1, le=50)


class SearchResult(BaseModel):
    chunk_id: str
    document_id: str
    repository_id: str
    repository_version_id: str
    file_path: str
    heading_path: str | None
    content: str
    similarity: float