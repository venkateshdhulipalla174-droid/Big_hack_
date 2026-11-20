from .base import Candidate


KANNADA_DIGITS = str.maketrans("೦೧೨೩೪೫೬೭೮೯", "0123456789")


def create(text: str) -> Candidate:
    return Candidate(text=text.translate(KANNADA_DIGITS), strategy="numerals")
