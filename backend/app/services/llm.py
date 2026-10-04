import json
import logging
from collections.abc import AsyncIterator
from typing import Any

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)


class LLMError(RuntimeError):
    """Raised when the LLM provider request fails."""


async def stream_chat_completion(
    messages: list[dict[str, str]],
) -> AsyncIterator[str]:
    """Open a streaming chat completion against LM Studio.

    Connection and HTTP errors are raised here, before any tokens are
    yielded, so callers can still return a proper error response.
    """
    settings = get_settings()

    url = (
        f"{settings.lmstudio_host.rstrip('/')}"
        "/v1/chat/completions"
    )

    client = httpx.AsyncClient(
        timeout=settings.model_timeout_seconds,
    )

    try:
        response = await client.send(
            client.build_request(
                "POST",
                url,
                json={
                    "model": settings.llm_model,
                    "messages": messages,
                    "stream": True,
                },
            ),
            stream=True,
        )
    except httpx.HTTPError as exc:
        await client.aclose()
        raise LLMError(
            f"LLM provider request failed: {exc}"
        ) from exc

    if response.is_error:
        body = await response.aread()
        await response.aclose()
        await client.aclose()
        raise LLMError(
            f"LLM provider returned {response.status_code}: "
            f"{body.decode(errors='replace')}"
        )

    return _iter_content(client, response)


async def _iter_content(
    client: httpx.AsyncClient,
    response: httpx.Response,
) -> AsyncIterator[str]:
    try:
        async for line in response.aiter_lines():
            if not line.startswith("data:"):
                continue

            data = line.removeprefix("data:").strip()

            if data == "[DONE]":
                break

            try:
                payload: dict[str, Any] = json.loads(data)
            except ValueError:
                logger.warning("Skipping invalid stream event: %s", data)
                continue

            if "error" in payload:
                raise LLMError(
                    f"LLM provider stream error: {payload['error']}"
                )

            for choice in payload.get("choices") or []:
                # Reasoning models put their thinking in a separate
                # field; only the answer text is forwarded.
                content = (choice.get("delta") or {}).get("content")

                if content:
                    yield content

    except httpx.HTTPError as exc:
        raise LLMError(
            f"LLM provider stream failed: {exc}"
        ) from exc

    finally:
        await response.aclose()
        await client.aclose()
