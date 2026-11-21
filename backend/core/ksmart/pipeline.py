"""K-SMART prompt optimization pipeline."""

from dataclasses import dataclass, replace
from typing import Any

from .candidates import combined, concise, normalized, numerals, original, compact
from .candidates.base import Candidate
from .config import PipelineConfig
from .guard import KANNADA_DIGIT_PATTERN, guard_pass, is_numeral_script_topic
from .select import select
from .tokenizers import count_tokens


@dataclass(frozen=True)
class PipelineResult:
    candidate: Candidate
    metadata: dict


def optimize(
    prompt: str,
    client: Any,
    config: PipelineConfig | None = None,
) -> PipelineResult:
    """Optimize a Kannada prompt using candidate generation, safety guards, and Gemini token counting.

    Args:
        prompt: The input prompt string.
        client: The Gemini API client instance used to count tokens.
        config: Optional PipelineConfig instance specifying model configuration.

    Returns:
        PipelineResult containing the selected Candidate and optimization metadata.

    Raises:
        TypeError: If prompt is not a string.
        ValueError: If prompt is empty/whitespace, client is missing, or the
                    original candidate fails the meaning-preservation guard.
        RuntimeError: If Gemini API token counting fails.
    """
    if not isinstance(prompt, str):
        raise TypeError("Prompt must be a string")
    if not prompt.strip():
        raise ValueError("Prompt cannot be empty")
    if client is None:
        raise ValueError("A Gemini client must be provided")

    if config is None:
        config = PipelineConfig()
    model = config.tokenizer

    # 1. Generate original candidate and verify it passes the guard as baseline
    orig_cand = original.create(prompt)
    if not guard_pass(prompt, orig_cand.text):
        raise ValueError("Original candidate failed the meaning-preservation guard")

    # 2. Generate candidates: normalized, and conditionally numerals
    guarded_candidates = [orig_cand]
    norm_cand = normalized.create(prompt)
    if guard_pass(prompt, norm_cand.text):
        guarded_candidates.append(norm_cand)

    # 3. Generate numerals candidate only if prompt contains Kannada digits
    # and does not discuss Kannada numerals or script as a topic
    if KANNADA_DIGIT_PATTERN.search(prompt) and not is_numeral_script_topic(prompt):
        num_cand = numerals.create(prompt)
        if guard_pass(prompt, num_cand.text):
            guarded_candidates.append(num_cand)

    # 4. Generate concise candidate only if it differs from original and passes guard
    concise_cand = concise.create(prompt)
    if concise_cand.text != prompt and guard_pass(prompt, concise_cand.text):
        guarded_candidates.append(concise_cand)

    # 4b. Generate compact candidate (politeness/pleasantry trimming + whitespace collapse)
    compact_cand = compact.create(prompt)
    existing_texts = {c.text for c in guarded_candidates}
    if (
        compact_cand.text != prompt
        and compact_cand.text not in existing_texts
        and guard_pass(prompt, compact_cand.text)
    ):
        guarded_candidates.append(compact_cand)

    # 5. Generate combined candidate only if prompt contains Kannada digits,
    # does not discuss numerals/script as a topic, differs from original,
    # is not already in the candidate list, and passes guard
    if KANNADA_DIGIT_PATTERN.search(prompt) and not is_numeral_script_topic(prompt):
        combined_cand = combined.create(prompt)
        existing_texts = {c.text for c in guarded_candidates}
        if (
            combined_cand.text != prompt
            and combined_cand.text not in existing_texts
            and guard_pass(prompt, combined_cand.text)
        ):
            guarded_candidates.append(combined_cand)

    # 6. Deduplicate candidate texts to avoid redundant Gemini API token count calls
    token_cache: dict[str, int] = {}
    for cand in guarded_candidates:
        if cand.text not in token_cache:
            try:
                token_cache[cand.text] = count_tokens(
                    cand.text, client=client, model=model
                )
            except Exception as e:
                raise RuntimeError(
                    f"Gemini API token counting failed for model {model!r}: {e}"
                ) from e

    # 7. Attach token counts to frozen Candidate instances using replace()
    scored_candidates = [
        replace(cand, token_count=token_cache[cand.text])
        for cand in guarded_candidates
    ]

    # 8. Select the best candidate with the lowest token count
    selected = select(scored_candidates)

    # 9. Compute savings metadata strictly using the original candidate as baseline
    original_candidate = next(
        c for c in scored_candidates if c.strategy == "original"
    )
    original_tokens = original_candidate.token_count
    optimized_tokens = selected.token_count

    if (
        original_tokens is not None
        and optimized_tokens is not None
        and original_tokens > 0
        and optimized_tokens < original_tokens
    ):
        tokens_saved = original_tokens - optimized_tokens
        percentage_saved = round((tokens_saved / original_tokens) * 100, 2)
    else:
        tokens_saved = 0
        percentage_saved = 0.0

    metadata = {
        "original_token_count": original_tokens,
        "optimized_token_count": optimized_tokens,
        "tokens_saved": tokens_saved,
        "percentage_saved": percentage_saved,
        "original_tokens": original_tokens,
        "optimized_tokens": optimized_tokens,
        "strategy": selected.strategy,
        "model": model,
        "all_candidates": [
            {
                "name": c.strategy,
                "text": c.text,
                "tokens": c.token_count,
                "guard_passed": True,
                "guard_failures": [],
            }
            for c in scored_candidates
        ],
    }

    return PipelineResult(candidate=selected, metadata=metadata)
