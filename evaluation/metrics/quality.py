import csv


def load_audit(path: str) -> list[dict]:
    with open(path, newline="", encoding="utf-8") as file:
        return list(csv.DictReader(file))
