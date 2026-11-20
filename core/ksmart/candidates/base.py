from dataclasses import dataclass


@dataclass(frozen=True)
class Candidate:
    text: str
    strategy: str
