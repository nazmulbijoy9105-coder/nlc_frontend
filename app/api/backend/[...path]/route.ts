import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DEFAULT_BACKEND_URL = "https://nlc-platform.onrender.com";
const MAX_BODY_BYTES = 25 * 1024 * 1024;
const HOP_BY_HOP_HEADERS = [
  "connection", "content-encoding", "content-length", "host",
  "keep-alive", "origin", "proxy-authenticate", "proxy-authorization",
  "te", "trailer", "transfer-encoding", "upgrade",
];
const PUBLIC_AUTH_PATHS = new Set([
  "api/v1/auth/login",
  "api/v1/auth/signup",
  "api/v1/auth/refresh",
  "api/v1/auth/verify-2fa",
]);

type RouteContext = { params: Promise<{ path?: string[] }> | { path?: string[] } };

function backendBaseUrl(): string {
  const raw = process.env.NLC_BACKEND_URL || process.env.API_URL || DEFAULT_BACKEND_URL;
  const parsed = new URL(raw);
  if (parsed.protocol !== "https:" && process.env.NODE_ENV === "production") {
    throw new Error("Backend URL must use HTTPS in production");
  }
  return parsed.toString().replace(/\\/+$/, "");
}

function buildBackendUrl(request: NextRequest, pathSegments: string[] = []): string {
  const path = pathSegments.map((part) => encodeURIComponent(part)).join("/");
  const url = new URL(path, backendBaseUrl() + "/");
  url.search = request.nextUrl.search;
  return url.toString();
}

function forwardedRequestHeaders(request: NextRequest, path: string): Headers {
  const headers = new Headers(request.headers);
  for (const header of HOP_BY_HOP_HEADERS) headers.delete(header);
  // Only the backend-owned refresh credential may cross this fixed proxy.
  // Never forward unrelated browser cookies to the API service.
  const refreshCookie = request.cookies.get("nlc_refresh_token")?.value;
  headers.delete("cookie");
  if (refreshCookie && (path === "api/v1/auth/refresh" || path === "api/v1/auth/logout")) {
    headers.set("cookie", `nlc_refresh_token=${refreshCookie}`);
  }
  headers.set("x-forwarded-host", request.nextUrl.host);
  headers.set("x-forwarded-proto", request.nextUrl.protocol.replace(":", ""));
  return headers;
}

function forwardedResponseHeaders(response: Response): Headers {
  const headers = new Headers(response.headers);
  for (const header of HOP_BY_HOP_HEADERS) headers.delete(header);
  // The API cookie is scoped to /api/v1/auth on the backend. Rewrite its path
  // to the corresponding same-origin Next proxy path before returning it to
  // the browser, otherwise the browser would not send it back to /api/backend.
  const cookies = typeof headers.getSetCookie === "function" ? headers.getSetCookie() : [];
  if (cookies.length) {
    headers.delete("set-cookie");
    for (const cookie of cookies) {
      headers.append(
        "set-cookie",
        cookie.replace(/;\\s*path=\\/api\\/v1\\/auth(?=;|$)/i, "; Path=/api/backend/api/v1/auth"),
      );
    }
  }
  headers.set("cache-control", "no-store");
  return headers;
}

async function proxy(request: NextRequest, context: RouteContext): Promise<Response> {
  const params = await context.params;
  const segments = params.path || [];
  const path = segments.join("/");
  const method = request.method.toUpperCase();

  // This route is a fixed-backend API gateway, never a general-purpose proxy.
  if (!path.startsWith("api/v1/") || path.includes("..") || path.includes("\\\\")) {
    return Response.json({ detail: "Not found" }, { status: 404 });
  }
  if (!["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"].includes(method)) {
    return Response.json({ detail: "Method not allowed" }, { status: 405 });
  }
  if (method === "OPTIONS") return new Response(null, { status: 204 });

  const publicAuth = PUBLIC_AUTH_PATHS.has(path);
  const authorization = request.headers.get("authorization");
  if (!publicAuth && !authorization?.startsWith("Bearer ")) {
    return Response.json({ detail: "Authentication required" }, { status: 401 });
  }

  let body: ArrayBuffer | undefined;
  if (method !== "GET" && method !== "HEAD") {
    const declaredLength = Number(request.headers.get("content-length") || 0);
    if (declaredLength > MAX_BODY_BYTES) {
      return Response.json({ detail: "Request body too large" }, { status: 413 });
    }
    body = await request.arrayBuffer();
    if (body.byteLength > MAX_BODY_BYTES) {
      return Response.json({ detail: "Request body too large" }, { status: 413 });
    }
  }

  try {
    const upstream = await fetch(buildBackendUrl(request, segments), {
      method,
      headers: forwardedRequestHeaders(request, path),
      body,
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(30_000),
    });
    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: forwardedResponseHeaders(upstream),
    });
  } catch {
    return Response.json(
      { detail: "Unable to reach backend API" },
      { status: 502, headers: { "cache-control": "no-store" } },
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const HEAD = proxy;
export const OPTIONS = proxy;
