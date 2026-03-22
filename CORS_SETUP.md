# CORS Setup — Required After Deploy

After your Vercel frontend deploys, copy your Vercel URL (e.g. https://nlc-frontend.vercel.app)
and add it to your Render backend environment variables:

Go to: https://dashboard.render.com → nlc-api → Environment

Update ALLOWED_ORIGINS:
https://nlc-frontend.vercel.app,http://localhost:3000

Then click Save Changes — Render redeploys automatically.
Your frontend will then be able to call your backend with no CORS errors.
