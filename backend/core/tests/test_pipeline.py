"""Tests for the K-SMART prompt optimization pipeline."""

from typing import Any
import pytest
from ksmart.config import PipelineConfig
from ksmart.pipeline import optimize


class MockResponse:
    def __init__(self, total_tokens: int):
        self.total_tokens = total_tokens


class MockModels:
    def __init__(
        self,
        token_map: dict[str, int | Exception] | None = None,
        default_tokens: int = 10,
    ):
        self.token_map = token_map or {}
        self.default_tokens = default_tokens
        self.call_count = 0
        self.call_history: list[tuple[str, str]] = []

    def count_tokens(self, model: str, contents: str) -> MockResponse:
        self.call_count += 1
        self.call_history.append((model, contents))
        val = self.token_map.get(contents, self.default_tokens)
        if isinstance(val, Exception):
            raise val
        return MockResponse(val)


class MockClient:
    def __init__(
        self,
        token_map: dict[str, int | Exception] | None = None,
        default_tokens: int = 10,
    ):
        self.models = MockModels(token_map=token_map, default_tokens=default_tokens)


def test_pipeline_input_validation():
    client = MockClient()

    # Non-string prompt raises TypeError
    with pytest.raises(TypeError, match="Prompt must be a string"):
        optimize(123, client=client)  # type: ignore

    # Empty or whitespace prompt raises ValueError
    with pytest.raises(ValueError, match="Prompt cannot be empty"):
        optimize("", client=client)

    with pytest.raises(ValueError, match="Prompt cannot be empty"):
        optimize("   \t\n", client=client)

    # Missing client raises ValueError
    with pytest.raises(ValueError, match="A Gemini client must be provided"):
        optimize("ಕನ್ನಡ", client=None)


def test_pipeline_candidate_generation_clean():
    # A clean prompt with no Kannada digits and no extra whitespace
    # produces original and normalized candidates.
    prompt = "ಕರ್ನಾಟಕದ ರಾಜಧಾನಿ ಬೆಂಗಳೂರು"
    client = MockClient(default_tokens=10)

    result = optimize(prompt, client=client)
    assert result.candidate.strategy in ("original", "normalized")
    assert result.candidate.text == prompt
    # Both candidates have identical text, so token counting called only once due to cache
    assert client.models.call_count == 1


def test_pipeline_candidate_generation_with_numerals():
    # Prompt containing Kannada digits in a quantity context
    prompt = "ನನಗೆ ೫ ಪುಸ್ತಕಗಳು ಬೇಕು"
    # original text: "ನನಗೆ ೫ ಪುಸ್ತಕಗಳು ಬೇಕು" (10 tokens)
    # numerals text: "ನನಗೆ 5 ಪುಸ್ತಕಗಳು ಬೇಕು" (8 tokens)
    client = MockClient(
        token_map={
            "ನನಗೆ ೫ ಪುಸ್ತಕಗಳು ಬೇಕು": 10,
            "ನನಗೆ 5 ಪುಸ್ತಕಗಳು ಬೇಕು": 8,
        }
    )

    result = optimize(prompt, client=client)
    assert result.candidate.strategy == "numerals"
    assert result.candidate.text == "ನನಗೆ 5 ಪುಸ್ತಕಗಳು ಬೇಕು"
    assert result.candidate.token_count == 8
    assert result.metadata["tokens_saved"] == 2
    assert result.metadata["percentage_saved"] == 20.0


