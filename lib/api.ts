import { clearAuth, getValidAccessToken } from "@/lib/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_PATH || "/api/backend";
const AUTH_ERROR_MESSAGE = "Your session has expired. Please sign in again.";

type RequestOptions = {
  auth?: boolean;
};

function isAuthEndpoint(path: string): boolean {
  return path.startsWith("/api/v1/auth/login") || path.startsWith("/api/v1/auth/verify-2fa");
}

function handleAuthFailure(path: string): void {
  if (typeof window === "undefined" || isAuthEndpoint(path)) return;
  clearAuth();
  if (window.location.pathname !== "/") {
    window.location.href = "/";
  }
}

function isGenericBackendError(message: string): boolean {
  return message.toLowerCase().includes("an unexpected error occurred");
}

function isAuthenticationFailure(status: number, message: string): boolean {
  const normalized = message.toLowerCase();
  if (status === 401) return true;
  if (status !== 403) return false;
  return (
    normalized.includes("not authenticated") ||
    normalized.includes("invalid") ||
    normalized.includes("expired") ||
    normalized.includes("deactivated") ||
    normalized.includes("role mismatch")
  );
}

async function readErrorMessage(res: Response): Promise<string> {
  const fallback = "HTTP " + res.status;
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const err = await res.json().catch(() => null);
    const detail = err?.detail || err?.message || err?.error || err?.errors;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      return detail
        .map((item) => {
          if (typeof item === "string") return item;
          const field = Array.isArray(item?.loc) ? item.loc.join(".") : item?.field;
          return [field, item?.msg || item?.message].filter(Boolean).join(": ");
        })
        .filter(Boolean)
        .join("; ") || fallback;
    }
    return fallback;
  }
  return (await res.text().catch(() => "")) || fallback;
}

class ApiClient {
  private baseUrl: string;
  constructor(baseUrl: string) { this.baseUrl = baseUrl; }

  private getHeaders(options: RequestOptions = {}): Record<string, string> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (options.auth !== false) {
      const token = getValidAccessToken();
      if (token) headers["Authorization"] = "Bearer " + token;
    }
    return headers;
  }

  private async request<T>(
    path: string,
    init: RequestInit,
    options: RequestOptions = {},
  ): Promise<T> {
    const headers = new Headers(init.headers || this.getHeaders(options));
    if (options.auth !== false && !headers.has("Authorization")) {
      const token = getValidAccessToken();
      if (token) headers.set("Authorization", "Bearer " + token);
    }
    if (options.auth !== false && !headers.has("Authorization")) {
      handleAuthFailure(path);
      throw new Error(AUTH_ERROR_MESSAGE);
    }

    const res = await fetch(this.baseUrl + path, {
      ...init,
      headers,
      credentials: "include",
    });

    if (!res.ok) {
      const message = await readErrorMessage(res);
      const authFailure =
        !isAuthEndpoint(path) &&
        (isAuthenticationFailure(res.status, message) ||
          (res.status === 500 && headers.has("Authorization") && isGenericBackendError(message)));

      if (authFailure) {
        handleAuthFailure(path);
        throw new Error(AUTH_ERROR_MESSAGE);
      }

      throw new Error(message);
    }

    return res.json();
  }

  async post<T>(path: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }, options);
  }

  async postForm<T>(path: string, formData: URLSearchParams, options: RequestOptions = {}): Promise<T> {
    return this.request<T>(path, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData,
    }, options);
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: "GET" });
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined });
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: "DELETE" });
  }
}

export const api = new ApiClient(API_BASE);

function shouldFallbackToFormLogin(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("validation") ||
    normalized.includes("field required") ||
    normalized.includes("username") ||
    normalized.includes("body")
  );
}

export const authApi = {
  login: async (email: string, password: string) => {
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);
    try {
      return await api.post<any>("/api/v1/auth/login", { email, password }, { auth: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (!shouldFallbackToFormLogin(message)) throw error;
      return api.postForm<any>("/api/v1/auth/login", formData, { auth: false });
    }
  },
  verify2FA: (temp_token: string, totp_code: string) =>
    api.post<any>("/api/v1/auth/verify-2fa", { temp_token, totp_code }, { auth: false }),
  me: () => api.get<any>("/api/v1/auth/me"),
  logout: () => api.post("/api/v1/auth/logout"),
};

export const dashboardApi = {
  getStats: () => api.get<any>("/api/v1/companies/dashboard/kpis"),
  stats: () => api.get<any>("/api/v1/companies/dashboard/kpis"),
  recentActivity: async () => [],
  upcomingDeadlines: () => api.get<any>("/api/v1/companies/dashboard/deadlines"),
};

export const companiesApi = {
  list: () => api.get<any>("/api/v1/companies"),
  get: (id: string) => api.get<any>("/api/v1/companies/" + id),
  create: (data: any) => api.post<any>("/api/v1/companies", data),
  modules: (id: string) => api.get<any>("/api/v1/companies/" + id + "/compliance"),
  violations: (id: string) => api.get<any>("/api/v1/companies/" + id + "/flags"),
  evaluate: (id: string) => api.post<any>("/api/v1/companies/" + id + "/evaluate"),
};

export const filingsApi = {
  list: (companyId?: string) => api.get<any>("/api/v1/filings" + (companyId ? "?company_id=" + companyId : "")),
};

export const documentsApi = {
  list: () => api.get<any>("/api/v1/documents"),
  approve: (id: string) => api.post<any>("/api/v1/documents/" + id + "/approve"),
};

export const rescueApi = {
  list: () => api.get<any>("/api/v1/rescue/plans"),
  activePlan: (companyId: string) => api.get<any>("/api/v1/rescue/plans/" + companyId + "/active"),
};
