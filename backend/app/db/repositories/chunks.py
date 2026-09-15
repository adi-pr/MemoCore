from uuid import UUID

from app.db.supabase import get_supabase


def create_chunk(
    document_id: UUID,
    repository_version_id: UUID,
    chunk_index: int,
    content: str,
    content_hash: str,
    token_count: int,
    heading_path: str | None,
    start_line: int,
    end_line: int,
):
    supabase = get_supabase()

    response = (
        supabase
        .table("document_chunks")
        .insert({
            "document_id": str(document_id),
            "repository_version_id": str(
                repository_version_id
            ),
            "chunk_index": chunk_index,
            "content": content,
            "content_hash": content_hash,
            "token_count": token_count,
            "heading_path": heading_path,
            "start_line": start_line,
            "end_line": end_line,
        })
        .execute()
    )

    if not response.data:
        raise RuntimeError(
            "Failed to create document chunk"
        )

    return response.data[0]

def create_chunks(
    document_id: UUID,
    repository_version_id: UUID,
    chunks,
):
    created = []

    for chunk in chunks:
        created.append(
            create_chunk(
                document_id=document_id,
                repository_version_id=(
                    repository_version_id
                ),
                chunk_index=chunk.chunk_index,
                content=chunk.content,
                content_hash=chunk.content_hash,
                token_count=chunk.token_count,
                heading_path=chunk.heading_path,
                start_line=chunk.start_line,
                end_line=chunk.end_line,
            )
        )

    return created
