const API_BASE = process.env.NEXT_PUBLIC_API_BASE_PATH || "/api/backend";

class ApiClient {
  private baseUrl: string;
  constructor(baseUrl: string) { this.baseUrl = baseUrl; }

  private getHeaders(auth = true): HeadersInit {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (auth && typeof window !== "undefined") {
      const token = localStorage.getItem("nlc_access_token");
      if (token) headers["Authorization"] = "Bearer " + token;
    }
    return headers;
  }

  async post<T>(path: string, body?: unknown, options: {auth?: boolean} = {}): Promise<T> {
    const auth = options.auth !== false;
    const res = await fetch(this.baseUrl + path, {
      method: "POST",
      headers: this.getHeaders(auth),
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Request failed" }));
      throw new Error(err.detail || "HTTP " + res.status);
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
      const err = await res.json().catch(() => ({ detail: "Request failed" }));
      throw new Error(err.detail || "HTTP " + res.status);
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
      const err = await res.json().catch(() => ({ detail: "Request failed" }));
      throw new Error(err.detail || "HTTP " + res.status);
    }
    return res.json();
  }
}

export const api = new ApiClient(API_BASE);

export const authApi = {
  login: (email: string, password: string) =>
    api.post<any>("/api/v1/auth/login", { email, password }, { auth: false }),
  verify2FA: (temp_token: string, totp_code: string) =>
    api.post<any>("/api/v1/auth/verify-2fa", { temp_token, totp_code }, { auth: false }),
  me: () => api.get<any>("/api/v1/auth/me"),
  logout: () => api.post("/api/v1/auth/logout"),
};

export const dashboardApi = {
  stats: () => api.get<any>("/api/v1/companies/dashboard/kpis"),
  getStats: () => api.get<any>("/api/v1/companies/dashboard/kpis"),
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
  scoreHistory: (id: string) => api.get<any>("/api/v1/companies/" + id + "/score-history"),
  scoreHistory: (id: string) => api.get<any>("/api/v1/companies/" + id + "/score-history"),
  scoreHistory: (id: string) => api.get<any>("/api/v1/companies/" + id + "/score-history"),
};

export const filingsApi = {
  createAGM: (data: any) => api.post<any>("/api/v1/filings/agm", data),
  createAudit: (data: any) => api.post<any>("/api/v1/filings/audit", data),
  createReturn: (data: any) => api.post<any>("/api/v1/filings/annual-return", data),
  agms: (companyId: string) => api.get<any>("/api/v1/filings/agm/" + companyId),
  audits: (companyId: string) => api.get<any>("/api/v1/filings/audit/" + companyId),
  annualReturns: (companyId: string) => api.get<any>("/api/v1/filings/annual-return/" + companyId),
  listAGM: (companyId?: string) => api.get<any>("/api/v1/filings/agm" + (companyId ? "/" + companyId : "")),
  listAudit: (companyId?: string) => api.get<any>("/api/v1/filings/audit" + (companyId ? "/" + companyId : "")),
  listAnnualReturn: (companyId?: string) => api.get<any>("/api/v1/filings/annual-return" + (companyId ? "/" + companyId : "")),
  listRegisters: (companyId?: string) => api.get<any>("/api/v1/filings/statutory-register" + (companyId ? "/" + companyId : "")),
  list: (companyId?: string) => api.get<any>("/api/v1/filings/annual-return" + (companyId ? "/" + companyId : "")),
};

export const documentsApi = {
  list: () => api.get<any>("/api/v1/documents/templates"),
  listByCompany: (companyId: string) => api.get<any>("/api/v1/documents/" + companyId),
  generate: (data: any) => api.post<any>("/api/v1/documents/generate", data),
  approve: (id: string) => api.post<any>("/api/v1/documents/detail/" + id + "/approve"),
  release: (id: string) => api.post<any>("/api/v1/documents/detail/" + id + "/release"),
  detail: (id: string) => api.get<any>("/api/v1/documents/detail/" + id),
};

export const rescueApi = {
  list: () => api.get<any>("/api/v1/rescue"),
  pipeline: () => api.get<any>("/api/v1/rescue"),
};

export const commercialApi = {
  pipeline: () => api.get<any>("/api/v1/commercial/pipeline"),
  funnel: () => api.get<any>("/api/v1/commercial/funnel"),
  engagements: (companyId: string) => api.get<any>("/api/v1/commercial/engagements/" + companyId),
  createEngagement: (data: any) => api.post<any>("/api/v1/commercial/engagements", data),
  advanceStatus: (id: string, data: any) => api.put<any>("/api/v1/commercial/engagements/" + id + "/status", data),
  tasks: (companyId: string) => api.get<any>("/api/v1/commercial/tasks/" + companyId),
  completeTask: (id: string, data: any) => api.put<any>("/api/v1/commercial/tasks/" + id + "/complete", data),
  createQuotation: (data: any) => api.post<any>("/api/v1/commercial/quotations", data),
  acceptQuotation: (id: string) => api.put<any>("/api/v1/commercial/quotations/" + id + "/accept"),
  rejectQuotation: (id: string, data: any) => api.put<any>("/api/v1/commercial/quotations/" + id + "/reject", data),
}
