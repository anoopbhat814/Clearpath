# ADR 0003: Transparent risk and forecasting models

**Status**: Accepted

## Context
Care teams act on readmission risk and capacity forecasts. Opaque models are hard to question and hard to recalibrate.

## Decision
Use a logistic model with fixed, documented coefficients and per-feature contributions, and an exponential smoothing forecast with a damped trend and weekday profile. Both live in a dedicated FastAPI service that receives numeric features only.

## Consequences
- Every score can be explained in the UI as a ranked list of factors.
- Coefficients are starting points and must be recalibrated on local outcomes before operational reliance.
- The API keeps a labelled local fallback so the product degrades gracefully if the service is down.
