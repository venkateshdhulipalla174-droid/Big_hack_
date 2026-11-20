"""Semantic similarity and hard-rule checks."""


def same_nonempty_text(left: str, right: str) -> bool:
    return bool(left and right and left == right)
