import Cookies from 'js-cookie'
import { API_BASE } from '@/lib/api-config'

const ACCESS_TOKEN = 'nlc_access_token'
const REFRESH_TOKEN = 'nlc_refresh_token'
const TEMP_TOKEN = 'nlc_temp_token'
const USER_KEY = 'nlc_user'

export class AuthRefreshError extends Error {
  constructor(public readonly status: number) {
    super("Authentication service is temporarily unavailable.");
    this.name = "AuthRefreshError";
  }
}

const cookieOptions = () => ({
  path: '/',
  sameSite: 'lax' as const,
  secure: typeof window !== 'undefined' && window.location.protocol === 'https:',
})

function decodeJwtPayload(token: string): { exp?: number } | null {
  const [, payload] = token.split('.')
  if (!payload || typeof window === 'undefined') return null
  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    return JSON.parse(window.atob(padded))
  } catch {
    return null
  }
}

function removeStoredAuth() {
  Cookies.remove(ACCESS_TOKEN, { path: '/' })
  Cookies.remove(REFRESH_TOKEN, { path: '/' })
  Cookies.remove(TEMP_TOKEN, { path: '/' })
  if (typeof window !== 'undefined') {
    localStorage.removeItem(ACCESS_TOKEN)
    localStorage.removeItem(REFRESH_TOKEN)
    localStorage.removeItem(USER_KEY)
  }
}

export const getValidAccessToken = async (): Promise<string> => {
  if (typeof window === 'undefined') return ''
  const token = (localStorage.getItem(ACCESS_TOKEN) || Cookies.get(ACCESS_TOKEN) || '').trim()
  if (!token || token === 'undefined' || token === 'null') {
    if (token) removeStoredAuth()
    return await refreshToken()
  }
  const parts = token.split('.')
  const payload = parts.length === 3 && parts.every(Boolean) ? decodeJwtPayload(token) : null
  if (!payload) {
    removeStoredAuth()
    return ''
  }
  // Token still valid — return it
  if (typeof payload.exp === 'number' && payload.exp > Math.floor(Date.now() / 1000) + 30) {
    localStorage.setItem(ACCESS_TOKEN, token)
    Cookies.set(ACCESS_TOKEN, token, { ...cookieOptions(), expires: 1 })
    return token
  }
  // Token expired — try to refresh BEFORE clearing auth
  const refreshed = await refreshToken()
  return refreshed || ''
}



let refreshPromise: Promise<string> | null = null

export const refreshToken = async (): Promise<string> => {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    const token = getRefreshToken()
    if (!token) {
      clearAuth()
      return ''
    }

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 15000)
      const res = await fetch(API_BASE + '/api/v1/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        signal: controller.signal,
        body: JSON.stringify({ refresh_token: token }),
      })

      }).finally(() => clearTimeout(timeout))
      if (!res.ok) {
        if (res.status === 429 || res.status >= 500) {
          throw new AuthRefreshError(res.status)
        }
        // A definitive client error means the refresh credential is no longer usable.
        clearAuth()
        return ''
      }

      const data = await res.json()
      if (typeof data?.access_token !== 'string' || !data.access_token ||
          typeof data?.refresh_token !== 'string' || !data.refresh_token) {
        clearAuth()
        return ''
      }

      setTokens(data.access_token, data.refresh_token)
      return data.access_token
    } catch (error) {
      if (error instanceof AuthRefreshError) throw error
      // Network failures and malformed transient responses must not destroy a valid session.
      throw new AuthRefreshError(503)
    }
  })()

  try {
    return await refreshPromise
  } finally {
    refreshPromise = null
  }
}
export const getRefreshToken = () =>
  typeof window !== 'undefined'
    ? (localStorage.getItem(REFRESH_TOKEN) || Cookies.get(REFRESH_TOKEN) || '')
    : ''

export const setTokens = (access: string, refresh: string) => {
  Cookies.set(ACCESS_TOKEN, access, { ...cookieOptions(), expires: 1 })
  Cookies.set(REFRESH_TOKEN, refresh, { ...cookieOptions(), expires: 7 })
  if (typeof window !== 'undefined') {
    localStorage.setItem(ACCESS_TOKEN, access)
    localStorage.setItem(REFRESH_TOKEN, refresh)
  }
}

export const setTempToken = (token: string) => {
  Cookies.set(TEMP_TOKEN, token, { path: '/', sameSite: 'strict', expires: 1 / 288 })
}

export const getTempToken = () => Cookies.get(TEMP_TOKEN) || ''

export const clearTempToken = () => Cookies.remove(TEMP_TOKEN, { path: '/' })

export const clearAuth = () => removeStoredAuth()

export const isAuthenticated = async (): Promise<boolean> => {
  const token = await getValidAccessToken()
  return Boolean(token)
}

export const setUser = (user: Record<string, unknown>) => {
  if (typeof window !== 'undefined')
    localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export const getUser = () => {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    localStorage.removeItem(USER_KEY)
    return null
  }
}
