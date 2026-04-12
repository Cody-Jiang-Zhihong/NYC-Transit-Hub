from pathlib import Path

import pytest

from app import create_app


@pytest.fixture()
def client(tmp_path: Path):
    app = create_app(
        {
            "TESTING": True,
            "DATABASE_PATH": str(tmp_path / "test.db"),
            "USE_SAMPLE_DATA": True,
        }
    )
    return app.test_client()


def test_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.get_json() == {"ok": True}


def test_dashboard_uses_sample_data(client):
    response = client.get("/api/dashboard")
    payload = response.get_json()
    assert response.status_code == 200
    assert payload["meta"]["live"] is False
    assert len(payload["services"]) >= 1
    assert "map_data" in payload


def test_favorites_round_trip(client):
    create_response = client.post(
        "/api/favorites",
        headers={"X-User-Id": "tester"},
        json={
            "route_id": "A",
            "station_name": "34 St-Penn Station",
            "label": "Morning commute",
        },
    )
    assert create_response.status_code == 201

    list_response = client.get("/api/favorites", headers={"X-User-Id": "tester"})
    favorites = list_response.get_json()["favorites"]
    assert len(favorites) == 1
    assert favorites[0]["route_id"] == "A"
