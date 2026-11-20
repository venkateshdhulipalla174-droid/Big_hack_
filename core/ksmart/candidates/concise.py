from .base import Candidate


def create(text: str) -> Candidate:
    return Candidate(text=" ".join(text.split()), strategy="concise")
