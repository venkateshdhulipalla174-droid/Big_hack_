"""Hard guards that protect required prompt content.

This module provides conservative heuristic checks to detect semantic corruption
in candidate prompts. It verifies the preservation of critical entities including
numbers, quoted strings, URLs, email addresses, and key Kannada negation words.

Note:
    These checks are conservative safeguards designed to filter out obvious
    distortions. They do NOT prove or guarantee full semantic equivalence.
"""

import re
import unicodedata

# Kannada to ASCII digit translation table
KANNADA_DIGITS = str.maketrans("೦೧೨೩೪೫೬೭೮೯", "0123456789")

# Critical Kannada negation words whose omission or insertion reverses intent
PROTECTED_NEGATIONS = ("ಇಲ್ಲ", "ಬೇಡ", "ಅಲ್ಲ")

# Regex pattern for numbers (supporting ASCII and Kannada digits, including decimals)
NUM_PATTERN = re.compile(r"[0-9೦-೯]+(?:\.[0-9೦-೯]+)?")

# Regex pattern for URLs (http, https, www)
URL_PATTERN = re.compile(r"(?:https?://|www\.)[^\s<>\"'()]+", re.IGNORECASE)

# Regex pattern for email addresses
EMAIL_PATTERN = re.compile(
    r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b", re.IGNORECASE
)

# Regex pattern for quoted strings (double, single, and curly quotes) with symmetric boundaries
QUOTE_PATTERN = re.compile(
    r'"([^"\n]+)"|“([^”\n]+)”|(?<!\w)\'([^\'\n]+)\'(?!\w)|‘([^’\n]+)’'
)

# Kannada Unicode text range (letters, vowels, signs - excluding pure digits)
KANNADA_TEXT_PATTERN = re.compile(r"[\u0C85-\u0CE5\u0CF1-\u0CF2]")

# Kannada digits character pattern (U+0CE6 - U+0CEF)
KANNADA_DIGIT_PATTERN = re.compile(r"[\u0CE6-\u0CEF]")

# Contextual keywords indicating discussion of Kannada numerals, script, or orthography
NUMERAL_SCRIPT_TOPIC_PATTERN = re.compile(
    r"(?:ಕನ್ನಡ\s+)?(?:ಅಂಕಿ|ಲಿಪಿ|ಬರವಣಿಗೆ)|(?:ಕನ್ನಡ\s+ಸಂಖ್ಯೆ)",
    re.IGNORECASE,
)


def is_numeral_script_topic(text: str) -> bool:
    """Return True if text conservatively appears to discuss Kannada numerals or script."""
    return bool(NUMERAL_SCRIPT_TOPIC_PATTERN.search(text))



def guard_pass(original: str, candidate: str) -> bool:
    """Evaluate whether candidate conservatively preserves critical meaning elements of original.

    Checks:
    - Input validity and non-emptiness.
    - Kannada script presence if original was in Kannada.
    - Exact preservation of URLs and email addresses.
    - Preservation of all quoted text segments.
    - Strict equivalence of numbers and values (canonicalized).
    - Exact frequency preservation of critical Kannada negation words (ಇಲ್ಲ, ಬೇಡ, ಅಲ್ಲ).

    Args:
        original: The original prompt text.
        candidate: The candidate prompt text to evaluate.

    Returns:
        bool: True if all conservative guard checks pass; False otherwise.
    """
    # 1. Type validation and non-empty check
    if not isinstance(original, str) or not isinstance(candidate, str):
        return False

    orig_clean = unicodedata.normalize("NFC", original.strip())
    cand_clean = unicodedata.normalize("NFC", candidate.strip())

    if not orig_clean or not cand_clean:
        return False

    # Identity candidate passes immediately
    if orig_clean == cand_clean:
        return True

    # 2. Kannada script preservation check:
    # If the original prompt contains Kannada text, the candidate must not drop Kannada
    # (e.g., rejecting unauthorized translation or complete romanization).
    orig_has_kannada = bool(KANNADA_TEXT_PATTERN.search(orig_clean))
    cand_has_kannada = bool(KANNADA_TEXT_PATTERN.search(cand_clean))
    if orig_has_kannada and not cand_has_kannada:
        return False

    # 3. URL preservation check:
    # Any URL in original must be preserved in candidate without alteration or omission.
    orig_urls = sorted(u.rstrip(".,;:?!)'\"") for u in URL_PATTERN.findall(orig_clean))
    cand_urls = sorted(u.rstrip(".,;:?!)'\"") for u in URL_PATTERN.findall(cand_clean))
    if orig_urls != cand_urls:
        return False

    # 4. Email address preservation check:
    # Any email address in original must be present in candidate without alteration.
    orig_emails = sorted(m.lower() for m in EMAIL_PATTERN.findall(orig_clean))
    cand_emails = sorted(m.lower() for m in EMAIL_PATTERN.findall(cand_clean))
    if orig_emails != cand_emails:
        return False

    # 5. Quoted text preservation check:
    # Text in quotes often designates exact names, commands, or titles that cannot be lost.
    orig_quotes = [
        (next((g for g in m.groups() if g), "")).strip()
        for m in QUOTE_PATTERN.finditer(orig_clean)
    ]
    orig_quotes = [q for q in orig_quotes if q]
    cand_collapsed = " ".join(cand_clean.split())
    for quoted in orig_quotes:
        quoted_collapsed = " ".join(quoted.split())
        if quoted_collapsed not in cand_collapsed:
            return False

    # 6. Numeric values preservation check:
    # Extract numbers and canonicalize Kannada digits to ASCII to ensure exact value preservation.
    orig_nums = [
        m.group(0).translate(KANNADA_DIGITS)
        for m in NUM_PATTERN.finditer(orig_clean)
    ]
    cand_nums = [
        m.group(0).translate(KANNADA_DIGITS)
        for m in NUM_PATTERN.finditer(cand_clean)
    ]
    if orig_nums != cand_nums:
        return False

    # 6b. Kannada numerals topic preservation:
    # If the original prompt discusses Kannada numerals or script as a subject,
    # converting native Kannada numerals to ASCII digits alters intent and is rejected.
    if is_numeral_script_topic(orig_clean) and KANNADA_DIGIT_PATTERN.search(orig_clean):
        orig_k_digits = KANNADA_DIGIT_PATTERN.findall(orig_clean)
        cand_k_digits = KANNADA_DIGIT_PATTERN.findall(cand_clean)
        if orig_k_digits != cand_k_digits:
            return False

    # 7. Kannada negation preservation check:
    # Negation words fundamentally invert meaning; their counts must match exactly.
    for neg_word in PROTECTED_NEGATIONS:
        orig_neg_count = len(re.findall(re.escape(neg_word), orig_clean))
        cand_neg_count = len(re.findall(re.escape(neg_word), cand_clean))
        if orig_neg_count != cand_neg_count:
            return False

    return True
