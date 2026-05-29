# Backend API Access After Deploy

The frontend sends browser requests to its same-origin Next.js proxy at `/api/backend`.
That proxy forwards requests server-to-server to the Render backend configured by:

```
NEXT_PUBLIC_API_URL=https://nlc-platform.onrender.com
```

This prevents browser CORS failures for deployed Vercel domains and preview URLs.

Keep the backend CORS allowlist limited to the live Vercel frontend origin:

Go to: https://dashboard.render.com -> nlc-api -> Environment

Update `ALLOWED_ORIGINS`:
```
https://nlc-frontend.vercel.app
```

Then click Save Changes. Render redeploys automatically.
