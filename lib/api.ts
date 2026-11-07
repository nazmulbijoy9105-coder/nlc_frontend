import { clearAuth, getRefreshToken, getValidAccessToken } from "@/lib/auth";


const AUTH_ERROR_MESSAGE = "Your session has expired. Please sign in again.";

type RequestOptions = {
  auth?: boolean;
};

function isAuthEndpoint(path: string): boolean {
  return (
    path.startsWith("/api/v1/auth/login") ||
    path.startsWith("/api/v1/auth/signup") ||
    path.startsWith("/api/v1/auth/verify-2fa")
  );
}

function handleAuthFailure(path: string): void {
  if (typeof window === "undefined" || isAuthEndpoint(path)) return;

  clearAuth();
  if (window.location.pathname !== "/") {
    window.location.assign("/");
  }
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
          const field = Array.isArray(item?.loc)
            ? item.loc.join(".")
            : item?.field;
          return [field, item?.msg || item?.message].filter(Boolean).join(": ");
        })
        .filter(Boolean)
        .join("; ") || fallback;
    }

    return fallback;
  }

  return (await res.text().catch(() => "")) || fallback;
}
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://nlc-platform.onrender.com";

class ApiClient {
  private baseUrl: string;
  constructor(baseUrl: string) { this.baseUrl = baseUrl; }

