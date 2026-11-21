"""Tokenizer registry."""


def get_tokenizer(name: str):
    raise NotImplementedError(f"Tokenizer {name!r} is not implemented")
