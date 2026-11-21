.PHONY: setup test run-api run-eval

setup:
	python -m pip install -e ./backend/core
	python -m pip install -r ./backend/requirements.txt
	cd frontend && npm install

test:
	cd backend/core && pytest
	cd backend && pytest

run-api:
	cd backend && uvicorn app.main:app --reload

run-eval:
	python evaluation/run_tokenizer_study.py
	python evaluation/run_experiments.py
