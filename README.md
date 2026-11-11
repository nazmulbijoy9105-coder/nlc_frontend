# NLC Frontend — Neum Lex Counsel

Next.js 16 / React 19 frontend for the NLC RJSC Compliance Intelligence Platform.

**Catalogue:** 85 ILRMF rule identities. Product scoring uses backend-authoritative category deductions; module scores and diagnostic groupings are non-additive.

## Stack
- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Axios (API client)
- EB Garamond + DM Sans (NLC brand fonts)

## Routes present on `main`

This is a source-tree route inventory, not a guarantee that every action is enabled for every role.

| Route | Description |
|---|---|
| `/` | Login |
| `/verify` | Two-factor verification |
| `/signup` | Signup entry point; backend policy controls availability |
| `/admin/login` | Admin login |
| `/admin` | Admin landing page |
| `/dashboard` | Main dashboard |
| `/dashboard/admin` | Dashboard administration |
| `/dashboard/billing` | Billing and subscription workspace |
| `/dashboard/commercial` | Commercial pipeline and engagements |
| `/dashboard/companies` | Company portfolio |
| `/dashboard/companies/new` | Create company |
| `/dashboard/companies/[id]` | Company overview |
| `/dashboard/companies/[id]/edit` | Edit company |
| `/dashboard/companies/[id]/articles` | Articles verification |
| `/dashboard/companies/[id]/calendar` | Company compliance calendar |
| `/dashboard/companies/[id]/forms` | Company RJSC forms |
| `/dashboard/documents` | Documents and approval workflow |
| `/dashboard/filings` | Filing tracker |
| `/dashboard/finance` | Finance workspace |
| `/dashboard/notifications` | Notifications |
| `/dashboard/profile` | User profile and API status |
| `/dashboard/rescue` | Rescue workflow |
| `/dashboard/rjsc` | RJSC reference and forms |
| `/dashboard/rules` | 85-rule ILRMF catalogue |

A route's presence does not establish backend capability or authorization. Backend routes and permission checks remain authoritative. Unavailable capabilities must show an explicit unavailable/error state, not fabricated production records.

## API configuration

Browser API requests use the same-origin `/api/backend` proxy by default.

- `NEXT_PUBLIC_API_URL`: optional backend origin; also used by the proxy as a compatibility upstream.
- `NEXT_PUBLIC_BACKEND_URL` and `NEXT_PUBLIC_API_BASE_URL`: legacy compatibility aliases.
- `NEXT_PUBLIC_API_BASE_PATH`: optional browser API base path; leave unset for the default `/api/backend`.
- Server-side proxy upstream precedence: `NLC_BACKEND_URL`, `API_URL`, then the supported public aliases, with `https://nlc-platform.onrender.com` as the source default.

Do not set `NEXT_PUBLIC_API_BASE_PATH` to a Render origin. Keep server-only credentials out of all `NEXT_PUBLIC_*` variables. For direct-origin browser requests, configure backend CORS for the exact frontend origin; the default same-origin proxy avoids browser-to-Render CORS.

## Score and data presentation

- The 85-rule catalogue is a product inventory; it is not proof that every rule has independent counsel verification.
- `category_deductions` is the authoritative additive input for the headline score.
- Module/category diagnostics are descriptive only. Never add them again to category deductions.
- Preserve the API's evaluation status and risk band. A null score or `NOT_EVALUATED` is not GREEN and must not be replaced by a sample score.
- The score is a product risk indicator only — not legal advice, a legal conclusion, or a certification.

## Deploy to Vercel

1. Connect this repository to Vercel using the Next.js framework preset.
2. Set the API configuration above for the intended backend environment.
3. Deploy and verify authenticated API requests against that environment.
4. Confirm the backend deployment allows the exact frontend origin when direct-origin mode is used.

The backend repository is `nlc_platform`. Its Render service uses controlled deployment (`autoDeploy: false`); frontend deployment does not imply a backend deployment.

## Mock data policy

Mock/sample records are for local development and explicit component tests only. Production runtime paths must not silently substitute sample companies, scores, filings, rescue cases, or documents when an API request fails. Show an explicit loading, empty, unavailable, or error state instead.
