import { clearAuth, getValidAccessToken, refreshToken } from "@/lib/auth";
import { API_BASE } from "@/lib/api-config";
import { ApiError } from "@/lib/api-errors";

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
  }
  return (await response.text().catch(() => "")) || fallback;
}

function expireSession(path: string, status: number, message: string): boolean {
  const normalized = message.toLowerCase();
  const expired = status === 401 || (status === 403 &&
    ["not authenticated", "invalid", "expired", "deactivated", "role mismatch"].some((term) => normalized.includes(term)));
  if (expired && typeof window !== "undefined" && !path.startsWith("/api/v1/auth/")) {
    clearAuth();
    if (window.location.pathname !== "/") window.location.assign("/");
  }
  return expired;
}

async function authenticatedFetch(path: string, init: RequestInit, retryRead = false): Promise<Response> {
  const token = await getValidAccessToken();
  if (!token) throw new ApiError("Your session has expired. Please sign in again.", 401);
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  let authRetried = false;
  let transientRetried = false;

  while (true) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    try {
      const response = await fetch(API_BASE + path, {
        ...init, headers, credentials: "include", cache: "no-store", signal: controller.signal,
      });
      if (response.ok || response.status === 204) return response;
      if (response.status === 401 && !authRetried && !path.startsWith("/api/v1/auth/")) {
        authRetried = true;
        const refreshed = await refreshToken();
        if (refreshed) {
          headers.set("Authorization", `Bearer ${refreshed}`);
          continue;
        }
      }
      const message = await errorMessage(response);
      if (expireSession(path, response.status, message)) {
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
  const response = await authenticatedFetch(path, { method: "POST", body: form });
  if (response.status === 204) return undefined;
  return response.json();
}

export async function downloadAuthenticatedFile(path: string, fallbackName: string): Promise<void> {
  const response = await authenticatedFetch(path, { method: "GET" }, true);
  const blob = await response.blob();
  const disposition = response.headers.get("content-disposition") || "";
  const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  const plain = disposition.match(/filename="?([^";]+)"?/i)?.[1];
  const filename = encoded ? decodeURIComponent(encoded) : plain || fallbackName;
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000);
}
