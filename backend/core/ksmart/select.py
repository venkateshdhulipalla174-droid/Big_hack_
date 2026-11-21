from .candidates.base import Candidate


def select(candidates: list[Candidate]) -> Candidate:
    if not candidates:
        raise ValueError("At least one candidate is required")
    return candidates[0]
