# NLC Frontend — Neum Lex Counsel

Next.js frontend for the NLC RJSC Compliance Intelligence Platform.

**Catalogue:** 85 ILRMF rules (backend engine). Product scoring uses category deductions; module scores are diagnostics only and are not additive.

## Stack
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Axios (API client)
- EB Garamond + DM Sans (NLC brand fonts)

## Pages
| Route | Description |
|---|---|
| `/` | Login |
| `/signup` | Signup |
| `/verify` | 2FA TOTP verification |
| `/dashboard` | Main dashboard — KPIs, deadlines |
| `/dashboard/companies` | Company list + compliance detail |
| `/dashboard/filings` | Filing tracker |
| `/dashboard/rescue` | RED/BLACK rescue pipeline |
| `/dashboard/documents` | AI-drafted documents + approval |
| `/dashboard/rules` | ILRMF **85** rules viewer (from API) |
| `/dashboard/commercial` | Revenue / commercial (staff) |
| `/dashboard/finance` | Billing & collections |
| `/dashboard/billing` | Billing |
| `/dashboard/notifications` | Notifications |
| `/dashboard/rjsc` | RJSC forms reference |
| `/dashboard/profile` | User profile + API status |
| `/dashboard/admin` | Admin |

## API contract notes
- Browser calls use same-origin `/api/backend/*` proxy by default.
- Headline score fields: `final_score`, `risk_band`, `category_deductions`.
- Do not sum diagnostic module scores into the headline score.
- Missing evidence is UNKNOWN — not an automatic violation.
- Low input coverage + high score means incomplete data, not full compliance.

## Deploy to Vercel

### Step 1 — Deploy NLC Backend first
See `nlc_platform` repo. Production Render service uses **manual deploy** (`autoDeploy: false`).
Typical backend URL: `https://nlc-platform.onrender.com`

### Step 2 — Import this repo on Vercel
Framework: Next.js. Set:
- `NEXT_PUBLIC_API_URL` = backend origin (or rely on server-side `NLC_BACKEND_URL` / `API_URL` for the proxy)
- Do not point `NEXT_PUBLIC_API_BASE_PATH` at Render; leave unset or `/api/backend`

### Step 3 — Backend CORS
```
ALLOWED_ORIGINS=https://your-nlc-frontend.vercel.app
```

## Development mocks
Mock/demo fallbacks are for local development only. Production builds must use live API data; do not treat synthetic compliance scores as real evaluations.