def test_pipeline_skips_numerals_for_numeral_topic():
    # Prompt discussing Kannada numerals/script must skip numerals candidate
    prompt = "ಕನ್ನಡ ಅಂಕಿ ೪ ರ ಇತಿಹಾಸವೇನು?"
    # Even if ASCII converted would have fewer tokens, it must NOT be generated/selected
    client = MockClient(
        token_map={
            "ಕನ್ನಡ ಅಂಕಿ ೪ ರ ಇತಿಹಾಸವೇನು?": 12,
            "ಕನ್ನಡ ಅಂಕಿ 4 ರ ಇತಿಹಾಸವೇನು?": 8,
        }
    )

    result = optimize(prompt, client=client)
    # Strategy must be original or normalized, never numerals
    assert result.candidate.strategy != "numerals"
    assert "೪" in result.candidate.text
    # "ಕನ್ನಡ ಅಂಕಿ 4 ರ ಇತಿಹಾಸವೇನು?" was never evaluated or cached
    called_prompts = [item[1] for item in client.models.call_history]
    assert "ಕನ್ನಡ ಅಂಕಿ 4 ರ ಇತಿಹಾಸವೇನು?" not in called_prompts


def test_pipeline_candidate_generation_with_concise():
    # Prompt with redundant whitespace generates concise candidate
    prompt = "ದಯವಿಟ್ಟು    ಸಹಾಯ    ಮಾಡಿ"
    concise_text = "ದಯವಿಟ್ಟು ಸಹಾಯ ಮಾಡಿ"
    client = MockClient(
        token_map={
            prompt: 15,
            concise_text: 8,
        }
    )

    result = optimize(prompt, client=client)
    assert result.candidate.strategy == "concise"
    assert result.candidate.text == concise_text
    assert result.candidate.token_count == 8
    assert result.metadata["tokens_saved"] == 7
    assert result.metadata["percentage_saved"] == 46.67


def test_pipeline_fallback_to_original_on_tie():
    # When candidates have equal token counts, the original baseline must be selected
    prompt = "ದಯವಿಟ್ಟು    ಸಹಾಯ    ಮಾಡಿ"
    concise_text = "ದಯವಿಟ್ಟು ಸಹಾಯ ಮಾಡಿ"
    client = MockClient(
        token_map={
            prompt: 10,
            concise_text: 10,
        }
    )

    result = optimize(prompt, client=client)
    assert result.candidate.strategy == "original"
    assert result.candidate.text == prompt
    assert result.metadata["tokens_saved"] == 0
    assert result.metadata["percentage_saved"] == 0.0


def test_pipeline_deduplication_and_caching():
    # When multiple candidates share the exact same text, count_tokens must be called only once
    prompt = "ಕನ್ನಡ ಸಾಹಿತ್ಯ"
    client = MockClient(default_tokens=5)

    result = optimize(prompt, client=client)
    assert client.models.call_count == 1
    assert result.candidate.token_count == 5


def test_pipeline_zero_token_handling():
    # If the mock returns 0 tokens for original, savings calculation must not divide by zero
    prompt = "ಟೆಸ್ಟ್"
    client = MockClient(default_tokens=0)

    result = optimize(prompt, client=client)
    assert result.metadata["tokens_saved"] == 0
    assert result.metadata["percentage_saved"] == 0.0


def test_pipeline_api_error_handling():
    # If Gemini API raises an error, pipeline must raise RuntimeError
    prompt = "ಕನ್ನಡ ಸುದ್ದಿ"
    client = MockClient(
        token_map={
            prompt: ConnectionError("Network unreachable"),
        }
    )

    with pytest.raises(RuntimeError, match="Gemini API token counting failed"):
        optimize(prompt, client=client)


def test_pipeline_custom_config():
    # Pipeline respects custom config model
    prompt = "ಕನ್ನಡ ಭಾಷೆ"
    custom_config = PipelineConfig(tokenizer="gemini-custom-model")
    client = MockClient(default_tokens=6)

    result = optimize(prompt, client=client, config=custom_config)
    assert result.metadata["model"] == "gemini-custom-model"
    assert client.models.call_history[0][0] == "gemini-custom-model"


