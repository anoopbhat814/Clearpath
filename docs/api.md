# API reference

All endpoints are served under the `/api` prefix. Interactive Swagger documentation is available at `/api/docs` when the API is running; `npm run openapi` writes a route inventory to `openapi.json`.

## Conventions

- **Authentication**: `Authorization: Bearer <access token>`. Access tokens are short-lived (15 minutes by default); use `POST /api/auth/refresh` with the refresh token to rotate.
- **Authorization**: roles are listed per route. `ADMIN` is always permitted. "any" means any authenticated user.
- **Pagination**: list endpoints accept `page` (default 1), `pageSize` (1-100, default 25) and `q` (text search) and return `{ items, page, pageSize, total, totalPages }`.
- **Errors**: `{ statusCode, message, path, requestId, timestamp }`. Validation errors return 400 with a list of messages; unknown or unauthorized resources return 404 or 403.
- **Request ids**: send `X-Request-Id` to correlate calls; otherwise one is generated and echoed in the response header.
- **Audit**: controllers for patient-facing resources are marked `@Audited`, so every read and write is recorded.

## Routes

| Method | Path | Roles | Description |
| ------ | ---- | ----- | ----------- |
| POST | `/api/auth/login` | public | Exchange credentials for an access and refresh token |
| POST | `/api/auth/refresh` | public | Rotate a refresh token |
| POST | `/api/auth/logout` | any | Revoke a refresh token |
| GET | `/api/health` | public | Liveness |
| GET | `/api/health/ready` | public | Readiness (database and Redis) |
| GET | `/api/facilities` | any | List facilities (paginated, filterable) |
| GET | `/api/facilities/:id` | any | Get one |
| POST | `/api/facilities` | ADMIN | Create |
| PATCH | `/api/facilities/:id` | ADMIN | Update |
| DELETE | `/api/facilities/:id` | ADMIN | Deactivate |
| GET | `/api/users` | any | List users (paginated, filterable) |
| GET | `/api/users/:id` | any | Get one |
| POST | `/api/users` | ADMIN | Create |
| PATCH | `/api/users/:id` | ADMIN | Update |
| DELETE | `/api/users/:id` | ADMIN | Deactivate |
| GET | `/api/patients` | any | List patients (paginated, filterable) |
| GET | `/api/patients/:id` | any | Get one |
| POST | `/api/patients` | ADMIN, COORDINATOR, CLINICIAN, SCHEDULER, BED_MANAGER | Create |
| PATCH | `/api/patients/:id` | ADMIN, COORDINATOR, CLINICIAN, SCHEDULER, BED_MANAGER | Update |
| GET | `/api/patients/:id/timeline` | varies | Merged referral, authorization and task timeline |
| GET | `/api/providers` | any | List providers (paginated, filterable) |
| GET | `/api/providers/:id` | any | Get one |
| POST | `/api/providers` | ADMIN, COORDINATOR | Create |
| PATCH | `/api/providers/:id` | ADMIN, COORDINATOR | Update |
| POST | `/api/providers/:id/specialties` | varies | Assign a specialty to a provider |
| GET | `/api/specialties` | any | List specialties (paginated, filterable) |
| GET | `/api/specialties/:id` | any | Get one |
| POST | `/api/specialties` | ADMIN | Create |
| PATCH | `/api/specialties/:id` | ADMIN | Update |
| DELETE | `/api/specialties/:id` | ADMIN | Delete |
| GET | `/api/insurance-plans` | any | List insurance plans (paginated, filterable) |
| GET | `/api/insurance-plans/:id` | any | Get one |
| POST | `/api/insurance-plans` | ADMIN, COORDINATOR | Create |
| PATCH | `/api/insurance-plans/:id` | ADMIN, COORDINATOR | Update |
| DELETE | `/api/insurance-plans/:id` | ADMIN, COORDINATOR | Delete |
| GET | `/api/coverages` | any | List coverages (paginated, filterable) |
| GET | `/api/coverages/:id` | any | Get one |
| POST | `/api/coverages` | ADMIN, COORDINATOR, SCHEDULER | Create |
| PATCH | `/api/coverages/:id` | ADMIN, COORDINATOR, SCHEDULER | Update |
| DELETE | `/api/coverages/:id` | ADMIN, COORDINATOR, SCHEDULER | Delete |
| GET | `/api/coverages/:id/eligibility` | varies | Check whether coverage is active on a date |
| GET | `/api/referrals` | any | List referrals (paginated, filterable) |
| GET | `/api/referrals/:id` | any | Get one |
| POST | `/api/referrals` | ADMIN, COORDINATOR, CLINICIAN, SCHEDULER | Create |
| PATCH | `/api/referrals/:id` | ADMIN, COORDINATOR, CLINICIAN, SCHEDULER | Update |
| GET | `/api/referrals/queue/triage` | varies | Triage queue ordered by priority then waiting time, with SLA flags |
| POST | `/api/referrals/:id/transition` | varies | Move through the state machine (validated server-side) |
| POST | `/api/referrals/:id/notes` | varies | Add a note |
| GET | `/api/pathways` | any | List care pathways (paginated, filterable) |
| GET | `/api/pathways/:id` | any | Get one |
| POST | `/api/pathways` | ADMIN, COORDINATOR | Create |
| PATCH | `/api/pathways/:id` | ADMIN, COORDINATOR | Update |
| POST | `/api/pathways/enrollments/:enrollmentId/advance` | varies | Advance an enrollment to its next step |
| POST | `/api/pathways/:id/steps` | varies | Add a step |
| POST | `/api/pathways/:id/enroll` | varies | Enroll a patient |
| GET | `/api/authorizations` | any | List prior authorizations (paginated, filterable) |
| GET | `/api/authorizations/:id` | any | Get one |
| POST | `/api/authorizations` | ADMIN, COORDINATOR, CLINICIAN | Create |
| PATCH | `/api/authorizations/:id` | ADMIN, COORDINATOR, CLINICIAN | Update |
| GET | `/api/authorizations/expiring` | varies | Approved authorizations expiring within N days |
| POST | `/api/authorizations/:id/transition` | varies | Move through the state machine (validated server-side) |
| GET | `/api/wards` | any | List wards (paginated, filterable) |
| GET | `/api/wards/:id` | any | Get one |
| POST | `/api/wards` | ADMIN, BED_MANAGER | Create |
| PATCH | `/api/wards/:id` | ADMIN, BED_MANAGER | Update |
| DELETE | `/api/wards/:id` | ADMIN, BED_MANAGER | Delete |
| GET | `/api/wards/overview/occupancy` | varies | Occupancy per ward |
| GET | `/api/wards/:id/occupancy` | varies | Occupancy summary for a ward |
| GET | `/api/beds` | any | List beds (paginated, filterable) |
| GET | `/api/beds/:id` | any | Get one |
| POST | `/api/beds` | ADMIN, BED_MANAGER | Create |
| PATCH | `/api/beds/:id` | ADMIN, BED_MANAGER | Update |
| DELETE | `/api/beds/:id` | ADMIN, BED_MANAGER | Delete |
| GET | `/api/beds/available/search` | varies | Available beds filtered by isolation or telemetry |
| POST | `/api/beds/:id/admit` | varies | Atomically admit a patient to a bed |
| POST | `/api/beds/:id/discharge` | varies | Discharge and move the bed to cleaning |
| PATCH | `/api/beds/:id/status` | varies | Change bed or task status |
| GET | `/api/staff` | any | List staff members (paginated, filterable) |
| GET | `/api/staff/:id` | any | Get one |
| POST | `/api/staff` | ADMIN, SCHEDULER | Create |
| PATCH | `/api/staff/:id` | ADMIN, SCHEDULER | Update |
| DELETE | `/api/staff/:id` | ADMIN, SCHEDULER | Delete |
| GET | `/api/shifts` | any | List shifts (paginated, filterable) |
| GET | `/api/shifts/:id` | any | Get one |
| POST | `/api/shifts` | ADMIN, SCHEDULER | Create |
| PATCH | `/api/shifts/:id` | ADMIN, SCHEDULER | Update |
| DELETE | `/api/shifts/:id` | ADMIN, SCHEDULER | Delete |
| POST | `/api/shifts/:id/confirm` | varies | Confirm a shift |
| POST | `/api/shifts/:id/cancel` | varies | Cancel a shift |
| GET | `/api/task-boards` | any | List task boards (paginated, filterable) |
| GET | `/api/task-boards/:id` | any | Get one |
| POST | `/api/task-boards` | ADMIN, COORDINATOR | Create |
| PATCH | `/api/task-boards/:id` | ADMIN, COORDINATOR | Update |
| DELETE | `/api/task-boards/:id` | ADMIN, COORDINATOR | Delete |
| GET | `/api/task-boards/:id/summary` | varies | Status counts and overdue tasks |
| GET | `/api/tasks` | any | List tasks (paginated, filterable) |
| GET | `/api/tasks/:id` | any | Get one |
| POST | `/api/tasks` | ADMIN, COORDINATOR, CLINICIAN, SCHEDULER, BED_MANAGER | Create |
| PATCH | `/api/tasks/:id` | ADMIN, COORDINATOR, CLINICIAN, SCHEDULER, BED_MANAGER | Update |
| DELETE | `/api/tasks/:id` | ADMIN, COORDINATOR, CLINICIAN, SCHEDULER, BED_MANAGER | Delete |
| GET | `/api/tasks/mine/open` | varies | Open tasks assigned to the caller |
| PATCH | `/api/tasks/:id/status` | varies | Change bed or task status |
| POST | `/api/tasks/:id/comments` | varies | Comment on a task |
| GET | `/api/notifications` | any | List the caller's notifications |
| GET | `/api/notifications/unread-count` | any | Unread count |
| POST | `/api/notifications/read-all` | any | Mark all read |
| POST | `/api/notifications/:id/read` | any | Mark one read |
| GET | `/api/audit` | ADMIN, AUDITOR | Search the audit trail |
| GET | `/api/audit/export` | ADMIN, AUDITOR | CSV export (itself audited) |
| GET | `/api/audit/entity/:type/:id` | ADMIN, AUDITOR | History of one entity |
| GET | `/api/analytics/overview` | ADMIN, ANALYST, COORDINATOR, BED_MANAGER | Dashboard headline numbers |
| GET | `/api/analytics/referral-funnel` | ADMIN, ANALYST, COORDINATOR, BED_MANAGER | Time-to-triage and scheduling statistics |
| GET | `/api/analytics/authorization-outcomes` | ADMIN, ANALYST, COORDINATOR, BED_MANAGER | Approval rate and payer turnaround |
| GET | `/api/analytics/wards/:wardId/forecast` | ADMIN, ANALYST, COORDINATOR, BED_MANAGER | Occupancy forecast (analytics service) |
| GET | `/api/analytics/patients/:id/risk` | ADMIN, ANALYST, CLINICIAN, COORDINATOR | Readmission risk score |

