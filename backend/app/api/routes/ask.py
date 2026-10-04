import logging
from collections.abc import AsyncIterator

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.schema.ask import AskRequest
from app.services.llm import LLMError, stream_chat_completion
from app.services.prompt import build_messages
from app.services.retrieval import hybrid_search

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Ask"])


@router.post("/stream")
async def ask_stream(request: AskRequest):
    try:
        chunks = await hybrid_search(
            query=request.question,
            top_k=request.top_k,
            repository_id=request.repository_id,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Search failed: {exc}",
        ) from exc

    try:
        tokens = await stream_chat_completion(
            build_messages(request.question, chunks)
        )
    except LLMError as exc:
        raise HTTPException(
            status_code=502,
            detail=str(exc),
        ) from exc

    async def body() -> AsyncIterator[str]:
        # Headers are already sent, so a mid-stream failure can only
        # be logged and the stream cut short.
        try:
            async for token in tokens:
                yield token
        except LLMError:
            logger.exception("Answer stream failed")

    return StreamingResponse(
        body(),
        media_type="text/plain; charset=utf-8",
        headers={"X-Accel-Buffering": "no"},
    )
