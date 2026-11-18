# Clearpath analytics service

A small FastAPI service used by the API for two jobs:

- `POST /v1/risk/readmission` returns an explainable readmission risk score from a handful of operational features.
- `POST /v1/capacity/forecast` forecasts ward occupancy from recent daily history using damped trend plus a day-of-week profile.

The models are intentionally transparent (a logistic model with documented coefficients and exponential smoothing) so that every number can be explained to the people who act on it. Scores are decision support, not diagnoses.

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8100
pytest
```
