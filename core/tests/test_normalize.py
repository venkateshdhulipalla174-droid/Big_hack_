from ksmart.normalize import normalize_text


def test_normalize_text_returns_nfc():
    assert normalize_text("ಕನ್ನಡ") == "ಕನ್ನಡ"
