"""Combined candidate strategy applying numeral conversion and whitespace reduction."""

from .base import Candidate
from . import concise, numerals


def create(text: str) -> Candidate:
    """Create a combined candidate by applying numeral conversion and whitespace collapse."""
    num_cand = numerals.create(text)
    concise_cand = concise.create(num_cand.text)
    return Candidate(text=concise_cand.text, strategy="combined")

