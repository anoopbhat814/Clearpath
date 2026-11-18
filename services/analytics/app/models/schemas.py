from datetime import date
from typing import Literal

from pydantic import BaseModel, Field, field_validator


class RiskRequest(BaseModel):
    age: int = Field(ge=0, le=120)
    prior_admissions_12m: int = Field(ge=0, le=50)
    open_tasks: int = Field(ge=0, le=500)
    active_referrals: int = Field(default=0, ge=0, le=100)
    denied_authorizations: int = Field(default=0, ge=0, le=100)
    length_of_stay_days: int = Field(default=0, ge=0, le=365)


class RiskFactor(BaseModel):
    name: str
    contribution: float


class RiskResponse(BaseModel):
    score: float = Field(ge=0, le=1)
    band: Literal["low", "moderate", "high"]
    factors: list[RiskFactor]
    model_version: str


class HistoryPoint(BaseModel):
    date: date
    occupied: int = Field(ge=0)
    staffed: int = Field(gt=0)

    @field_validator("staffed")
    @classmethod
    def staffed_reasonable(cls, v: int) -> int:
        if v > 5000:
            raise ValueError("staffed beds per ward cannot exceed 5000")
        return v


class CapacityForecastRequest(BaseModel):
    history: list[HistoryPoint] = Field(min_length=7)
    horizon_days: int = Field(default=7, ge=1, le=28)


class ForecastPoint(BaseModel):
    date: date
    expected_occupancy_rate: float
    lower: float
    upper: float
    expected_occupied: float


class CapacityForecastResponse(BaseModel):
    forecast: list[ForecastPoint]
    surge_days: list[date]
    method: str