## Workflow notes

### Referral lifecycle

`DRAFT -> SUBMITTED -> TRIAGED -> SCHEDULED -> COMPLETED`, with `DECLINED` and `CANCELLED` reachable from the active states and `SCHEDULED -> TRIAGED` allowed for reschedules. Illegal moves return 400 with the allowed targets. Scheduling requires `scheduledAt`.

### Prior authorization lifecycle

`PENDING -> SUBMITTED -> APPROVED | DENIED`, `DENIED -> APPEALED -> APPROVED | DENIED`, `APPROVED -> EXPIRED`. Denials require `denialReason`; approvals require `validUntil`. Every transition writes an `AuthorizationEvent`.

### Bed admission

`POST /api/beds/:id/admit` claims the bed with a conditional update. If two coordinators race for the same bed the second receives 409. Discharging moves the bed to `CLEANING`; a bed marked clean returns to `AVAILABLE` through `PATCH /api/beds/:id/status`.

### Shift validation

Creating a shift runs overlap, maximum-length (16 h), weekly-hour and 10-hour rest-period checks. Failures return 422 with a `violations` array of `{ code, message }`.

## Audit gateway

The Go gateway (default port 8200) is called by the API, not by browsers.

| Method | Path | Description |
| ------ | ---- | ----------- |
| POST | `/v1/events/batch` | Signed batch ingestion (`X-Clearpath-Signature` is the hex HMAC-SHA256 of the raw body) |
| GET | `/v1/chain/verify` | Recompute the hash chain |
| GET | `/healthz` | Liveness |

## Analytics service

| Method | Path | Description |
| ------ | ---- | ----------- |
| POST | `/v1/risk/readmission` | Explainable readmission risk |
| POST | `/v1/capacity/forecast` | Ward occupancy forecast with intervals and surge days |
| GET | `/health` | Liveness |
