from ..normalize import normalize_text
from .base import Candidate


def create(text: str) -> Candidate:
    return Candidate(text=normalize_text(text), strategy="normalized")
