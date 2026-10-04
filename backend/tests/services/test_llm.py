import json
from unittest.mock import patch

import httpx
import pytest

from app.services.llm import LLMError, stream_chat_completion


def mock_settings():
    """Return settings suitable for testing."""
    settings = type("Settings", (), {})()
    settings.lmstudio_host = "http://localhost:1234/"
    settings.llm_model = "test-model"
    settings.model_timeout_seconds = 60
    return settings


def sse(*events: dict | str) -> bytes:
    lines = [
        f"data: {event if isinstance(event, str) else json.dumps(event)}"
        for event in events
    ]
    return ("\n\n".join(lines) + "\n\n").encode()


def delta(**fields) -> dict:
    return {"choices": [{"index": 0, "delta": fields}]}


def patch_client(handler):
    real_client = httpx.AsyncClient

    def make_client(**kwargs):
        return real_client(transport=httpx.MockTransport(handler), **kwargs)

    return (
        patch("app.services.llm.get_settings", return_value=mock_settings()),
        patch("app.services.llm.httpx.AsyncClient", side_effect=make_client),
    )


async def collect(messages=None) -> list[str]:
    tokens = await stream_chat_completion(
        messages or [{"role": "user", "content": "hi"}]
    )
    return [token async for token in tokens]


@pytest.mark.asyncio
async def test_streams_content_tokens():
    requests: list[httpx.Request] = []

    def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        return httpx.Response(
            200,
            content=sse(
                delta(role="assistant"),
                delta(reasoning="thinking..."),
                delta(content="Hello"),
                delta(content=" world"),
                "[DONE]",
            ),
        )

    settings_patch, client_patch = patch_client(handler)

    with settings_patch, client_patch:
        tokens = await collect()

    assert tokens == ["Hello", " world"]

    request = requests[0]
    assert str(request.url) == "http://localhost:1234/v1/chat/completions"
    assert json.loads(request.content) == {
        "model": "test-model",
        "messages": [{"role": "user", "content": "hi"}],
        "stream": True,
    }


@pytest.mark.asyncio
async def test_skips_invalid_events():
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            content=b": keep-alive\n\ndata: not-json\n\n"
            + sse(delta(content="ok"), "[DONE]"),
        )

    settings_patch, client_patch = patch_client(handler)

    with settings_patch, client_patch:
        assert await collect() == ["ok"]


@pytest.mark.asyncio
async def test_raises_on_connection_error():
    def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("Connection refused")

    settings_patch, client_patch = patch_client(handler)

    with settings_patch, client_patch:
        with pytest.raises(LLMError, match="LLM provider request failed"):
            await stream_chat_completion([])


@pytest.mark.asyncio
async def test_raises_on_http_error_before_streaming():
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(404, text="model not loaded")

    settings_patch, client_patch = patch_client(handler)

    with settings_patch, client_patch:
        with pytest.raises(LLMError, match="404: model not loaded"):
            await stream_chat_completion([])


@pytest.mark.asyncio
async def test_raises_on_stream_error_event():
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            content=sse(delta(content="partial"), {"error": "boom"}),
        )

    settings_patch, client_patch = patch_client(handler)

    with settings_patch, client_patch:
        with pytest.raises(LLMError, match="stream error: boom"):
            await collect()
