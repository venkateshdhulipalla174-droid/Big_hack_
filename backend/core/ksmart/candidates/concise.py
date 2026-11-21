import re

from .base import Candidate

# Matches consecutive horizontal spaces or tabs between non-whitespace characters on a line
HORIZONTAL_WS_PATTERN = re.compile(r"(?<=\S)[ \t]+(?=\S)")


def create(text: str) -> Candidate:
    """Create a concise candidate collapsing horizontal spaces and tabs while preserving newlines."""
    collapsed = HORIZONTAL_WS_PATTERN.sub(" ", text)
    return Candidate(text=collapsed, strategy="concise")
