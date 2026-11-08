import { clearAuth, getRefreshToken, getValidAccessToken, refreshToken } from "@/lib/auth";
import { API_BASE } from "@/lib/api-config";
import { downloadAuthenticatedFile, uploadAuthenticatedFile } from "@/lib/api-transport";


const AUTH_ERROR_MESSAGE = "Your session has expired. Please sign in again.";

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}

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

class ApiClient {
  private baseUrl: string;
  constructor(baseUrl: string) { this.baseUrl = baseUrl; }

  private async getHeaders(auth = true, path = ""): Promise<Headers> {
    const headers = new Headers({ "Content-Type": "application/json" });
    if (auth && typeof window !== "undefined") {
      const token = await getValidAccessToken();
      if (!token) {
        handleAuthFailure(path);
        throw new ApiError(AUTH_ERROR_MESSAGE, 401);
      }
      headers.set("Authorization", "Bearer " + token);
    }
    return headers;
  }

  private async request<T>(method: string, path: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
    const auth = options.auth !== false;
    const headers = await this.getHeaders(auth, path);
    const requestBody = body === undefined ? undefined : JSON.stringify(body);
    let transientRetries = 0;
    let authRetried = false;

    while (true) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30_000);
      try {
        const response = await fetch(this.baseUrl + path, {
          method, headers, credentials: "include", cache: "no-store",
          signal: controller.signal, body: requestBody,
        });
        if (!response.ok) {
          const message = await readErrorMessage(response);
          if (auth && response.status === 401 && !authRetried && !isAuthEndpoint(path)) {
            authRetried = true;
            const refreshed = await refreshToken();
            if (refreshed) {
              headers.set("Authorization", "Bearer " + refreshed);
              continue;
            }
          }
          const authFailure = !isAuthEndpoint(path) && isAuthenticationFailure(response.status, message);
          if (authFailure) {
            handleAuthFailure(path);
            throw new ApiError(AUTH_ERROR_MESSAGE, response.status);
          }
          if (method === "GET" && transientRetries < 1 && [502, 503, 504].includes(response.status)) {
            transientRetries += 1;
            continue;
          }
          throw new ApiError(message, response.status);
        }
        if (response.status === 204) return undefined as T;
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json")) return await response.json() as T;
        const text = await response.text();
        if (!text) return undefined as T;
        try { return JSON.parse(text) as T; } catch { return text as T; }
      } catch (error) {
        if (error instanceof ApiError) throw error;
        if (error instanceof Error && error.name === "AbortError") {
          throw new ApiError("The request timed out. Please try again.", 408);
        }
        if (method === "GET" && transientRetries < 1) {
          transientRetries += 1;
          continue;
        }
        throw new ApiError("The service is temporarily unavailable. Check your connection and try again.", 0);
      } finally {
        clearTimeout(timeout);
      }
    }
  }

  get<T>(path: string): Promise<T> { return this.request<T>("GET", path); }
  post<T>(path: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
    return this.request<T>("POST", path, body, options);
  }
  patch<T>(path: string, body?: unknown): Promise<T> { return this.request<T>("PATCH", path, body); }
  put<T>(path: string, body?: unknown): Promise<T> { return this.request<T>("PUT", path, body); }
  delete<T>(path: string): Promise<T> { return this.request<T>("DELETE", path); }
}
export const api = new ApiClient(API_BASE);

export const authApi = {
  login: (email: string, password: string) =>
    api.post<any>("/api/v1/auth/login", { email, password }, { auth: false }),
  signup: (email: string, password: string, full_name: string) =>
    api.post<any>("/api/v1/auth/signup", { email, password, full_name }, { auth: false }),
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
  downloadPDF: (id: string) => downloadAuthenticatedFile("/api/v1/companies/" + encodeURIComponent(id) + "/compliance-pdf", "NLC_Compliance_Report_" + id + ".pdf"),
};

export const filingsApi = {
  createAGM: (data: any) => api.post<any>("/api/v1/filings/agm", data),
  createAudit: (data: any) => api.post<any>("/api/v1/filings/audit", data),
  createReturn: (data: any) => api.post<any>("/api/v1/filings/annual-return", data),
  agms: (companyId: string) => api.get<any>("/api/v1/filings/agm/" + companyId),
  audits: (companyId: string) => api.get<any>("/api/v1/filings/audit/" + companyId),
  annualReturns: (companyId: string) => api.get<any>("/api/v1/filings/annual-return/" + companyId),
  portfolio: () => api.get<{ agms: any[]; audits: any[]; annual_returns: any[] }>("/api/v1/filings"),
  listAGM: (companyId?: string) => companyId
    ? api.get<any>("/api/v1/filings/agm/" + encodeURIComponent(companyId))
    : api.get<{ agms: any[] }>("/api/v1/filings").then((data) => data.agms),
  listAudit: (companyId?: string) => companyId
    ? api.get<any>("/api/v1/filings/audit/" + encodeURIComponent(companyId))
    : api.get<{ audits: any[] }>("/api/v1/filings").then((data) => data.audits),
  listAnnualReturn: (companyId?: string) => companyId
    ? api.get<any>("/api/v1/filings/annual-return/" + encodeURIComponent(companyId))
    : api.get<{ annual_returns: any[] }>("/api/v1/filings").then((data) => data.annual_returns),
  listRegisters: (companyId: string) => api.get<any>("/api/v1/filings/statutory-register/" + encodeURIComponent(companyId)),
  list: () => api.get<{ agms: any[]; audits: any[]; annual_returns: any[] }>("/api/v1/filings"),
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
  upload: (companyId: string, file: File) => uploadAuthenticatedFile("/api/v1/companies/" + encodeURIComponent(companyId) + "/articles-document", file),
};

export const documentsApi = {
  list: () => api.get<any>("/api/v1/documents"),
  templates: () => api.get<any>("/api/v1/documents/templates"),
  listByCompany: (companyId: string) => api.get<any>("/api/v1/documents/" + companyId),
  generate: (data: any) => api.post<any>("/api/v1/documents/generate", data),
  approve: (id: string, data: { approval_note?: string | null } = {}) => api.post<any>("/api/v1/documents/detail/" + encodeURIComponent(id) + "/approve", data),
  release: (id: string, data: { release_note?: string | null; notify_client?: boolean } = {}) => api.post<any>("/api/v1/documents/detail/" + encodeURIComponent(id) + "/release", data),
  detail: (id: string) => api.get<any>("/api/v1/documents/detail/" + id),
  downloadPdf: async (id: string) => {
    const result = await api.get<{ download_url: string; expires_in_seconds: number }>("/api/v1/documents/detail/" + encodeURIComponent(id) + "/pdf");
    if (!result?.download_url) throw new ApiError("The document download URL was not returned.", 502);
    const link = document.createElement("a");
    link.href = result.download_url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
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
};

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
    method: "BANK_TRANSFER" | "CASH" | "CHEQUE";
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
};

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
