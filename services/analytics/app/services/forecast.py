"""Ward occupancy forecasting.

Method: day-of-week profile (multiplicative seasonality over the deseasonalised level) combined
with a damped linear trend estimated from exponentially smoothed daily occupancy rates. Prediction
intervals widen with the horizon using the residual standard deviation.
"""

from __future__ import annotations

from collections import defaultdict
from datetime import date, timedelta

from app.models.schemas import (
    CapacityForecastRequest,
    CapacityForecastResponse,
    ForecastPoint,
    HistoryPoint,
)
from app.services.stats import clamp, exponential_smooth, mean, stdev

METHOD = "damped-trend+weekday-profile"
SURGE_THRESHOLD = 0.9
TREND_DAMPING = 0.85


def daily_rates(history: list[HistoryPoint]) -> list[tuple[date, float]]:
    ordered = sorted(history, key=lambda h: h.date)
    return [(h.date, min(h.occupied / h.staffed, 1.0)) for h in ordered]


def weekday_profile(rates: list[tuple[date, float]]) -> dict[int, float]:
    """Ratio of each weekday's mean rate to the overall mean (1.0 means average)."""
    overall = mean([r for _, r in rates]) or 1e-9
    buckets: dict[int, list[float]] = defaultdict(list)
    for d, r in rates:
        buckets[d.weekday()].append(r)
    return {wd: (mean(buckets[wd]) / overall if buckets.get(wd) else 1.0) for wd in range(7)}


def estimate_trend(smoothed: list[float], window: int = 7) -> float:
    recent = smoothed[-window:]
    if len(recent) < 2:
        return 0.0
    return (recent[-1] - recent[0]) / (len(recent) - 1)


def forecast_capacity(req: CapacityForecastRequest) -> CapacityForecastResponse:
    rates = daily_rates(req.history)
    profile = weekday_profile(rates)
    values = [r for _, r in rates]

    deseason = [r / (profile[d.weekday()] or 1.0) for d, r in rates]
    smoothed = exponential_smooth(deseason, alpha=0.4)
    level = smoothed[-1]
    trend = estimate_trend(smoothed)

    fitted = [s * profile[d.weekday()] for (d, _), s in zip(rates, smoothed)]
    residual_sd = stdev([v - f for v, f in zip(values, fitted)])

    last_date = rates[-1][0]
    staffed = sorted(req.history, key=lambda h: h.date)[-1].staffed

    points: list[ForecastPoint] = []
    surge_days: list[date] = []
    cumulative_trend = 0.0
    for step in range(1, req.horizon_days + 1):
        cumulative_trend += trend * (TREND_DAMPING**step)
        day = last_date + timedelta(days=step)
        expected = clamp((level + cumulative_trend) * profile[day.weekday()])
        spread = 1.96 * residual_sd * (1 + 0.1 * step)
        point = ForecastPoint(
            date=day,
            expected_occupancy_rate=round(expected, 4),
            lower=round(clamp(expected - spread), 4),
            upper=round(clamp(expected + spread), 4),
            expected_occupied=round(expected * staffed, 1),
        )
        points.append(point)
        if expected >= SURGE_THRESHOLD:
            surge_days.append(day)

    return CapacityForecastResponse(forecast=points, surge_days=surge_days, method=METHOD)
