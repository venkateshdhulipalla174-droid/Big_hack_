"""Tests for concise candidate strategy (whitespace optimization)."""

import pytest
from ksmart.candidates.base import Candidate
from ksmart.candidates.concise import create


def test_repeated_spaces_collapsed():
    prompt = "ದಯವಿಟ್ಟು    ಸಹಾಯ    ಮಾಡಿ"
    candidate = create(prompt)
    assert candidate.text == "ದಯವಿಟ್ಟು ಸಹಾಯ ಮಾಡಿ"
    assert candidate.strategy == "concise"
    assert candidate.token_count is None


def test_tabs_collapsed():
    prompt = "ಕನ್ನಡ\t\tಸಾಹಿತ್ಯ\tಪರಿಷತ್ತು"
    candidate = create(prompt)
    assert candidate.text == "ಕನ್ನಡ ಸಾಹಿತ್ಯ ಪರಿಷತ್ತು"


def test_mixed_spaces_and_tabs():
    prompt = "ಪದ ೧ \t  ಪದ ೨ \t ಪದ ೩"
    candidate = create(prompt)
    assert candidate.text == "ಪದ ೧ ಪದ ೨ ಪದ ೩"


def test_blank_lines_and_paragraphs_preserved():
    prompt = "ಮೊದಲನೆಯ ಪ್ಯಾರಾಗ್ರಾಫ್    ವಿಷಯ.\n\nಎರಡನೆಯ ಪ್ಯಾರಾಗ್ರಾಫ್    ವಿವರ."
    candidate = create(prompt)
    expected = "ಮೊದಲನೆಯ ಪ್ಯಾರಾಗ್ರಾಫ್ ವಿಷಯ.\n\nಎರಡನೆಯ ಪ್ಯಾರಾಗ್ರಾಫ್ ವಿವರ."
    assert candidate.text == expected


def test_numbered_lists_preserved():
    prompt = "1. ಮೊದಲ ಅಂಶ   ಹೆಚ್ಚು   ಸ್ಥಳ\n2. ಎರಡನೇ ಅಂಶ\t\tಟ್ಯಾಬ್\n3. ಮೂರನೇ ಅಂಶ"
    candidate = create(prompt)
    expected = "1. ಮೊದಲ ಅಂಶ ಹೆಚ್ಚು ಸ್ಥಳ\n2. ಎರಡನೇ ಅಂಶ ಟ್ಯಾಬ್\n3. ಮೂರನೇ ಅಂಶ"
    assert candidate.text == expected


def test_crlf_line_endings_preserved():
    prompt = "ಸಾಲು ೧   ಜಾಗ\r\n\r\nಸಾಲು ೨\t\tಟ್ಯಾಬ್\r\nಸಾಲು ೩"
    candidate = create(prompt)
    expected = "ಸಾಲು ೧ ಜಾಗ\r\n\r\nಸಾಲು ೨ ಟ್ಯಾಬ್\r\nಸಾಲು ೩"
    assert candidate.text == expected


def test_indentation_preserved():
    prompt = "    ಇಂಡೆಂಟ್ ಸಾಲು   ಹೆಚ್ಚು   ಜಾಗ"
    candidate = create(prompt)
    assert candidate.text == "    ಇಂಡೆಂಟ್ ಸಾಲು ಹೆಚ್ಚು ಜಾಗ"


def test_clean_prompt_unmodified():
    prompt = "ಕನ್ನಡ ಭಾಷೆ ಮತ್ತು ಸಾಹಿತ್ಯ"
    candidate = create(prompt)
    assert candidate.text == prompt

