from .base import Candidate


def create(text: str) -> Candidate:
    return Candidate(text=text, strategy="romanized")
