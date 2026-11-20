"""Candidate selector for K-SMART pipeline."""

from .candidates.base import Candidate


def select(candidates: list[Candidate]) -> Candidate:
    """Select the eligible candidate with the lowest non-negative token count.

    Preserves deterministic behavior by selecting the first candidate encountered
    in case of a tie. Candidates with missing (None) or invalid token counts are
    ignored.

    Args:
        candidates: A list of Candidate objects.

    Returns:
        The Candidate with the lowest valid, non-negative integer token_count.

    Raises:
        ValueError: If candidates is empty or no candidate has a valid non-negative token_count.
    """
    if not candidates:
        raise ValueError("At least one candidate is required")

    eligible = [
        c
        for c in candidates
        if (tc := getattr(c, "token_count", None)) is not None
        and isinstance(tc, int)
        and not isinstance(tc, bool)
        and tc >= 0
    ]

    if not eligible:
        raise ValueError("No eligible candidate found with a valid non-negative token count")

    return min(eligible, key=lambda c: c.token_count)
