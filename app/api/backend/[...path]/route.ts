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

function forwardedRequestHeaders(request: NextRequest): Headers {
  const headers = new Headers(request.headers);
  for (const header of HOP_BY_HOP_HEADERS) headers.delete(header);
  headers.delete("cookie");
  headers.set("x-forwarded-host", request.nextUrl.host);
  headers.set("x-forwarded-proto", request.nextUrl.protocol.replace(":", ""));
  return headers;
}

function forwardedResponseHeaders(response: Response): Headers {
  const headers = new Headers(response.headers);
  for (const header of HOP_BY_HOP_HEADERS) headers.delete(header);
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
      headers: forwardedRequestHeaders(request),
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
