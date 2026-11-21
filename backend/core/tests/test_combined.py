"""Tests for combined candidate strategy (numerals and whitespace optimization)."""

import pytest
from ksmart.candidates.combined import create


def test_combined_numeral_and_whitespace():
    prompt = "ನನಗೆ   ೫   ಪುಸ್ತಕಗಳು"
    candidate = create(prompt)
    assert candidate.text == "ನನಗೆ 5 ಪುಸ್ತಕಗಳು"
    assert candidate.strategy == "combined"
    assert candidate.token_count is None


def test_combined_tabs_and_multiple_spaces():
    prompt = "ಪದ ೧\t\t೨ \t ಪದ"
    candidate = create(prompt)
    assert candidate.text == "ಪದ 1 2 ಪದ"


def test_combined_newlines_crlf_and_indentation_preserved():
    prompt = "    ಸಾಲು ೧   ಜಾಗ\r\n\r\n    ಸಾಲು ೨\t\t೨\r\nಸಾಲು ೩"
    candidate = create(prompt)
    expected = "    ಸಾಲು 1 ಜಾಗ\r\n\r\n    ಸಾಲು 2 2\r\nಸಾಲು 3"
    assert candidate.text == expected


def test_combined_prompt_without_kannada_digits():
    prompt = "ದಯವಿಟ್ಟು    ಸಹಾಯ    ಮಾಡಿ"
    candidate = create(prompt)
    assert candidate.text == "ದಯವಿಟ್ಟು ಸಹಾಯ ಮಾಡಿ"


def test_combined_prompt_without_extra_whitespace():
    prompt = "ನನಗೆ ೫ ಪುಸ್ತಕಗಳು"
    candidate = create(prompt)
    assert candidate.text == "ನನಗೆ 5 ಪುಸ್ತಕಗಳು"

