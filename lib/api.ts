const API_BASE = process.env.NEXT_PUBLIC_API_BASE_PATH || "/api/backend";

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

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (typeof window !== "undefined") {
      const token = localStorage.getItem('nlc_access_token');
      if (token) headers["Authorization"] = "Bearer " + token;
    }
    return headers;
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(this.baseUrl + path, {
      method: "POST",
      headers: this.getHeaders(),
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      throw new Error(await readErrorMessage(res));
    }
    return res.json();
  }

  // EXACT MATCH OF YOUR ORIGINAL WORKING FETCH
  async postForm<T>(path: string, formData: URLSearchParams): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/x-www-form-urlencoded" // Strictly defining this
    };
    if (typeof window !== "undefined") {
      const token = localStorage.getItem('nlc_access_token');
      if (token) headers["Authorization"] = "Bearer " + token;
    }

    const res = await fetch(this.baseUrl + path, {
      method: "POST",
      headers,
      credentials: "include",
      body: formData,
    });
    if (!res.ok) {
      throw new Error(await readErrorMessage(res));
    }
    return res.json();
  }

  async get<T>(path: string): Promise<T> {
    const res = await fetch(this.baseUrl + path, {
      method: "GET",
      headers: this.getHeaders(),
      credentials: "include",
    });
    if (!res.ok) {
      throw new Error(await readErrorMessage(res));
    }
    return res.json();
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(this.baseUrl + path, {
      method: "PUT",
      headers: this.getHeaders(),
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      throw new Error(await readErrorMessage(res));
    }
    return res.json();
  }

  async delete<T>(path: string): Promise<T> {
    const res = await fetch(this.baseUrl + path, {
      method: "DELETE",
      headers: this.getHeaders(),
      credentials: "include",
    });
    if (!res.ok) {
      throw new Error(await readErrorMessage(res));
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
    return api.postForm<any>("/api/v1/auth/login", formData);
  },
  verify2FA: (temp_token: string, totp_code: string) =>
    api.post<any>("/api/v1/auth/verify-2fa", { temp_token, totp_code }),
  me: () => api.get<any>("/api/v1/auth/me"),
  logout: () => api.post("/api/v1/auth/logout"),
};

export const dashboardApi = {
  getStats: () => api.get<any>("/api/v1/companies/dashboard/kpis"),
  stats: () => api.get<any>("/api/v1/companies/dashboard/kpis"),
  recentActivity: () => api.get<any>("/api/v1/admin/dashboard"),
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