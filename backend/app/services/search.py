import math
from typing import Any

def cosine_similarity(
    first: list[float],
    second: list[float],
) -> float:
    if len(first) != len(second):
        raise ValueError("Embedding dimensions do not match")

    first_norm = math.sqrt(
        sum(value * value for value in first)
    )

    second_norm = math.sqrt(
        sum(value * value for value in second)
    )

    if first_norm == 0 or second_norm == 0:
        return 0.0

    dot_product = sum(
        left * right
        for left, right in zip(first, second)
    )

    return dot_product / (first_norm * second_norm)


def search_chunks(
    query_embedding: list[float],
    chunks: list[dict[str, Any]],
    limit: int = 5,
    repository_id: str | None = None,
) -> list[dict[str, Any]]:
    scored_results: list[dict[str, Any]] = []

    for chunk in chunks:
        if (
            repository_id is not None
            and chunk["repository_id"] != repository_id
        ):
            continue

        score = cosine_similarity(
            query_embedding,
            chunk["embedding"],
        )

        result = {
            key: value
            for key, value in chunk.items()
            if key != "embedding"
        }
        result["similarity"] = score

        scored_results.append(result)

    scored_results.sort(
        key=lambda item: item["similarity"],
        reverse=True,
    )

    return scored_results[:limit]