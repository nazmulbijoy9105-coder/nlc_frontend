const configuredBase =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL;

const configuredProxy = process.env.NEXT_PUBLIC_API_BASE_PATH;

// Production authentication must remain same-origin so the backend's
// HttpOnly SameSite=Strict refresh cookie can be set and returned through
// the fixed Next.js gateway. Direct backend URLs are development-only.
export const API_BASE = (
  process.env.NODE_ENV === "production"
    ? "/api/backend"
    : configuredProxy || configuredBase || "/api/backend"
).replace(/\/+$/, "");
