from fastapi import Depends, FastAPI, HTTPException

from app import __version__
from app.config import Settings, get_settings
from app.models.schemas import (
    CapacityForecastRequest,
    CapacityForecastResponse,
    RiskRequest,
    RiskResponse,
)
from app.services.forecast import forecast_capacity
from app.services.risk import MODEL_VERSION, score_readmission

app = FastAPI(title="Clearpath analytics", version=__version__)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "version": __version__, "risk_model": MODEL_VERSION}


@app.post("/v1/risk/readmission", response_model=RiskResponse)
def readmission(req: RiskRequest, settings: Settings = Depends(get_settings)) -> RiskResponse:
    return score_readmission(req, settings)


@app.post("/v1/capacity/forecast", response_model=CapacityForecastResponse)
def capacity(
    req: CapacityForecastRequest, settings: Settings = Depends(get_settings)
) -> CapacityForecastResponse:
    if len(req.history) > settings.max_history_days:
        raise HTTPException(status_code=422, detail=f"history exceeds {settings.max_history_days} days")
    if req.horizon_days > settings.max_horizon_days:
        raise HTTPException(status_code=422, detail=f"horizon exceeds {settings.max_horizon_days} days")
    dates = [h.date for h in req.history]
    if len(set(dates)) != len(dates):
        raise HTTPException(status_code=422, detail="history contains duplicate dates")
    return forecast_capacity(req)
