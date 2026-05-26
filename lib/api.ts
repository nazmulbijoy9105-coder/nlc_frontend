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
    window.location.assign("/");
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
    const detail = err?.detail || err?.message || err?.error;

    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      return detail
        .map((item) => {
          if (typeof item === "string") return item;
          const field = Array.isArray(item?.loc) ? item.loc.join(".") : undefined;
          return [field, item?.msg].filter(Boolean).join(": ");
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

  async post<T>(path: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
    const headers = this.getHeaders(options);
    const res = await fetch(this.baseUrl + path, {
      method: "POST",
      headers,
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const message = await readErrorMessage(res);
      if (
        isAuthenticationFailure(res.status, message) ||
        (res.status === 500 && headers.Authorization && isGenericBackendError(message))
      ) {
        handleAuthFailure(path);
        throw new Error(AUTH_ERROR_MESSAGE);
      }
      throw new Error(message);
    }
    return res.json();
  }

  // EXACT MATCH OF YOUR ORIGINAL WORKING FETCH
  async postForm<T>(path: string, formData: URLSearchParams, options: RequestOptions = {}): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/x-www-form-urlencoded" // Strictly defining this
    };
    if (options.auth !== false) {
      const token = getValidAccessToken();
      if (token) headers["Authorization"] = "Bearer " + token;
    }

    const res = await fetch(this.baseUrl + path, {
      method: "POST",
      headers,
      credentials: "include",
      body: formData,
    });
    if (!res.ok) {
      const message = await readErrorMessage(res);
      if (isAuthenticationFailure(res.status, message)) {
        handleAuthFailure(path);
        throw new Error(AUTH_ERROR_MESSAGE);
      }
      throw new Error(message);
    }
    return res.json();
  }

  async get<T>(path: string): Promise<T> {
    const headers = this.getHeaders();
    const res = await fetch(this.baseUrl + path, {
      method: "GET",
      headers,
      credentials: "include",
    });
    if (!res.ok) {
      const message = await readErrorMessage(res);
      if (
        isAuthenticationFailure(res.status, message) ||
        (res.status === 500 && headers.Authorization && isGenericBackendError(message))
      ) {
        handleAuthFailure(path);
        throw new Error(AUTH_ERROR_MESSAGE);
      }
      throw new Error(message);
    }
    return res.json();
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    const headers = this.getHeaders();
    const res = await fetch(this.baseUrl + path, {
      method: "PUT",
      headers,
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const message = await readErrorMessage(res);
      if (
        isAuthenticationFailure(res.status, message) ||
        (res.status === 500 && headers.Authorization && isGenericBackendError(message))
      ) {
        handleAuthFailure(path);
        throw new Error(AUTH_ERROR_MESSAGE);
      }
      throw new Error(message);
    }
    return res.json();
  }

  async delete<T>(path: string): Promise<T> {
    const headers = this.getHeaders();
    const res = await fetch(this.baseUrl + path, {
      method: "DELETE",
      headers,
      credentials: "include",
    });
    if (!res.ok) {
      const message = await readErrorMessage(res);
      if (
        isAuthenticationFailure(res.status, message) ||
        (res.status === 500 && headers.Authorization && isGenericBackendError(message))
      ) {
        handleAuthFailure(path);
        throw new Error(AUTH_ERROR_MESSAGE);
      }
      throw new Error(message);
    }
    return res.json();
  }
}

export const api = new ApiClient(API_BASE);

export const authApi = {
  login: (email: string, password: string) => {
    const formData = new URLSearchParams();
    formData.append("username", email); // FastAPI OAuth2 expects 'username'
    formData.append("password", password);
    return api.postForm<any>("/api/v1/auth/login", formData, { auth: false });
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