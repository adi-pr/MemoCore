from unittest.mock import patch

from app.services.reranker import merge_candidates, rerank_chunks


def make_chunk(chunk_id: str, content: str, similarity: float = 0.0):
    return {
        "chunk_id": chunk_id,
        "content": content,
        "similarity": similarity,
    }


def mock_settings():
    settings = type("Settings", (), {})()
    settings.reranker_model = "test-model"
    return settings


class FakeEncoder:
    def __init__(self, scores):
        self.scores = scores

    def predict(self, pairs):
        return self.scores[: len(pairs)]


def test_merge_candidates_dedupes_by_chunk_id():
    dense = [make_chunk("a", "alpha", 0.9), make_chunk("b", "beta", 0.8)]
    sparse = [make_chunk("b", "beta", 12.0), make_chunk("c", "gamma", 3.0)]

    merged = merge_candidates(dense, sparse)

    assert [chunk["chunk_id"] for chunk in merged] == ["a", "b", "c"]
    # First occurrence wins.
    assert merged[1]["similarity"] == 0.8


def test_rerank_chunks_orders_by_cross_encoder_score():
    candidates = [
        make_chunk("a", "alpha"),
        make_chunk("b", "beta"),
        make_chunk("c", "gamma"),
    ]

    with (
        patch("app.services.reranker.get_settings", return_value=mock_settings()),
        patch(
            "app.services.reranker.get_cross_encoder",
            return_value=FakeEncoder([-2.0, 5.0, 1.0]),
        ),
    ):
        results = rerank_chunks("query", candidates, limit=2)

    assert [result["chunk_id"] for result in results] == ["b", "c"]
    assert all(0.0 <= result["similarity"] <= 1.0 for result in results)
    # Inputs are not mutated.
    assert candidates[0]["similarity"] == 0.0


def test_rerank_chunks_empty_candidates():
    assert rerank_chunks("query", [], limit=5) == []
