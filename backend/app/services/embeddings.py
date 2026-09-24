import logging
from typing import Any

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)


class EmbeddingError(RuntimeError):
    """Raised when embedding generation fails."""


def embed_text(text: str) -> list[float]:

    if not text or not text.strip():
        raise ValueError("Cannot embed empty text")

    settings = get_settings()

    if settings.embedding_provider != "ollama":
        raise EmbeddingError(
            f"Unsupported embedding provider: "
            f"{settings.embedding_provider}"
        )

    url = (
        f"{settings.ollama_host.rstrip('/')}"
        "/api/embeddings"
    )

    try:
        response = httpx.post(
            url,
            json={
                "model": settings.embedding_model,
                "prompt": text,
            },
            timeout=settings.model_timeout_seconds,
        )

        response.raise_for_status()

    except httpx.HTTPError as exc:
        raise EmbeddingError(
            f"Embedding provider request failed: {exc}"
        ) from exc

    try:
        payload: dict[str, Any] = response.json()
    except ValueError as exc:
        raise EmbeddingError(
            "Embedding provider returned invalid JSON"
        ) from exc

    embedding = payload.get("embedding")

    if not isinstance(embedding, list):
        raise EmbeddingError(
            "Embedding provider returned no vector"
        )

    if not embedding:
        raise EmbeddingError(
            "Embedding provider returned an empty vector"
        )

    try:
        vector = [float(value) for value in embedding]
    except (TypeError, ValueError) as exc:
        raise EmbeddingError(
            "Embedding vector contains invalid values"
        ) from exc

    if len(vector) != settings.embedding_dimension:
        raise EmbeddingError(
            "Embedding dimension mismatch: "
            f"expected {settings.embedding_dimension}, "
            f"received {len(vector)}"
        )

    return vector