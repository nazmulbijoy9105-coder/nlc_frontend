# Frontend production-readiness contract audit

## Verified backend router availability

The frontend was compared with the backend main router registration in app/main.py at commit c51d730dad79e4382bc92709a3d7164ecb8d7af2.

Registered API groups include authentication, companies, filings, rescue, documents, commercial, RJSC forms, compliance calendar, rules, admin, notifications and webhooks.

## Backend dependencies not registered

The backend does not currently register a finance router or subscription/billing router. The frontend former /api/v1/finance/* and /api/v1/subscriptions/* calls therefore cannot be considered working contracts against this backend revision.

The frontend Billing and Finance pages have been changed to explicit unavailable states, and their navigation entries have been removed. No fake success, empty invoices or payment actions are presented. Re-enable these modules only after the backend routes, schemas, authorization, tenant scoping and integration tests are merged and verified.

## Legal / document safeguards

- Document generation, approval, release and filing actions are not exposed as working controls until the workflow and permission contract is verified.
- Public signup is shown as Client View Only because the backend hardcodes that role for public registrations.
- RJSC receipt references are described as recorded evidence, not proof that RJSC accepted a filing.
- Statutory scores and bands remain marked not evaluated while the backend legal release gate withholds them.

## Verification status

This audit is source-level contract verification. It does not replace live integration tests against a deployed backend, browser tests, Vercel preview checks or production smoke tests.

## Additional backend contract blockers

- CompanyCreateRequest currently supplies boolean defaults for multiple tax/evidence facts (mostly false, but TDS-deposited and minimum-tax-paid default true). The frontend cannot safely represent UNKNOWN while this request schema forces concrete booleans.
- CompanyUpdateRequest accepts nullable evidence fields, but the current update handler excludes null values from its update payload. The advertised null-to-UNKNOWN behavior is therefore not consistently expressible for those fields.
- The dashboard KPI service counts companies by assigned_staff_id, while the company list endpoint returns the broader staff portfolio for staff roles. The frontend now compares the KPI total with the accessible company list and withholds inconsistent portfolio metrics.
- The backend source tree has no Articles upload/verification route. The Articles screen remains read-only and explicitly states that upload is disabled.
