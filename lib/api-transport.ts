import { clearAuth, getValidAccessToken, refreshToken } from "@/lib/auth";
import { API_BASE } from "@/lib/api-config";
import { ApiError } from "@/lib/api-errors";

export type TransportOptions = {
  auth?: boolean;
  retryRead?: boolean;
};

async function errorMessage(response: Response): Promise<string> {
  const fallback = `HTTP ${response.status}`;
  const type = response.headers.get("content-type") || "";
  if (type.includes("application/json")) {
    const payload = await response.json().catch(() => null);
    const detail = payload?.detail ?? payload?.message ?? payload?.error;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) return detail.map((entry) =>
      typeof entry === "string" ? entry : [entry?.loc?.join?.("."), entry?.msg || entry?.message].filter(Boolean).join(": ")
    ).filter(Boolean).join("; ") || fallback;
    return fallback;
  }
  return (await response.text().catch(() => "")) || fallback;
}

function isAuthEndpoint(path: string): boolean {
  return path.startsWith("/api/v1/auth/");
}

function expireSession(path: string, status: number, message: string): boolean {
  const normalized = message.toLowerCase();
  const expired = status === 401 || (status === 403 &&
    ["not authenticated", "invalid", "expired", "deactivated", "role mismatch"].some((term) => normalized.includes(term)));
  if (expired && typeof window !== "undefined" && !isAuthEndpoint(path)) {
    clearAuth();
    if (window.location.pathname !== "/") window.location.assign("/");
  }
  return expired;
}

/**
 * The single browser HTTP transport for JSON, multipart and binary requests.
 * Callers supply serialization and response decoding; authentication, credentials,
 * refresh, timeout, retry and session-expiry policy live here.
 */
export async function requestApiResponse(
  baseUrl: string,
  path: string,
  init: RequestInit,
  options: TransportOptions = {},
): Promise<Response> {
  const method = (init.method || "GET").toUpperCase();
  const auth = options.auth !== false;
  const retryRead = options.retryRead ?? method === "GET";
  const headers = new Headers(init.headers);

  if (auth) {
    let token = "";
    try {
      token = await getValidAccessToken();
    } catch {
      throw new ApiError("Authentication service is temporarily unavailable. Please retry.", 503);
    }
    if (!token) {
      expireSession(path, 401, "not authenticated");
      throw new ApiError("Your session has expired. Please sign in again.", 401);
    }
    headers.set("Authorization", `Bearer ${token}`);
  }

  let authRetried = false;
  let transientRetried = false;
  while (true) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    try {
      const response = await fetch(baseUrl + path, {
        ...init,
        method,
        headers,
        credentials: "include",
        cache: "no-store",
        signal: controller.signal,
      });
      if (response.ok || response.status === 204) return response;

      if (auth && response.status === 401 && !authRetried && !isAuthEndpoint(path)) {
        authRetried = true;
        let refreshed = "";
        try {
          refreshed = await refreshToken();
        } catch {
          throw new ApiError("Authentication service is temporarily unavailable. Please retry.", 503);
        }
        if (refreshed) {
          headers.set("Authorization", `Bearer ${refreshed}`);
          continue;
        }
      }

      const message = await errorMessage(response);
      if (auth && expireSession(path, response.status, message)) {
        throw new ApiError("Your session has expired. Please sign in again.", response.status);
      }
      if (retryRead && !transientRetried && [502, 503, 504].includes(response.status)) {
        transientRetried = true;
        continue;
      }
      throw new ApiError(message, response.status);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (error instanceof Error && error.name === "AbortError") {
        throw new ApiError("The request timed out. Please try again.", 408);
      }
      if (retryRead && !transientRetried) {
        transientRetried = true;
        continue;
      }
      throw new ApiError("The service is temporarily unavailable. Check your connection and try again.", 0);
    } finally {
      clearTimeout(timeout);
    }
  }
}

export async function uploadAuthenticatedFile(path: string, file: File, fieldName = "file"): Promise<unknown> {
  const form = new FormData();
  form.append(fieldName, file);
  const response = await requestApiResponse(API_BASE, path, { method: "POST", body: form });
  if (response.status === 204) return undefined;
  return response.json();
}

export async function downloadAuthenticatedFile(path: string, fallbackName: string): Promise<void> {
  const response = await requestApiResponse(API_BASE, path, { method: "GET" }, { retryRead: true });
  const blob = await response.blob();
  const disposition = response.headers.get("content-disposition") || "";
  const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  const plain = disposition.match(/filename="?([^";]+)"?/i)?.[1];
  let filename = fallbackName;
  try {
    filename = encoded ? decodeURIComponent(encoded) : plain || fallbackName;
  } catch {
    filename = plain || fallbackName;
  }
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000);
}
