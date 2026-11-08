import { clearAuth, getValidAccessToken } from "@/lib/auth";
import { API_BASE } from "@/lib/api-config";

export class ApiTransportError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}
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
  if (!token) throw new ApiTransportError("Your session has expired. Please sign in again.", 401);
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  const attempts = retryRead ? 2 : 1;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    try {
      const response = await fetch(API_BASE + path, { ...init, headers, credentials: "include", cache: "no-store", signal: controller.signal });
      if (response.ok || response.status === 204) return response;
      const message = await errorMessage(response);
      if (expireSession(path, response.status, message)) throw new ApiTransportError("Your session has expired. Please sign in again.", response.status);
      if (retryRead && attempt + 1 < attempts && [502, 503, 504].includes(response.status)) continue;
      throw new ApiTransportError(message, response.status);
    } catch (error) {
      if (error instanceof ApiTransportError) throw error;
      if (attempt + 1 >= attempts) {
        if (error instanceof Error && error.name === "AbortError") throw new ApiTransportError("The request timed out. Please try again.", 408);
        throw new ApiTransportError("The service is temporarily unavailable. Check your connection and try again.", 0);
      }
    } finally { clearTimeout(timeout); }
  }
  throw new ApiTransportError("The service is temporarily unavailable.", 0);
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
