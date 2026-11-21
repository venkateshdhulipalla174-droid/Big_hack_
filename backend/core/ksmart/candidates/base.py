from dataclasses import dataclass


@dataclass(frozen=True)
class Candidate:
    text: str
    strategy: str
    token_count: int | None = None
