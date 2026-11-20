from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

from app.main import app
from app.services.gemini_client import (
    GeminiConfigError,
    GeminiRateLimitError,
    GeminiResult,
    GeminiTimeoutError,
    LLMTokenUsage,
)

client = TestClient(app)


def _mock_gemini_result(text="Mocked Gemini response", prompt_tokens=18, output_tokens=42):
    return GeminiResult(
        text=text,
        model="gemini-2.5-flash",
        latency_ms=320.5,
        usage=LLMTokenUsage(
            prompt_tokens=prompt_tokens,
            output_tokens=output_tokens,
            thinking_tokens=0,
            total_tokens=prompt_tokens + output_tokens,
        ),
        finish_reason="STOP",
    )


@patch("app.api.chat.gemini_service")
def test_chat_success(mock_gemini):
    mock_gemini.count_tokens.return_value = 12
    mock_gemini.generate.return_value = _mock_gemini_result(text="ಕ್ವಾಂಟಮ್ ಕಂಪ್ಯೂಟಿಂಗ್ ವಿವರಣೆ")

    payload = {
        "prompt": "ಕ್ವಾಂಟಮ್ ಎಂದರೇನು?",
        "optimize": True,
        "include_candidates": True,
    }

    response = client.post("/api/v1/chat", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["original_prompt"] == "ಕ್ವಾಂಟಮ್ ಎಂದರೇನು?"
    assert data["optimized_prompt"] == "ಕ್ವಾಂಟಮ್ ಎಂದರೇನು?"  # Phase 4 baseline: original used directly
    assert data["chosen_candidate"] == "original"
    assert len(data["candidates"]) == 1
    assert data["candidates"][0]["name"] == "original"
    assert data["candidates"][0]["tokens"] == 12

    # Tokens verification
    tokens = data["tokens"]
    assert tokens["tokenizer"] == "gemini-countTokens"
    assert tokens["original_input"] == 12
    assert tokens["optimized_input"] == 12
    assert tokens["saved"] == 0
    assert tokens["saved_percent"] == 0.0
    assert tokens["llm_prompt_tokens"] == 18
    assert tokens["llm_output_tokens"] == 42
    assert tokens["llm_total_tokens"] == 60

    # Response and latency
    assert data["response"] == "ಕ್ವಾಂಟಮ್ ಕಂಪ್ಯೂಟಿಂಗ್ ವಿವರಣೆ"
    assert data["latency_ms"]["llm"] == 320.5
    assert data["latency_ms"]["total"] == 320.5
    assert data["model"] == "gemini-2.5-flash"
    assert data["error"] is None


def test_chat_empty_prompt_validation():
    # Whitespace only
    response = client.post("/api/v1/chat", json={"prompt": "    "})
    assert response.status_code == 422
    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == "invalid_request"

    # Empty string
    response = client.post("/api/v1/chat", json={"prompt": ""})
    assert response.status_code == 422


@patch("app.api.chat.gemini_service")
def test_chat_rate_limited(mock_gemini):
    mock_gemini.count_tokens.return_value = 10
    mock_gemini.generate.side_effect = GeminiRateLimitError(
        "Rate limit exceeded",
        retry_after_s=15.0,
    )

    response = client.post("/api/v1/chat", json={"prompt": "Test"})
    assert response.status_code == 429
    data = response.json()
    assert data["error"]["code"] == "rate_limited"
    assert data["error"]["retry_after_s"] == 15.0


@patch("app.api.chat.gemini_service")
def test_chat_timeout(mock_gemini):
    mock_gemini.count_tokens.return_value = 10
    mock_gemini.generate.side_effect = GeminiTimeoutError("Request timed out")

    response = client.post("/api/v1/chat", json={"prompt": "Test"})
    assert response.status_code == 504
    data = response.json()
    assert data["error"]["code"] == "llm_timeout"


@patch("app.api.chat.gemini_service")
def test_chat_gemini_unconfigured(mock_gemini):
    mock_gemini.count_tokens.side_effect = GeminiConfigError("API key not configured")
    mock_gemini.generate.side_effect = GeminiConfigError("API key not configured")

    response = client.post("/api/v1/chat", json={"prompt": "Test"})
    assert response.status_code == 502
    data = response.json()
    assert data["error"]["code"] == "llm_unavailable"


@patch("app.api.chat.gemini_service")
def test_chat_token_counting_failure_falls_back_to_null(mock_gemini):
    # If token count fails, return null for counts and do NOT fabricate metrics
    mock_gemini.count_tokens.side_effect = Exception("Token counting network error")
    mock_gemini.generate.return_value = _mock_gemini_result(text="Successful answer")

    response = client.post("/api/v1/chat", json={"prompt": "Hello"})
    assert response.status_code == 200

    data = response.json()
    assert data["response"] == "Successful answer"
    tokens = data["tokens"]
    assert tokens["original_input"] is None
    assert tokens["optimized_input"] is None
    assert tokens["saved"] is None
    assert tokens["saved_percent"] is None
    # LLM usage metadata from generate call should still be present
    assert tokens["llm_prompt_tokens"] == 18
    assert tokens["llm_output_tokens"] == 42


@patch("app.api.chat.gemini_service")
def test_chat_candidates_omitted_when_include_candidates_false(mock_gemini):
    mock_gemini.count_tokens.return_value = 5
    mock_gemini.generate.return_value = _mock_gemini_result()

    payload = {
        "prompt": "Test",
        "include_candidates": False,
    }
    response = client.post("/api/v1/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["candidates"] == []


@patch("app.api.chat.gemini_service")
def test_frontend_compatibility(mock_gemini):
    # Existing frontend sends only { prompt: "..." }
    mock_gemini.count_tokens.return_value = 8
    mock_gemini.generate.return_value = _mock_gemini_result(text="Frontend answer")

    payload = {"prompt": "Legacy prompt from frontend"}
    response = client.post("/api/v1/chat", json=payload)
    assert response.status_code == 200

    data = response.json()
    # Frontend expects both prompt and response fields to exist
    assert data["prompt"] == "Legacy prompt from frontend"
    assert data["response"] == "Frontend answer"


@patch("app.api.chat.gemini_service")
def test_no_secret_leakage_in_error(mock_gemini):
    leaky_secret = "AIzaSySecretApiKey12345"
    mock_gemini.generate.side_effect = Exception(f"Internal crash with {leaky_secret}")

    response = client.post("/api/v1/chat", json={"prompt": "Test"})
    assert response.status_code == 500
    assert leaky_secret not in response.text
    for val in response.headers.values():
        assert leaky_secret not in val
