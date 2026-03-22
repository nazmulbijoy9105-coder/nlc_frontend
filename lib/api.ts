import axios, { AxiosInstance, AxiosError } from 'axios'
import Cookies from 'js-cookie'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://nlc-backend.vercel.app'

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
    api.post('/auth/verify-totp', { temp_token, totp_code }),

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
    api.get('/filings', { params }),

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

  draft: (data: Record<string, unknown>) => api.post('/documents/draft', data),

  approve: (id: string) => api.post(`/documents/${id}/approve`),

  download: (id: string) => api.get(`/documents/${id}/download`, { responseType: 'blob' }),
}

// ── Rescue ────────────────────────────────────────────────────────────────────
export const rescueApi = {
  pipeline: () => api.get('/rescue/pipeline'),

  get: (id: string) => api.get(`/rescue/${id}`),

  updatePlan: (id: string, data: Record<string, unknown>) =>
    api.patch(`/rescue/${id}`, data),
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const dashboardApi = {
  stats: () => api.get('/admin/dashboard-stats'),
  recentActivity: () => api.get('/admin/activity-log'),
  upcomingDeadlines: () => api.get('/filings/upcoming-deadlines'),
}
