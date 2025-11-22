import pytest
from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)

def test_healthz():
    response = client.get("/healthz")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_visualize_empty_json():
    response = client.post("/visualize", json={"config": "{}", "format": "json"})
    assert response.status_code == 200
    data = response.json()
    assert data["nodes"] == []
    assert data["edges"] == []
    assert data["stats"]["listeners"] == 0

def test_visualize_invalid_json():
    response = client.post("/visualize", json={"config": "{invalid", "format": "json"})
    assert response.status_code == 400
    assert "Invalid JSON" in response.json()["detail"]

def test_visualize_simple_listener():
    config = """
    {
        "static_resources": {
            "listeners": [
                {
                    "name": "test_listener",
                    "address": {
                        "socket_address": {
                            "address": "0.0.0.0",
                            "port_value": 8080
                        }
                    }
                }
            ]
        }
    }
    """
    response = client.post("/visualize", json={"config": config, "format": "json"})
    assert response.status_code == 200
    data = response.json()
    assert len(data["nodes"]) == 1
    assert data["nodes"][0]["id"] == "listener:test_listener"
