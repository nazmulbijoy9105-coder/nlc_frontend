const configuredBase =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL;

const configuredProxy = process.env.NEXT_PUBLIC_API_BASE_PATH;

export const API_BASE = (configuredBase || configuredProxy || "/api/backend").replace(/\/+$/, "");
