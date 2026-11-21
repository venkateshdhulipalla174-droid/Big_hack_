from dataclasses import dataclass


@dataclass(frozen=True)
class PipelineConfig:
    tokenizer: str = "qwen"
