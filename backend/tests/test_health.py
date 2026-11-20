import os
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_basic():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "ksmart-backend"
    assert "gemini_configured" in data
    assert "model" in data


def test_health_gemini_unconfigured(monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["gemini_configured"] is False


def test_health_gemini_configured(monkeypatch):
    dummy_key = "dummy-test-key-not-real"
    monkeypatch.setenv("GEMINI_API_KEY", dummy_key)
    monkeypatch.setenv("GEMINI_MODEL", "gemini-2.5-flash")
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["gemini_configured"] is True
    assert data["model"] == "gemini-2.5-flash"
    # Security test: ensure key is never leaked
    assert dummy_key not in response.text
    for value in response.headers.values():
        assert dummy_key not in value


def test_cors_preflight():
    response = client.options(
        "/health",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"
