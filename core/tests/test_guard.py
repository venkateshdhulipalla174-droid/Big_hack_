"""Tests for guard checks and meaning-preservation heuristics."""

import pytest
from ksmart.guard import guard_pass, is_numeral_script_topic


def test_guard_identity_passes():
    prompt = "ಕನ್ನಡ ನಾಡು ನುಡಿ"
    assert guard_pass(prompt, prompt) is True


def test_guard_invalid_and_empty_inputs():
    assert guard_pass("", "") is False
    assert guard_pass("ಕನ್ನಡ", "") is False
    assert guard_pass("", "ಕನ್ನಡ") is False
    assert guard_pass("   ", "ಕನ್ನಡ") is False
    assert guard_pass("ಕನ್ನಡ", "   ") is False
    assert guard_pass(None, "ಕನ್ನಡ") is False  # type: ignore
    assert guard_pass("ಕನ್ನಡ", None) is False  # type: ignore
    assert guard_pass(123, "123") is False  # type: ignore


def test_guard_kannada_script_preservation():
    # If original has Kannada, candidate must keep Kannada
    orig = "ಕರ್ನಾಟಕದ ರಾಜಧಾನಿ ಬೆಂಗಳೂರು"
    cand_dropped = "Karnataka capital Bangalore"
    assert guard_pass(orig, cand_dropped) is False

    # English-only prompt can have English candidate
    assert guard_pass("Hello world", "Hello world") is True


def test_guard_urls_preserved():
    orig = "ಮಾಹಿತಿಗಾಗಿ https://karnataka.gov.in ನೋಡಿ"
    cand_match = "ಮಾಹಿತಿಗಾಗಿ https://karnataka.gov.in ಓದಿ"
    cand_missing_url = "ಮಾಹಿತಿಗಾಗಿ ನೋಡಿ"
    cand_altered_url = "ಮಾಹಿತಿಗಾಗಿ https://karnataka.gov.in/info ನೋಡಿ"

    assert guard_pass(orig, cand_match) is True
    assert guard_pass(orig, cand_missing_url) is False
    assert guard_pass(orig, cand_altered_url) is False


def test_guard_emails_preserved():
    orig = "ಸಂಪರ್ಕಿಸಿ info@karnataka.gov.in ಇಲ್ಲಿ"
    cand_match = "ದಯವಿಟ್ಟು ಸಂಪರ್ಕಿಸಿ info@karnataka.gov.in ಇಲ್ಲಿ"
    cand_missing = "ದಯವಿಟ್ಟು ಸಂಪರ್ಕಿಸಿ ಇಲ್ಲಿ"
    cand_altered = "ದಯವಿಟ್ಟು ಸಂಪರ್ಕಿಸಿ admin@karnataka.gov.in ಇಲ್ಲಿ"

    assert guard_pass(orig, cand_match) is True
    assert guard_pass(orig, cand_missing) is False
    assert guard_pass(orig, cand_altered) is False


def test_guard_quoted_content_preserved():
    # Double quotes: text inside quotes must remain in candidate
    orig = 'ದಯವಿಟ್ಟು "ಬೆಂಗಳೂರು ನಗರ" ಎಂದು ಬರೆಯಿರಿ'
    cand_preserved = '"ಬೆಂಗಳೂರು ನಗರ" ಎಂದು ಬರೆಯಿರಿ'
    cand_changed_inside = 'ದಯವಿಟ್ಟು "ಮೈಸೂರು ನಗರ" ಎಂದು ಬರೆಯಿರಿ'

    assert guard_pass(orig, cand_preserved) is True
    assert guard_pass(orig, cand_changed_inside) is False

    # Curly quotes
    orig_curly = 'ಪುಸ್ತಕ “ಕನ್ನಡ ಸಾಹಿತ್ಯ” ಓದಿ'
    cand_curly = '“ಕನ್ನಡ ಸಾಹಿತ್ಯ” ಓದಿ'
    cand_curly_bad = '“ಹಿಂದಿ ಸಾಹಿತ್ಯ” ಓದಿ'
    assert guard_pass(orig_curly, cand_curly) is True
    assert guard_pass(orig_curly, cand_curly_bad) is False


