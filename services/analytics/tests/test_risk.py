from app.config import Settings
from app.models.schemas import RiskRequest
from app.services.risk import COEFFICIENTS, band_for, scale, score_readmission

SETTINGS = Settings()


def make(**overrides) -> RiskRequest:
    base = dict(
        age=50,
        prior_admissions_12m=0,
        open_tasks=0,
        active_referrals=0,
        denied_authorizations=0,
        length_of_stay_days=0,
    )
    base.update(overrides)
    return RiskRequest(**base)


def test_low_risk_patient_scores_low():
    result = score_readmission(make(age=30), SETTINGS)
    assert result.band == "low"
    assert result.score < 0.2


def test_high_utilization_scores_high():
    result = score_readmission(
        make(age=82, prior_admissions_12m=5, open_tasks=10, denied_authorizations=3, length_of_stay_days=12),
        SETTINGS,
    )
    assert result.band == "high"
    assert result.score > 0.8


def test_score_increases_with_prior_admissions():
    scores = [score_readmission(make(prior_admissions_12m=n), SETTINGS).score for n in range(0, 6)]
    assert scores == sorted(scores)


def test_factor_contributions_sum_to_one_and_are_sorted():
    result = score_readmission(make(age=70, prior_admissions_12m=3, open_tasks=4), SETTINGS)
    total = sum(f.contribution for f in result.factors)
    assert abs(total - 1.0) < 0.01
    contributions = [f.contribution for f in result.factors]
    assert contributions == sorted(contributions, reverse=True)
    assert result.factors[0].name == "prior_admissions_12m"


def test_scaling_clamps_to_unit_interval():
    assert scale("age", 250) == 1.0
    assert scale("age", 0) == 0.0
    assert set(COEFFICIENTS) >= {"age", "prior_admissions_12m"}


def test_band_thresholds():
    assert band_for(0.1, SETTINGS) == "low"
    assert band_for(0.4, SETTINGS) == "moderate"
    assert band_for(0.7, SETTINGS) == "high"
