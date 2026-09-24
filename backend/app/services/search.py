import math
import string
from typing import Any

from rank_bm25 import BM25Okapi

def tokenize(text: str) -> list[str]:
    text = str(text).lower()
    text = text.translate(str.maketrans("", "", string.punctuation))
    return text.split()

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


def dense_search_chunks(
    query_embedding: list[float],
    chunks: list[dict[str, Any]], # Embedded Documents
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

def sparse_search(
    query_raw: str,
    chunks: list[dict[str, Any]],  # Unembedded Raw Documents
    limit: int = 5,
    repository_id: str | None = None,
) -> list[dict[str, Any]]:
    filtered_chunks: list[dict[str, Any]] = []
    for chunk in chunks:
        if (
            repository_id is not None
            and chunk.get("repository_id") != repository_id
        ):
            continue
        filtered_chunks.append(chunk)

    if not filtered_chunks:
        return []

    corpus = [tokenize(chunk.get("content", "")) for chunk in filtered_chunks]
    bm25 = BM25Okapi(corpus)

    tokenized_query = tokenize(query_raw)
    doc_scores = bm25.get_scores(tokenized_query)

    scored_results: list[dict[str, Any]] = []
    for index, score in enumerate(doc_scores):
        if score > 0.0:
            chunk = filtered_chunks[index]
            
            result = {
                key: value
                for key, value in chunk.items()
                if key != "embedding"
            }
            result["similarity"] = float(score)
            scored_results.append(result)

    scored_results.sort(
        key=lambda item: item["similarity"],
        reverse=True,
    )

    return scored_results[:limit]
