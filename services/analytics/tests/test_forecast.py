from datetime import date, timedelta

import pytest

from app.models.schemas import CapacityForecastRequest, HistoryPoint
from app.services.forecast import daily_rates, estimate_trend, forecast_capacity, weekday_profile
from app.services.stats import exponential_smooth, sigmoid, stdev


def history(rates, staffed=100, start=date(2026, 9, 1)):
    return [
        HistoryPoint(date=start + timedelta(days=i), occupied=round(r * staffed), staffed=staffed)
        for i, r in enumerate(rates)
    ]


def test_flat_history_forecasts_flat():
    req = CapacityForecastRequest(history=history([0.7] * 28), horizon_days=5)
    result = forecast_capacity(req)
    assert len(result.forecast) == 5
    assert all(abs(p.expected_occupancy_rate - 0.7) < 0.02 for p in result.forecast)
    assert result.surge_days == []


def test_rising_trend_is_continued_but_damped():
    rates = [0.5 + 0.01 * i for i in range(28)]
    result = forecast_capacity(CapacityForecastRequest(history=history(rates), horizon_days=14))
    expected = [p.expected_occupancy_rate for p in result.forecast]
    assert expected[0] > rates[-1] - 0.02
    steps = [b - a for a, b in zip(expected, expected[1:])]
    assert max(steps) < 0.02  # damped, not linear extrapolation


def test_weekday_seasonality_is_picked_up():
    # Mondays run hot, other days average.
    start = date(2026, 9, 7)  # a Monday
    rates = [0.95 if (start + timedelta(days=i)).weekday() == 0 else 0.6 for i in range(28)]
    result = forecast_capacity(CapacityForecastRequest(history=history(rates, start=start), horizon_days=7))
    mondays = [p for p in result.forecast if p.date.weekday() == 0]
    others = [p for p in result.forecast if p.date.weekday() != 0]
    assert mondays and mondays[0].expected_occupancy_rate > max(p.expected_occupancy_rate for p in others)
    assert mondays[0].date in result.surge_days


def test_intervals_widen_with_horizon_and_stay_in_bounds():
    rates = [0.6, 0.72, 0.65, 0.8, 0.7, 0.62, 0.75] * 4
    result = forecast_capacity(CapacityForecastRequest(history=history(rates), horizon_days=10))
    widths = [p.upper - p.lower for p in result.forecast]
    assert widths[-1] >= widths[0]
    assert all(0 <= p.lower <= p.expected_occupancy_rate <= p.upper <= 1 for p in result.forecast)


def test_daily_rates_cap_at_full_occupancy():
    rows = [HistoryPoint(date=date(2026, 9, 1), occupied=120, staffed=100)]
    assert daily_rates(rows)[0][1] == 1.0


def test_weekday_profile_defaults_missing_days_to_average():
    rates = [(date(2026, 9, 7), 0.5), (date(2026, 9, 8), 0.5)]
    profile = weekday_profile(rates)
    assert profile[0] == pytest.approx(1.0)
    assert profile[6] == 1.0


def test_stats_helpers():
    assert estimate_trend([0.1]) == 0.0
    assert stdev([1.0]) == 0.0
    assert exponential_smooth([1, 2, 3], 1.0) == [1, 2, 3]
    assert sigmoid(0) == 0.5
    assert 0 < sigmoid(-50) < 1e-6
    with pytest.raises(ValueError):
        exponential_smooth([1], 0)
