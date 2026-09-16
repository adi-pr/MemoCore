from unittest.mock import patch

import httpx
import pytest

from app.services.embeddings import EmbeddingError, embed_text


def mock_settings():
    """Return settings suitable for testing."""
    settings = type("Settings", (), {})()
    settings.embedding_provider = "ollama"
    settings.ollama_host = "http://localhost:11434"
    settings.embedding_model = "nomic-embed-text"
    settings.embedding_dimension = 3
    settings.model_timeout_seconds = 60
    return settings


def test_embed_text_success():
    fake_embedding = [0.1, 0.2, 0.3]

    with (
        patch("app.services.embeddings.get_settings", return_value=mock_settings()),
        patch("app.services.embeddings.httpx.post") as mock_post,
    ):
        mock_post.return_value.json.return_value = {
            "embedding": fake_embedding
        }
        mock_post.return_value.raise_for_status.return_value = None

        result = embed_text("hello world")

    assert result == fake_embedding

    mock_post.assert_called_once_with(
        "http://localhost:11434/api/embeddings",
        json={
            "model": "nomic-embed-text",
            "prompt": "hello world",
        },
        timeout=60,
    )


def test_embed_text_rejects_empty_text():
    with pytest.raises(
        ValueError,
        match="Cannot embed empty text",
    ):
        embed_text("")


def test_embed_text_rejects_whitespace():
    with pytest.raises(
        ValueError,
        match="Cannot embed empty text",
    ):
        embed_text("   ")


def test_embed_text_rejects_unsupported_provider():
    settings = mock_settings()
    settings.embedding_provider = "openai"

    with patch(
        "app.services.embeddings.get_settings",
        return_value=settings,
    ):
        with pytest.raises(
            EmbeddingError,
            match="Unsupported embedding provider: openai",
        ):
            embed_text("hello")


def test_embed_text_handles_http_error():
    settings = mock_settings()

    with (
        patch(
            "app.services.embeddings.get_settings",
            return_value=settings,
        ),
        patch("app.services.embeddings.httpx.post") as mock_post,
    ):
        mock_post.side_effect = httpx.ConnectError("Connection failed")

        with pytest.raises(
            EmbeddingError,
            match="Embedding provider request failed",
        ):
            embed_text("hello")


def test_embed_text_handles_invalid_json():
    settings = mock_settings()

    with (
        patch(
            "app.services.embeddings.get_settings",
            return_value=settings,
        ),
        patch("app.services.embeddings.httpx.post") as mock_post,
    ):
        mock_post.return_value.raise_for_status.return_value = None
        mock_post.return_value.json.side_effect = ValueError(
            "Invalid JSON"
        )

        with pytest.raises(
            EmbeddingError,
            match="Embedding provider returned invalid JSON",
        ):
            embed_text("hello")


def test_embed_text_rejects_missing_embedding():
    settings = mock_settings()

    with (
        patch(
            "app.services.embeddings.get_settings",
            return_value=settings,
        ),
        patch("app.services.embeddings.httpx.post") as mock_post,
    ):
        mock_post.return_value.raise_for_status.return_value = None
        mock_post.return_value.json.return_value = {}

        with pytest.raises(
            EmbeddingError,
            match="Embedding provider returned no vector",
        ):
            embed_text("hello")


def test_embed_text_rejects_non_list_embedding():
    settings = mock_settings()

    with (
        patch(
            "app.services.embeddings.get_settings",
            return_value=settings,
        ),
        patch("app.services.embeddings.httpx.post") as mock_post,
    ):
        mock_post.return_value.raise_for_status.return_value = None
        mock_post.return_value.json.return_value = {
            "embedding": "not-a-list"
        }

        with pytest.raises(
            EmbeddingError,
            match="Embedding provider returned no vector",
        ):
            embed_text("hello")


def test_embed_text_rejects_empty_embedding():
    settings = mock_settings()

    with (
        patch(
            "app.services.embeddings.get_settings",
            return_value=settings,
        ),
        patch("app.services.embeddings.httpx.post") as mock_post,
    ):
        mock_post.return_value.raise_for_status.return_value = None
        mock_post.return_value.json.return_value = {
            "embedding": []
        }

        with pytest.raises(
            EmbeddingError,
            match="Embedding provider returned an empty vector",
        ):
            embed_text("hello")


def test_embed_text_rejects_invalid_embedding_values():
    settings = mock_settings()

    with (
        patch(
            "app.services.embeddings.get_settings",
            return_value=settings,
        ),
        patch("app.services.embeddings.httpx.post") as mock_post,
    ):
        mock_post.return_value.raise_for_status.return_value = None
        mock_post.return_value.json.return_value = {
            "embedding": [0.1, "invalid", 0.3]
        }

        with pytest.raises(
            EmbeddingError,
            match="Embedding vector contains invalid values",
        ):
            embed_text("hello")


def test_embed_text_rejects_wrong_dimension():
    settings = mock_settings()

    with (
        patch(
            "app.services.embeddings.get_settings",
            return_value=settings,
        ),
        patch("app.services.embeddings.httpx.post") as mock_post,
    ):
        mock_post.return_value.raise_for_status.return_value = None
        mock_post.return_value.json.return_value = {
            "embedding": [0.1, 0.2]
        }

        with pytest.raises(
            EmbeddingError,
            match="Embedding dimension mismatch",
        ):
            embed_text("hello")