  private async getHeaders(auth = true): Promise<HeadersInit> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (auth && typeof window !== "undefined") {
      try {
        const token = await getValidAccessToken();
        if (token) headers["Authorization"] = "Bearer " + token;
      } catch {
        // token refresh failed — proceed without auth
      }
    }
    return headers;
  }

  async post<T>(path: string, body?: unknown, options: {auth?: boolean} = {}): Promise<T> {
    const auth = options.auth !== false;
    const res = await fetch(this.baseUrl + path, {
      method: "POST",
      headers: await this.getHeaders(auth),
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const message = await readErrorMessage(res);
      const authFailure =
        !isAuthEndpoint(path) &&
        isAuthenticationFailure(res.status, message);

      if (authFailure) {
        handleAuthFailure(path);
        throw new Error(AUTH_ERROR_MESSAGE);
      }

      throw new Error(message);
    }
    return res.json();
  }

  async get<T>(path: string): Promise<T> {
    const res = await fetch(this.baseUrl + path, {
      method: "GET",
      headers: await this.getHeaders(),
      credentials: "include",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Request failed" }));
      throw new Error(err.detail || "HTTP " + res.status);
    }
    return res.json();
  }

  async delete<T>(path: string): Promise<T> {
    const res = await fetch(this.baseUrl + path, {
      method: 'DELETE',
      headers: await this.getHeaders(),
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(this.baseUrl + path, {
      method: "PATCH",
      headers: await this.getHeaders(),
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
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
      headers: await this.getHeaders(),
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
  signup: (email: string, password: string, full_name: string, role: string) =>
    api.post<any>("/api/v1/auth/signup", { email, password, full_name, role }, { auth: false }),
  verify2FA: (temp_token: string, totp_code: string) =>
    api.post<any>("/api/v1/auth/verify-2fa", { temp_token, totp_code }, { auth: false }),
  confirm2FA: (totp_code: string) =>
    api.post<any>("/api/v1/auth/2fa/confirm", { totp_code }),
  me: () => api.get<any>("/api/v1/auth/me"),
  logout: () => api.post("/api/v1/auth/logout", { refresh_token: getRefreshToken() }),
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
  update: (id: string, data: any) => api.patch<any>("/api/v1/companies/" + id, data),
  delete: (id: string) => api.delete<any>("/api/v1/companies/" + id),
  downloadPDF: async (id: string) => {
    const token = await getValidAccessToken();
    const res = await fetch(API_BASE + "/api/v1/companies/" + id + "/compliance-pdf", {
      headers: { Authorization: "Bearer " + token },
    });
    if (!res.ok) throw new Error("PDF download failed: " + res.status);
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "NLC_Compliance_Report_" + id + ".pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },
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

export const articlesApi = {
  list: (companyId: string) =>
    api.get<any>("/api/v1/companies/" + companyId + "/articles-verification"),
  submit: (companyId: string, documentId: string) =>
    api.post<any>("/api/v1/companies/" + companyId + "/articles-verification", { document_id: documentId }),
  review: (companyId: string, verificationId: string, data: any) =>
    api.post<any>("/api/v1/companies/" + companyId + "/articles-verification/" + verificationId + "/review", data),
  revoke: (companyId: string, verificationId: string, reason: string) =>
    api.post<any>("/api/v1/companies/" + companyId + "/articles-verification/" + verificationId + "/revoke", { reason }),
  events: (companyId: string, verificationId: string) =>
    api.get<any>("/api/v1/companies/" + companyId + "/articles-verification/" + verificationId + "/events"),
  upload: async (companyId: string, file: File) => {
    const token = await getValidAccessToken();
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(
      API_BASE + "/api/v1/companies/" + companyId + "/articles-document",
      {
        method: "POST",
        headers: token ? { Authorization: "Bearer " + token } : {},
        credentials: "include",
        body: form,
      },
    );
    if (!res.ok) throw new Error(await readErrorMessage(res));
    return res.json();
  },
};

export const documentsApi = {
  list: () => api.get<any>("/api/v1/documents"),
  templates: () => api.get<any>("/api/v1/documents/templates"),
  listByCompany: (companyId: string) => api.get<any>("/api/v1/documents/" + companyId),
  generate: (data: any) => api.post<any>("/api/v1/documents/generate", data),
  approve: (id: string) => api.post<any>("/api/v1/documents/detail/" + id + "/approve"),
  release: (id: string) => api.post<any>("/api/v1/documents/detail/" + id + "/release"),
  detail: (id: string) => api.get<any>("/api/v1/documents/detail/" + id),
  downloadPdf: (id: string) => api.get<any>("/api/v1/documents/detail/" + id + "/download-pdf"),
};

export const rescueApi = {
  list: (companyId?: string) => api.get<any>("/api/v1/rescue/plans" + (companyId ? "?company_id=" + companyId : "")),
  pipeline: () => api.get<any>("/api/v1/rescue/plans"),
  getActive: (companyId: string) => api.get<any>("/api/v1/rescue/plans/" + companyId + "/active"),
};

export const commercialApi = {
  pipeline: () => api.get<any>("/api/v1/commercial/pipeline"),
  funnel: () => api.get<any>("/api/v1/commercial/funnel"),
  engagements: (companyId: string) => api.get<any>("/api/v1/commercial/engagements/" + companyId),
  createEngagement: (data: any) => api.post<any>("/api/v1/commercial/engagements", data),
  advanceStatus: (id: string, data: any) => api.patch<any>("/api/v1/commercial/engagements/" + id + "/status", data),
  tasks: (companyId: string) => api.get<any>("/api/v1/commercial/tasks/" + companyId),
  createTask: (data: any) => api.post<any>("/api/v1/commercial/tasks", data),
  completeTask: (id: string, data: any) => api.patch<any>("/api/v1/commercial/tasks/" + id + "/complete", data),
  createQuotation: (data: any) => api.post<any>("/api/v1/commercial/quotations", data),
  acceptQuotation: (id: string) => api.patch<any>("/api/v1/commercial/quotations/" + id + "/accept"),
  rejectQuotation: (id: string, data: any) => api.patch<any>("/api/v1/commercial/quotations/" + id + "/reject", data),
}

export const adminApi = {
  listUsers:      (page = 1) => api.get<any>(`/api/v1/admin/users?page=${page}&per_page=50`),
  createUser:     (data: { email: string; full_name: string; role: string; password: string }) =>
                    api.post<any>('/api/v1/admin/users', data),
  deactivateUser: (id: string) => api.patch<any>(`/api/v1/admin/users/${id}/deactivate`, {}),
  reactivateUser: (id: string) => api.patch<any>(`/api/v1/admin/users/${id}/reactivate`, {}),
}

export const rulesApi = {
  list: () => api.get<any>('/api/v1/rules'),
  summary: () => api.get<any>('/api/v1/rules/summary'),
}


export const financeApi = {
  createInvoice: (data: {
    company_id: string;
    engagement_id?: string | null;
    lines: Array<{ description: string; quantity: string; unit_price_bdt: string }>;
    tax_bdt: string;
    due_at?: string | null;
    notes?: string | null;
  }) => api.post<any>("/api/v1/finance/invoices", data),
  issueInvoice: (invoiceId: string) =>
    api.post<any>("/api/v1/finance/invoices/" + invoiceId + "/issue"),
  invoices: (companyId: string) =>
    api.get<any>("/api/v1/finance/companies/" + companyId + "/invoices"),
  invoice: (invoiceId: string) =>
    api.get<any>("/api/v1/finance/invoices/" + invoiceId),
  submitOfflinePayment: (companyId: string, data: {
    invoice_id: string;
    method: "BANK_TRANSFER" | "CASH" | "CHEQUE" | "BKASH_MANUAL" | "NAGAD_MANUAL";
    amount_bdt: string;
    payer_reference?: string | null;
    paid_at?: string | null;
  }) => api.post<any>("/api/v1/finance/companies/" + companyId + "/payments/offline", data),
  paymentSubmissions: (companyId: string) =>
    api.get<any>("/api/v1/finance/companies/" + companyId + "/payment-submissions"),
  approvePaymentSubmission: (submissionId: string, data: {
    review_note?: string | null;
    cheque_cleared_at?: string | null;
  } = {}) => api.post<any>("/api/v1/finance/payment-submissions/" + submissionId + "/approve", data),
  rejectPaymentSubmission: (submissionId: string, reason: string) =>
    api.post<any>("/api/v1/finance/payment-submissions/" + submissionId + "/reject", { reason }),
  payments: (companyId: string) =>
    api.get<any>("/api/v1/finance/companies/" + companyId + "/payments"),
export const billingApi = {
  plans: (includeInactive = false) =>
    api.get<any[]>(`/api/v1/subscriptions/plans${includeInactive ? "?include_inactive=true" : ""}`),
  current: (companyId: string) =>
    api.get<any>(`/api/v1/subscriptions/companies/${companyId}/current`),
  history: (companyId: string) =>
    api.get<any[]>(`/api/v1/subscriptions/companies/${companyId}/history`),
  requestSubscription: (companyId: string, planCode: string, billingInterval: string) =>
    api.post<any>(`/api/v1/subscriptions/companies/${companyId}`, {
      plan_code: planCode, billing_interval: billingInterval,
    }),
  cancelAtPeriodEnd: (companyId: string, subscriptionId: string) =>
    api.post<any>(`/api/v1/subscriptions/companies/${companyId}/${subscriptionId}/cancel`, {}),
  invoices: (companyId: string) =>
    api.get<any[]>(`/api/v1/finance/companies/${companyId}/invoices`),
  paymentSubmissions: (companyId: string) =>
    api.get<any[]>(`/api/v1/finance/companies/${companyId}/payment-submissions`),
  payments: (companyId: string) =>
    api.get<any[]>(`/api/v1/finance/companies/${companyId}/payments`),
  submitOfflinePayment: (companyId: string, body: {
    invoice_id: string; method: "BANK_TRANSFER" | "CASH" | "CHEQUE";
    amount_bdt: string; payer_reference?: string;
  }) => api.post<any>(`/api/v1/finance/companies/${companyId}/payments/offline`, body),
  financeQueue: (status = "PENDING") =>
    api.get<any[]>(`/api/v1/subscriptions/admin?status=${encodeURIComponent(status)}`),
  issueSubscriptionInvoice: (subscriptionId: string) =>
    api.post<any>(`/api/v1/subscriptions/${subscriptionId}/invoice`, {}),
  upsertPlan: (planCode: string, body: any) =>
    api.put<any>(`/api/v1/subscriptions/plans/${encodeURIComponent(planCode)}`, body),
  approvePayment: (submissionId: string, reviewNote?: string, chequeClearedAt?: string) =>
    api.post<any>(`/api/v1/finance/payment-submissions/${submissionId}/approve`, { review_note: reviewNote || null, cheque_cleared_at: chequeClearedAt || null }),
  rejectPayment: (submissionId: string, reason: string) =>
    api.post<any>(`/api/v1/finance/payment-submissions/${submissionId}/reject`, { reason }),
};
