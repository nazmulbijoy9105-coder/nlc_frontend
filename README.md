# NLC Frontend — Neum Lex Counsel

Next.js 15 frontend for the NLC RJSC Compliance Intelligence Platform.

## Stack
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Axios (API client)
- EB Garamond + DM Sans (NLC brand fonts)

## Pages
| Route | Description |
|---|---|
| `/` | Login |
| `/verify` | 2FA TOTP verification |
| `/dashboard` | Main dashboard — stats, companies, deadlines |
| `/dashboard/companies` | Company list + compliance detail |
| `/dashboard/filings` | Filing tracker |
| `/dashboard/rescue` | RED/BLACK rescue pipeline |
| `/dashboard/documents` | AI-drafted documents + approval |
| `/dashboard/rules` | ILRMF 32 rules viewer |
| `/dashboard/profile` | User profile + API status |

## Deploy to Vercel

### Step 1 — Deploy NLC Backend first
See `nlc_platform` repo. Deploy to Render using the `api/index.py` entry point.
Note your backend URL: `https://nlc-backend.orender.com`

### Step 2 — Push this repo to GitHub
```bash
git init
git add .
git commit -m "init: NLC frontend"
git remote add origin https://github.com/YOUR_USERNAME/nlc_frontend.git
git push -u origin main
```

### Step 3 — Connect to Vercel
1. Go to https://vercel.com/new
2. Import `nlc_frontend` repo
3. Framework: Next.js (auto-detected)
4. Add environment variable:
   - `NEXT_PUBLIC_API_URL` = your backend Render URL
   - Existing Vercel names `NEXT_PUBLIC_BACKEND_URL` and `NEXT_PUBLIC_API_BASE_URL` are also supported.
   - Browser API calls use the same-origin `/api/backend` proxy by default.

Do not point `NEXT_PUBLIC_API_BASE_PATH` at Render. Leave it unset, or set it to
`/api/backend`.

### Step 4 — Set ALLOWED_ORIGINS on backend
The frontend is served from Vercel and sends browser requests to its same-origin
`/api/backend` proxy. In your `nlc_platform` Render deployment, allow only the
live Vercel frontend origin:
```
ALLOWED_ORIGINS=https://your-nlc-frontend.vercel.app
```

## Mock Data
All pages include mock data fallbacks — the UI is fully functional
even before the backend is connected. Live data loads automatically
once `NEXT_PUBLIC_API_URL` points to a running backend.
