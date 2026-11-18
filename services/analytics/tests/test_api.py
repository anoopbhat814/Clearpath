from datetime import date, timedelta

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def payload(days=14, horizon=7):
    start = date(2026, 9, 1)
    return {
        "history": [
            {"date": (start + timedelta(days=i)).isoformat(), "occupied": 60 + (i % 5), "staffed": 80}
            for i in range(days)
        ],
        "horizon_days": horizon,
    }


def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_risk_endpoint_returns_explained_score():
    res = client.post(
        "/v1/risk/readmission",
        json={"age": 74, "prior_admissions_12m": 2, "open_tasks": 3, "length_of_stay_days": 6},
    )
    assert res.status_code == 200
    body = res.json()
    assert 0 <= body["score"] <= 1
    assert body["band"] in {"low", "moderate", "high"}
    assert len(body["factors"]) == 6


def test_risk_endpoint_validates_ranges():
    res = client.post("/v1/risk/readmission", json={"age": 200, "prior_admissions_12m": 0, "open_tasks": 0})
    assert res.status_code == 422


def test_forecast_endpoint():
    res = client.post("/v1/capacity/forecast", json=payload())
    assert res.status_code == 200
    body = res.json()
    assert len(body["forecast"]) == 7
    assert body["method"] == "damped-trend+weekday-profile"


def test_forecast_rejects_short_history():
    res = client.post("/v1/capacity/forecast", json=payload(days=3))
    assert res.status_code == 422


def test_forecast_rejects_duplicate_dates():
    body = payload()
    body["history"][1]["date"] = body["history"][0]["date"]
    res = client.post("/v1/capacity/forecast", json=body)
    assert res.status_code == 422
    assert "duplicate" in res.json()["detail"]
