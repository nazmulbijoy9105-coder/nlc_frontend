import Cookies from 'js-cookie'

const ACCESS_TOKEN = 'nlc_access_token'
const REFRESH_TOKEN = 'nlc_refresh_token'
const TEMP_TOKEN = 'nlc_temp_token'
const USER_KEY = 'nlc_user'

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

export const getValidAccessToken = () => {
  if (typeof window === 'undefined') return ''
  const token = (localStorage.getItem(ACCESS_TOKEN) || Cookies.get(ACCESS_TOKEN) || '').trim()
  if (!token || token === 'undefined' || token === 'null') {
    if (token) removeStoredAuth()
    return ''
  }
  const parts = token.split('.')
  const payload = parts.length === 3 && parts.every(Boolean) ? decodeJwtPayload(token) : null
  if (!payload) {
    removeStoredAuth()
    return ''
  }
  if (typeof payload.exp !== 'number' || payload.exp <= Math.floor(Date.now() / 1000) + 30) {
    removeStoredAuth()
    return ''
  }
  localStorage.setItem(ACCESS_TOKEN, token)
  Cookies.set(ACCESS_TOKEN, token, { ...cookieOptions(), expires: 1 })
  return token
}

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

export const clearAuth = () => removeStoredAuth()

export const isAuthenticated = () => !!getValidAccessToken()

export const setUser = (user: Record<string, unknown>) => {
  if (typeof window !== 'undefined')
    localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export const getUser = () => {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(USER_KEY)
  return raw ? JSON.parse(raw) : null
}
