from dataclasses import dataclass


@dataclass(frozen=True)
class PipelineConfig:
    tokenizer: str = "gemini-3.8-flash"
