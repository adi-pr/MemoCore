import math
from functools import lru_cache
from typing import Any

from sentence_transformers import CrossEncoder

from app.core.config import get_settings


@lru_cache
def get_cross_encoder(model_name: str) -> CrossEncoder:
    return CrossEncoder(model_name)


def sigmoid(value: float) -> float:
    return 1.0 / (1.0 + math.exp(-value))


def merge_candidates(
    *result_lists: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Union retriever results, keeping the first copy of each chunk."""
    merged: dict[str, dict[str, Any]] = {}

    for results in result_lists:
        for result in results:
            chunk_id = result["chunk_id"]
            if chunk_id not in merged:
                merged[chunk_id] = dict(result)

    return list(merged.values())


def rerank_chunks(
    query: str,
    candidates: list[dict[str, Any]],
    limit: int = 5,
) -> list[dict[str, Any]]:
    if not candidates:
        return []

    settings = get_settings()
    encoder = get_cross_encoder(settings.reranker_model)

    pairs = [(query, candidate["content"]) for candidate in candidates]
    scores = encoder.predict(pairs)

    reranked: list[dict[str, Any]] = []
    for candidate, score in zip(candidates, scores):
        result = dict(candidate)
        # Cross-encoder outputs are logits; squash to 0-1.
        result["similarity"] = sigmoid(float(score))
        reranked.append(result)

    reranked.sort(
        key=lambda item: item["similarity"],
        reverse=True,
    )

    return reranked[:limit]
