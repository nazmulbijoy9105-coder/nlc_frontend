import axios, { AxiosInstance, AxiosError } from 'axios'
import Cookies from 'js-cookie'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://nlc-platform.onrender.com'

const api: AxiosInstance = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = Cookies.get('nlc_access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 — redirect to login
api.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      Cookies.remove('nlc_access_token')
      Cookies.remove('nlc_refresh_token')
      if (typeof window !== 'undefined') window.location.href = '/'
    }
    return Promise.reject(error)
  }
)

export default api

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  verify2FA: (temp_token: string, totp_code: string) =>
    api.post('/auth/2fa/verify', { temp_token, totp_code }),
  refresh: (refresh_token: string) =>
    api.post('/auth/refresh', { refresh_token }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
}

// ── Companies ─────────────────────────────────────────────────────────────────
export const companiesApi = {
  list: (params?: { page?: number; size?: number; band?: string }) =>
    api.get('/companies', { params }),
  get: (id: string) => api.get(`/companies/${id}`),
  create: (data: Record<string, unknown>) => api.post('/companies', data),
  evaluate: (id: string) => api.post(`/companies/${id}/evaluate`),
  modules: (id: string) => api.get(`/companies/${id}/module-scores`),
  violations: (id: string) => api.get(`/companies/${id}/violations`),
}

// ── Filings ───────────────────────────────────────────────────────────────────
export const filingsApi = {
  list: (params?: { company_id?: string; status?: string }) =>
    api.get('/filings/agm', { params }),
  get: (id: string) => api.get(`/filings/${id}`),
  create: (data: Record<string, unknown>) => api.post('/filings', data),
  updateStatus: (id: string, status: string) =>
    api.patch(`/filings/${id}/status`, { status }),
}

// ── Documents ─────────────────────────────────────────────────────────────────
export const documentsApi = {
  list: (params?: { company_id?: string; status?: string }) =>
    api.get('/documents', { params }),
  get: (id: string) => api.get(`/documents/${id}`),
  draft: (data: Record<string, unknown>) => api.post('/documents/generate', data),
  approve: (id: string) => api.post(`/documents/${id}/approve`),
  download: (id: string) => api.get(`/documents/${id}/download`, { responseType: 'blob' }),
}

// ── Rescue ────────────────────────────────────────────────────────────────────
export const rescueApi = {
  pipeline: () => api.get('/rescue/plans'),
  get: (id: string) => api.get(`/rescue/${id}`),
  updatePlan: (id: string, data: Record<string, unknown>) =>
    api.patch(`/rescue/${id}`, data),
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const dashboardApi = {
  stats: () => api.get('/companies/dashboard/kpis'),
  recentActivity: () => api.get('/admin/logs/recent'),
  upcomingDeadlines: () => api.get('/filings/agm/upcoming'),
}

// ── Native Fetch Client (For Login Page) ──────────────────────────────────────
class NativeApiClient {
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

  async get<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, { method: "GET", headers: this.getHeaders(), credentials: "include" });
    if (!res.ok) { const err = await res.json().catch(() => ({ detail: "Request failed" })); throw new Error(err.detail || `HTTP ${res.status}`); }
    return res.json();
  }
}

export const nativeApi = new NativeApiClient(BASE_URL);