def test_pipeline_candidate_generation_with_combined():
    prompt = "ನನಗೆ   ೫   ಪುಸ್ತಕಗಳು ಬೇಕು"
    client = MockClient(
        token_map={
            "ನನಗೆ   ೫   ಪುಸ್ತಕಗಳು ಬೇಕು": 15,
            "ನನಗೆ   5   ಪುಸ್ತಕಗಳು ಬೇಕು": 12,
            "ನನಗೆ ೫ ಪುಸ್ತಕಗಳು ಬೇಕು": 11,
            "ನನಗೆ 5 ಪುಸ್ತಕಗಳು ಬೇಕು": 8,
        }
    )

    result = optimize(prompt, client=client)
    assert result.candidate.strategy == "combined"
    assert result.candidate.text == "ನನಗೆ 5 ಪುಸ್ತಕಗಳು ಬೇಕು"
    assert result.candidate.token_count == 8
    assert result.metadata["tokens_saved"] == 7
    assert result.metadata["percentage_saved"] == 46.67
    assert result.metadata["strategy"] == "combined"


def test_pipeline_combined_skips_for_numeral_topic():
    prompt = "ಕನ್ನಡ   ಅಂಕಿ   ೪ ರ ಇತಿಹಾಸವೇನು?"
    client = MockClient(
        token_map={
            prompt: 15,
            "ಕನ್ನಡ ಅಂಕಿ ೪ ರ ಇತಿಹಾಸವೇನು?": 10,
            "ಕನ್ನಡ ಅಂಕಿ 4 ರ ಇತಿಹಾಸವೇನು?": 6,
        }
    )

    result = optimize(prompt, client=client)
    assert result.candidate.strategy != "combined"
    assert result.candidate.strategy != "numerals"
    assert "೪" in result.candidate.text
    called_prompts = [item[1] for item in client.models.call_history]
    assert "ಕನ್ನಡ ಅಂಕಿ 4 ರ ಇತಿಹಾಸವೇನು?" not in called_prompts


def test_pipeline_combined_duplicate_not_added():
    # Prompt has digits but no extra whitespace; combined text equals numerals text
    prompt = "ನನಗೆ ೫ ಪುಸ್ತಕಗಳು ಬೇಕು"
    client = MockClient(
        token_map={
            "ನನಗೆ ೫ ಪುಸ್ತಕಗಳು ಬೇಕು": 10,
            "ನನಗೆ 5 ಪುಸ್ತಕಗಳು ಬೇಕು": 8,
        }
    )

    result = optimize(prompt, client=client)
    assert result.candidate.strategy == "numerals"
    assert result.candidate.text == "ನನಗೆ 5 ಪುಸ್ತಕಗಳು ಬೇಕು"


def test_pipeline_combined_tie_breaking_favors_existing_candidate():
    prompt = "ನನಗೆ   ೫   ಪುಸ್ತಕಗಳು ಬೇಕು"
    client = MockClient(
        token_map={
            "ನನಗೆ   ೫   ಪುಸ್ತಕಗಳು ಬೇಕು": 12,
            "ನನಗೆ   5   ಪುಸ್ತಕಗಳು ಬೇಕು": 9,
            "ನನಗೆ ೫ ಪುಸ್ತಕಗಳು ಬೇಕು": 10,
            "ನನಗೆ 5 ಪುಸ್ತಕಗಳು ಬೇಕು": 9,
        }
    )

    result = optimize(prompt, client=client)
    # Both numerals and combined have 9 tokens; numerals appears earlier, so numerals wins
    assert result.candidate.strategy == "numerals"
    assert result.candidate.text == "ನನಗೆ   5   ಪುಸ್ತಕಗಳು ಬೇಕು"


def test_pipeline_combined_quoted_content_protected():
    prompt = '"೫ ಪುಸ್ತಕಗಳು"    ಬೇಕು'
    client = MockClient(
        token_map={
            prompt: 14,
            '"೫ ಪುಸ್ತಕಗಳು" ಬೇಕು': 10,
            '"5 ಪುಸ್ತಕಗಳು" ಬೇಕು': 8,
        }
    )

    result = optimize(prompt, client=client)
    # Quotes protect "೫ ಪುಸ್ತಕಗಳು" from numeral conversion, so concise wins
    assert result.candidate.strategy == "concise"
    assert result.candidate.text == '"೫ ಪುಸ್ತಕಗಳು" ಬೇಕು'
