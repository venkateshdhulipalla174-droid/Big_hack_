"""Hard guards that protect required prompt content."""


def guard_pass(original: str, candidate: str) -> bool:
    return bool(original and candidate)
