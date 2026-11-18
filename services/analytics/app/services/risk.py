"""Transparent readmission risk model.

A logistic regression with fixed, reviewable coefficients. Every feature is first scaled to 0..1 so
that the per-feature contribution (coefficient * scaled value) can be shown to users as an
explanation. The coefficients are operational starting points that deployments should recalibrate
on their own outcomes data before relying on the score.
"""

from __future__ import annotations

from app.config import Settings
from app.models.schemas import RiskFactor, RiskRequest, RiskResponse
from app.services.stats import clamp, sigmoid

MODEL_VERSION = "logit-2026.10"
INTERCEPT = -2.6

# feature -> (coefficient, scale ceiling)
COEFFICIENTS: dict[str, tuple[float, float]] = {
    "age": (1.1, 100.0),
    "prior_admissions_12m": (2.4, 5.0),
    "open_tasks": (0.7, 12.0),
    "active_referrals": (0.5, 5.0),
    "denied_authorizations": (0.9, 4.0),
    "length_of_stay_days": (1.3, 14.0),
}


def scale(feature: str, value: float) -> float:
    _, ceiling = COEFFICIENTS[feature]
    return clamp(value / ceiling)


def band_for(score: float, settings: Settings) -> str:
    if score >= settings.high_risk_threshold:
        return "high"
    if score >= settings.moderate_risk_threshold:
        return "moderate"
    return "low"


def score_readmission(req: RiskRequest, settings: Settings) -> RiskResponse:
    values = req.model_dump()
    contributions = {
        name: COEFFICIENTS[name][0] * scale(name, float(values[name])) for name in COEFFICIENTS
    }
    logit = INTERCEPT + sum(contributions.values())
    probability = sigmoid(logit)

    total = sum(contributions.values()) or 1.0
    factors = [
        RiskFactor(name=name, contribution=round(c / total, 4))
        for name, c in sorted(contributions.items(), key=lambda kv: kv[1], reverse=True)
    ]
    return RiskResponse(
        score=round(probability, 4),
        band=band_for(probability, settings),  # type: ignore[arg-type]
        factors=factors,
        model_version=MODEL_VERSION,
    )
