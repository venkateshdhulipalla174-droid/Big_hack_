"""Tokenizer registry and Gemini token counting."""

from typing import Any


def count_tokens(text: str, client: Any, model: str = "gemini-2.5-flash") -> int:
    """Count tokens for text using the Gemini API client interface."""
    if not isinstance(text, str):
        raise TypeError("text must be a string")
    if not text.strip():
        raise ValueError("text cannot be empty")

    response = client.models.count_tokens(model=model, contents=text)
    return int(response.total_tokens)


def get_tokenizer(name: str):
    raise NotImplementedError(f"Tokenizer {name!r} is not implemented")
