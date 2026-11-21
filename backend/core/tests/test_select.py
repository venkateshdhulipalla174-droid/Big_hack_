"""Tests for candidate selector."""

import pytest
from ksmart.candidates.base import Candidate
from ksmart.select import select


def test_select_lowest_token_count():
    c1 = Candidate(text="ಪಠ್ಯ ೧", strategy="original", token_count=15)
    c2 = Candidate(text="ಪಠ್ಯ ೨", strategy="concise", token_count=10)
    c3 = Candidate(text="ಪಠ್ಯ ೩", strategy="normalized", token_count=12)
    selected = select([c1, c2, c3])
    assert selected == c2
    assert selected.token_count == 10
    assert selected.strategy == "concise"


def test_select_tie_breaking_first_candidate_preserved():
    c1 = Candidate(text="ಮೂಲ ಪಠ್ಯ", strategy="original", token_count=10)
    c2 = Candidate(text="ಮೂಲ ಪಠ್ಯ ನಕಲು", strategy="concise", token_count=10)
    c3 = Candidate(text="ಮೂಲ ಪಠ್ಯ ಸಾಮಾನ್ಯ", strategy="normalized", token_count=10)
    selected = select([c1, c2, c3])
    assert selected is c1
    assert selected.strategy == "original"


def test_select_ignores_none_token_count():
    c1 = Candidate(text="ಪಠ್ಯ ೧", strategy="original", token_count=None)
    c2 = Candidate(text="ಪಠ್ಯ ೨", strategy="concise", token_count=8)
    selected = select([c1, c2])
    assert selected is c2


def test_select_ignores_invalid_and_negative_counts():
    c1 = Candidate(text="ಪಠ್ಯ ೧", strategy="s1", token_count=-5)
    c2 = Candidate(text="ಪಠ್ಯ ೨", strategy="s2", token_count=True)
    c3 = Candidate(text="ಪಠ್ಯ ೩", strategy="s3", token_count="10")  # type: ignore
    c4 = Candidate(text="ಪಠ್ಯ ೪", strategy="s4", token_count=12.5)  # type: ignore
    c5 = Candidate(text="ಪಠ್ಯ ೫", strategy="s5", token_count=7)
    selected = select([c1, c2, c3, c4, c5])
    assert selected is c5
    assert selected.token_count == 7


def test_select_empty_list_raises_value_error():
    with pytest.raises(ValueError, match="At least one candidate is required"):
        select([])


def test_select_no_eligible_candidates_raises_value_error():
    c1 = Candidate(text="ಪಠ್ಯ ೧", strategy="original", token_count=None)
    c2 = Candidate(text="ಪಠ್ಯ ೨", strategy="s2", token_count=-1)
    with pytest.raises(ValueError, match="No eligible candidate found"):
        select([c1, c2])

