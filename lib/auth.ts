import Cookies from 'js-cookie'
import { API_BASE } from '@/lib/api-config'

const ACCESS_TOKEN = 'nlc_access_token'
const LEGACY_REFRESH_TOKEN = 'nlc_refresh_token'
const TEMP_TOKEN = 'nlc_temp_token'
const USER_KEY = 'nlc_user'
export const AUTH_STATE_CHANGE_EVENT = 'nlc:auth-state-change'

export class AuthRefreshError extends Error {
  constructor(public readonly status: number) {
    super("Authentication service is temporarily unavailable.")
    this.name = "AuthRefreshError"
  }
}

function decodeJwtPayload(token: string): { exp?: number } | null {
  const [, payload] = token.split('.')
  if (!payload || typeof window === 'undefined') return null
  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    return JSON.parse(window.atob(padded))
  } catch { return null }
}

function removeStoredAuth() {
  Cookies.remove(ACCESS_TOKEN, { path: '/' })
  // Remove credentials written by older releases. New refresh credentials are
  // HttpOnly and cannot be read or deleted by browser JavaScript.
  Cookies.remove(LEGACY_REFRESH_TOKEN, { path: '/' })
  if (typeof window !== 'undefined') {
    localStorage.removeItem(ACCESS_TOKEN)
    localStorage.removeItem(LEGACY_REFRESH_TOKEN)
    localStorage.removeItem(USER_KEY)
    window.dispatchEvent(new Event(AUTH_STATE_CHANGE_EVENT))
  }
}

export const getValidAccessToken = async (): Promise<string> => {
  if (typeof window === 'undefined') return ''
  const token = (localStorage.getItem(ACCESS_TOKEN) || Cookies.get(ACCESS_TOKEN) || '').trim()
  if (token) {
    const payload = decodeJwtPayload(token)
    if (payload && typeof payload.exp === 'number' && payload.exp > Math.floor(Date.now() / 1000) + 30) return token
  }
  return refreshToken()
}

let refreshPromise: Promise<string> | null = null

export const refreshToken = async (): Promise<string> => {
  if (refreshPromise) return refreshPromise
  refreshPromise = (async () => {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 15000)
      const res = await fetch(API_BASE + '/api/v1/auth/refresh', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout))
      if (!res.ok) {
        if (res.status === 429 || res.status >= 500) throw new AuthRefreshError(res.status)
        clearAuth()
        return ''
      }
      const data = await res.json()
      if (typeof data?.access_token !== 'string' || !data.access_token) {
        throw new AuthRefreshError(502)
      }
      setTokens(data.access_token)
      return data.access_token
    } catch (error) {
      if (error instanceof AuthRefreshError) throw error
      throw new AuthRefreshError(503)
    }
  })()
  try { return await refreshPromise }
  finally { refreshPromise = null }
}

// Refresh tokens are deliberately not readable from JavaScript.
export const getRefreshToken = (): string => ''

export const setTokens = (access: string) => {
  Cookies.set(ACCESS_TOKEN, access, {
    path: '/',
    sameSite: 'lax',
    secure: typeof window !== 'undefined' && window.location.protocol === 'https:',
    expires: 1,
  })
  if (typeof window !== 'undefined') {
    localStorage.setItem(ACCESS_TOKEN, access)
    localStorage.removeItem(LEGACY_REFRESH_TOKEN)
  }
}

export const setTempToken = (token: string) => {
  Cookies.set(TEMP_TOKEN, token, { path: '/', sameSite: 'strict', expires: 1 / 288 })
}
export const getTempToken = () => Cookies.get(TEMP_TOKEN) || ''
export const clearTempToken = () => Cookies.remove(TEMP_TOKEN, { path: '/' })
export const clearAuth = () => removeStoredAuth()

export const isAuthenticated = async (): Promise<boolean> => Boolean(await getValidAccessToken())

export const setUser = (user: Record<string, unknown>) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    window.dispatchEvent(new Event(AUTH_STATE_CHANGE_EVENT))
  }
}
export const getUser = () => {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try { return JSON.parse(raw) }
  catch { localStorage.removeItem(USER_KEY); return null }
}
