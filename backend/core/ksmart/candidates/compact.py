"""Compact candidate strategy applying Kannada politeness trimming and whitespace reduction."""

import re
from .base import Candidate

# Horizontal whitespace collapse
HORIZONTAL_WS_PATTERN = re.compile(r"(?<=\S)[ \t]+(?=\S)")

# Conversational politeness markers and boilerplate pleasantries in Kannada
POLITENESS_PATTERNS = [
    # "Please" markers at start or within text
    (re.compile(r"^\s*ದಯವಿಟ್ಟು\s*,?\s*", re.IGNORECASE), ""),
    (re.compile(r"\bದಯವಿಟ್ಟು\s*,?\s*", re.IGNORECASE), ""),
    (re.compile(r"^\s*ದಯಮಾಡಿ\s*,?\s*", re.IGNORECASE), ""),
    (re.compile(r"\bದಯಮಾಡಿ\s*,?\s*", re.IGNORECASE), ""),
    # "Thank you" markers at end or within text
    (re.compile(r"\s*,?\s*ತುಂಬಾ\s+ಧನ್ಯವಾದಗಳು!?\s*$", re.IGNORECASE), ""),
    (re.compile(r"\s*,?\s*ಧನ್ಯವಾದಗಳು!?\s*$", re.IGNORECASE), ""),
    (re.compile(r"\s*,?\s*ಕೃತಜ್ಞತೆಗಳು!?\s*$", re.IGNORECASE), ""),
    # Verbose directive streamlining
    (re.compile(r"ಸ್ವಲ್ಪ\s+ವಿವರವಾಗಿ\s+ಮಾಹಿತಿ\s+ನೀಡಿ", re.IGNORECASE), "ಮಾಹಿತಿ ನೀಡಿ"),
    (re.compile(r"ದಯವಿಟ್ಟು\s+ತಿಳಿಸಿಕೊಡಿ", re.IGNORECASE), "ತಿಳಿಸಿ"),
]


def create(text: str) -> Candidate:
    """Create a compact candidate by removing conversational pleasantries and collapsing whitespace."""
    result = text
    for pattern, replacement in POLITENESS_PATTERNS:
        result = pattern.sub(replacement, result)

    result = HORIZONTAL_WS_PATTERN.sub(" ", result).strip()
    return Candidate(text=result, strategy="compact")
