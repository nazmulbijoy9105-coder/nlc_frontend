const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://nlc-platform.onrender.com";

class ApiClient {
  private baseUrl: string;
  constructor(baseUrl: string) { this.baseUrl = baseUrl; }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      if (token) headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: this.getHeaders(),
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Request failed" }));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    return res.json();
  }

  async get<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: "GET",
      headers: this.getHeaders(),
      credentials: "include",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Request failed" }));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    return res.json();
  }
}

export const api = new ApiClient(API_BASE);

export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ access_token?: string; refresh_token?: string; temp_token?: string; requires_2fa?: boolean; user?: object }>("/api/v1/auth/login", { email, password }),
  verify2FA: (temp_token: string, totp_code: string) =>
    api.post<{ access_token: string; refresh_token: string; user: object }>("/api/v1/auth/verify-2fa", { temp_token, totp_code }),
  me: () =>
    api.get<{ id: number; email: string; full_name: string; role: string; is_active: boolean }>("/api/v1/auth/me"),
  logout: () =>
    api.post("/api/v1/auth/logout"),
};

export const dashboardApi = {
  getStats: () => api.get<any>('/api/v1/companies/dashboard'),
  stats: () => api.get<any>('/api/v1/companies/dashboard'),
  recentActivity: () => api.get<any>('/api/v1/admin/activity'),
  upcomingDeadlines: () => api.get<any>('/api/v1/filings/deadlines'),
};

export const companiesApi = {
  list: () => api.get<any>('/api/v1/companies'),
  get: (id: string) => api.get<any>('/api/v1/companies/' + id),
  modules: (id: string) => api.get<any>('/api/v1/companies/' + id + '/modules'),
  violations: (id: string) => api.get<any>('/api/v1/companies/' + id + '/violations'),
  evaluate: (id: string) => api.post<any>('/api/v1/companies/' + id + '/evaluate'),
};

export const filingsApi = {
  list: (companyId) => api.get('/api/v1/filings?company_id=' + companyId),
};

export const documentsApi = {
  list: () => api.get<any>('/api/v1/documents'),
  approve: (id: string) => api.post<any>('/api/v1/documents/' + id + '/approve'),
};

export const rescueApi = {
  list: () => api.get<any>('/api/v1/rescue'),
  pipeline: () => api.get<any>('/api/v1/rescue/pipeline'),
};
