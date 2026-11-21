"""Tests for compact candidate strategy (politeness and pleasantry compaction)."""

from ksmart.candidates.compact import create


def test_politeness_markers_trimmed():
    prompt = "ದಯವಿಟ್ಟು ಬೆಂಗಳೂರಿನ ಇಂದಿನ ಹವಾಮಾನದ ಬಗ್ಗೆ ಸ್ವಲ್ಪ ವಿವರವಾಗಿ ಮಾಹಿತಿ ನೀಡಿ, ತುಂಬಾ ಧನ್ಯವಾದಗಳು!"
    candidate = create(prompt)
    assert candidate.strategy == "compact"
    assert "ದಯವಿಟ್ಟು" not in candidate.text
    assert "ತುಂಬಾ ಧನ್ಯವಾದಗಳು" not in candidate.text
    assert "ಮಾಹಿತಿ ನೀಡಿ" in candidate.text


def test_dayamaadi_and_dhanyavadagalu():
    prompt = "ದಯಮಾಡಿ ಸಹಾಯ ಮಾಡಿ, ಧನ್ಯವಾದಗಳು"
    candidate = create(prompt)
    assert candidate.text == "ಸಹಾಯ ಮಾಡಿ"


def test_clean_prompt_unmodified():
    prompt = "ಕರ್ನಾಟಕದ ರಾಜಧಾನಿ ಬೆಂಗಳೂರು"
    candidate = create(prompt)
    assert candidate.text == prompt
