from dataclasses import dataclass

from .candidates.base import Candidate


@dataclass(frozen=True)
class PipelineResult:
    candidate: Candidate
    metadata: dict


def optimize(prompt: str) -> PipelineResult:
    candidate = Candidate(text=prompt, strategy="original")
    return PipelineResult(candidate=candidate, metadata={})
