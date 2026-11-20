from fastapi import APIRouter, status
from fastapi.responses import JSONResponse

from ..schemas import (
    CandidateInfo,
    ChatRequest,
    ChatResponse,
    LatencyMetrics,
    TokenMetrics,
)
from ..services.gemini_client import (
    GeminiConfigError,
    GeminiRateLimitError,
    GeminiService,
    GeminiServiceError,
    GeminiTimeoutError,
)

router = APIRouter()
gemini_service = GeminiService()


@router.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    """
    K-SMART chat endpoint per API Contract v1.
    Phase 4: Baseline implementation sending original prompt directly to Gemini.
    """
    cleaned_prompt = request.prompt.strip()
    if not cleaned_prompt:
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "error": {
                    "code": "invalid_request",
                    "message": "Prompt cannot be empty or whitespace",
                    "retry_after_s": None,
                }
            },
        )

    # 1. Attempt exact token count via Gemini countTokens API
    # If counting fails, return null for unavailable counts and continue generation.
    raw_tokens = None
    try:
        raw_tokens = gemini_service.count_tokens(cleaned_prompt)
    except Exception:
        raw_tokens = None

    # 2. Phase 4 baseline: optimization is inactive; use original prompt directly
    processed_prompt = cleaned_prompt
    chosen_candidate = "original"
    candidates = []
    if request.include_candidates:
        candidates = [
            CandidateInfo(
                name="original",
                text=cleaned_prompt,
                tokens=raw_tokens,
                guard_passed=True,
                guard_failures=[],
            )
        ]

    # 3. Call Gemini generation
    try:
        result = gemini_service.generate(prompt=processed_prompt, temperature=0.0)
    except GeminiRateLimitError as err:
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={
                "error": {
                    "code": "rate_limited",
                    "message": "Gemini rate limit exceeded. Please retry later.",
                    "retry_after_s": getattr(err, "retry_after_s", None),
                }
            },
        )
    except GeminiTimeoutError:
        return JSONResponse(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            content={
                "error": {
                    "code": "llm_timeout",
                    "message": "Gemini did not respond within timeout (60s)",
                    "retry_after_s": None,
                }
            },
        )
    except GeminiConfigError:
        return JSONResponse(
            status_code=status.HTTP_502_BAD_GATEWAY,
            content={
                "error": {
                    "code": "llm_unavailable",
                    "message": "Gemini API key is not configured on the backend",
                    "retry_after_s": None,
                }
            },
        )
    except GeminiServiceError:
        return JSONResponse(
            status_code=status.HTTP_502_BAD_GATEWAY,
            content={
                "error": {
                    "code": "llm_unavailable",
                    "message": "Gemini API service is currently unavailable",
                    "retry_after_s": None,
                }
            },
        )
    except Exception:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": {
                    "code": "optimizer_error",
                    "message": "An unexpected server error occurred",
                    "retry_after_s": None,
                }
            },
        )

    # 4. Compute token metrics (Never fabricate; null if countTokens failed)
    if raw_tokens is not None:
        saved = 0
        saved_percent = 0.0
    else:
        saved = None
        saved_percent = None

    token_metrics = TokenMetrics(
        tokenizer="gemini-countTokens",
        original_input=raw_tokens,
        optimized_input=raw_tokens,
        saved=saved,
        saved_percent=saved_percent,
        llm_prompt_tokens=result.usage.prompt_tokens,
        llm_output_tokens=result.usage.output_tokens,
        llm_thinking_tokens=result.usage.thinking_tokens,
        llm_total_tokens=result.usage.total_tokens,
    )

    latency_metrics = LatencyMetrics(
        optimizer=0.0,
        llm=result.latency_ms,
        total=result.latency_ms,
    )

    return ChatResponse(
        prompt=cleaned_prompt,  # Preserves frontend compatibility
        original_prompt=cleaned_prompt,
        optimized_prompt=processed_prompt,
        chosen_candidate=chosen_candidate,
        candidates=candidates,
        tokens=token_metrics,
        response=result.text,
        latency_ms=latency_metrics,
        model=result.model,
        error=None,
    )
