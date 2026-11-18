# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [1.4.0] - 2026-10-30

### Added
- Capacity forecasting endpoint in the analytics service.
- Shift swap validation that checks rest-period rules.
- Audit gateway batch ingestion with HMAC signatures.

### Changed
- Referral triage now orders by clinical priority, then waiting time.

## [1.3.0] - 2026-08-12

### Added
- Care pathway enrollments with per-step due dates.
- Prior authorization expiry reminders in the worker.

### Fixed
- Bed assignment race when two transfers targeted the same bed.

## [1.2.0] - 2026-05-20

### Added
- Clinical task boards with SLA indicators.
- Provider directory search by specialty and network status.

## [1.1.0] - 2026-03-04

### Added
- Readmission risk scoring service (FastAPI).
- Notification center in the web app.

## [1.0.0] - 2026-01-15

### Added
- Initial release: referrals, patients, providers, authorizations, bed management and scheduling.