def test_guard_numbers_preserved_and_canonicalized():
    # ASCII to ASCII
    orig = "ಬೆಲೆ 100 ರೂಪಾಯಿ ಮತ್ತು 25.5 ಶೇಕಡ"
    cand_same = "ಬೆಲೆ 100 ರೂ ಹಾಗೂ 25.5 ಶೇಕಡ"
    cand_bad_num = "ಬೆಲೆ 200 ರೂ ಹಾಗೂ 25.5 ಶೇಕಡ"
    cand_bad_dec = "ಬೆಲೆ 100 ರೂ ಹಾಗೂ 25.8 ಶೇಕಡ"
    assert guard_pass(orig, cand_same) is True
    assert guard_pass(orig, cand_bad_num) is False
    assert guard_pass(orig, cand_bad_dec) is False

    # Kannada numerals to ASCII in general non-topic context (canonicalized)
    orig_k = "ನನಗೆ ೫ ಪುಸ್ತಕಗಳು ಬೇಕು"
    cand_ascii = "ನನಗೆ 5 ಪುಸ್ತಕಗಳು ಬೇಕು"
    assert guard_pass(orig_k, cand_ascii) is True

    # Number value mismatch
    cand_wrong_ascii = "ನನಗೆ 6 ಪುಸ್ತಕಗಳು ಬೇಕು"
    assert guard_pass(orig_k, cand_wrong_ascii) is False


def test_guard_numeral_topic_detection():
    # Numeral script topic queries
    topic_queries = [
        "ಕನ್ನಡ ಅಂಕಿ ೪ ರ ಇತಿಹಾಸವೇನು?",
        "ಕನ್ನಡ ಲಿಪಿಯಲ್ಲಿ ೧ ರಿಂದ ೧೦ ರವರೆಗಿನ ಅಂಕಿಗಳ ಬರವಣಿಗೆ",
        "ಕನ್ನಡ ಸಂಖ್ಯೆ ಮತ್ತು ಅಂಕಿಗಳ ಪ್ರಾಚೀನತೆ",
        "ಕನ್ನಡ ಲಿಪಿ ವಿವರ",
    ]
    for q in topic_queries:
        assert is_numeral_script_topic(q) is True

    # Standard quantity prompts are NOT numeral script topics
    non_topics = [
        "ನನಗೆ ೫ ಪುಸ್ತಕಗಳು ಬೇಕು",
        "೨೦೨೬ ರ ಚುನಾವಣಾ ಫಲಿತಾಂಶ",
        "ಬೆಂಗಳೂರಿನಲ್ಲಿ 100 ಕಾಲೇಜುಗಳಿವೆ",
    ]
    for q in non_topics:
        assert is_numeral_script_topic(q) is False


def test_guard_rejects_numeral_conversion_in_numeral_topics():
    # When discussing Kannada numerals as a topic, converting digits to ASCII is rejected
    orig = "ಕನ್ನಡ ಅಂಕಿ ೪ ರ ಇತಿಹಾಸವೇನು?"
    cand_converted = "ಕನ್ನಡ ಅಂಕಿ 4 ರ ಇತಿಹಾಸವೇನು?"
    assert guard_pass(orig, cand_converted) is False

    orig2 = "ಕನ್ನಡ ಲಿಪಿಯಲ್ಲಿ ೧ ರಿಂದ ೧೦ ರವರೆಗಿನ ಅಂಕಿಗಳ ಬರವಣಿಗೆ"
    cand2_converted = "ಕನ್ನಡ ಲಿಪಿಯಲ್ಲಿ 1 ರಿಂದ 10 ರವರೆಗಿನ ಅಂಕಿಗಳ ಬರವಣಿಗೆ"
    assert guard_pass(orig2, cand2_converted) is False


def test_guard_negations_preserved():
    # Negations: "ಇಲ್ಲ", "ಬೇಡ", "ಅಲ್ಲ"
    orig = "ನನಗೆ ಊಟ ಬೇಡ ಮತ್ತು ನೀರು ಇಲ್ಲ"

    # Preserved exactly
    cand_ok = "ಊಟ ಬೇಡ ಮತ್ತು ನೀರು ಇಲ್ಲ"
    assert guard_pass(orig, cand_ok) is True

    # Missing negation "ಬೇಡ"
    cand_missing_neg = "ನನಗೆ ಊಟ ಮತ್ತು ನೀರು ಇಲ್ಲ"
    assert guard_pass(orig, cand_missing_neg) is False

    # Inserted extra negation
    cand_extra_neg = "ನನಗೆ ಊಟ ಬೇಡ ಮತ್ತು ನೀರು ಇಲ್ಲ ಅಲ್ಲ"
    assert guard_pass(orig, cand_extra_neg) is False

    # Replaced negation with opposite or omitted
    orig2 = "ಇದು ಸರಿ ಅಲ್ಲ"
    cand2 = "ಇದು ಸರಿ"
    assert guard_pass(orig2, cand2) is False

