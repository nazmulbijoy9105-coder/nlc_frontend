import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DEFAULT_BACKEND_URL = "https://nlc-platform.onrender.com";
const HOP_BY_HOP_HEADERS = [
  "connection", "content-encoding", "content-length", "host",
  "keep-alive", "origin", "proxy-authenticate", "proxy-authorization",
  "te", "trailer", "transfer-encoding", "upgrade",
];

type RouteContext = {
  params: Promise<{ path?: string[] }> | { path?: string[] };
};

function backendBaseUrl(): string {
  return (
    process.env.NLC_BACKEND_URL ||
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    DEFAULT_BACKEND_URL
  ).replace(/\/+$/, "");
}

function buildBackendUrl(request: NextRequest, pathSegments: string[] = []): string {
  const path = pathSegments.map(encodeURIComponent).join("/");
  const url = new URL(path, backendBaseUrl() + "/");
  url.search = request.nextUrl.search;
  return url.toString();
}

function forwardedRequestHeaders(request: NextRequest): Headers {
  const headers = new Headers(request.headers);
  for (const header of HOP_BY_HOP_HEADERS) headers.delete(header);
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
  const method = request.method.toUpperCase();
  if (method === "OPTIONS") return new Response(null, { status: 204 });

  try {
    const response = await fetch(buildBackendUrl(request, params.path), {
      method,
      headers: forwardedRequestHeaders(request),
      body: method === "GET" || method === "HEAD" ? undefined : await request.arrayBuffer(),
      cache: "no-store",
      redirect: "manual",
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: forwardedResponseHeaders(response),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Backend request failed";
    return Response.json(
      { detail: "Unable to reach backend API", message },
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
