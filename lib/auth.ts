import Cookies from 'js-cookie'

const ACCESS_TOKEN = 'nlc_access_token'
const REFRESH_TOKEN = 'nlc_refresh_token'
const TEMP_TOKEN = 'nlc_temp_token'
const USER_KEY = 'nlc_user'

export const setTokens = (access: string, refresh: string) => {
  Cookies.set(ACCESS_TOKEN, access, { expires: 1, sameSite: 'strict' })
  Cookies.set(REFRESH_TOKEN, refresh, { expires: 7, sameSite: 'strict' })
}

export const setTempToken = (token: string) => {
  Cookies.set(TEMP_TOKEN, token, { expires: 1 / 288, sameSite: 'strict' }) // 5 minutes
}

export const getTempToken = () => Cookies.get(TEMP_TOKEN) || ''

export const getAccessToken = () => Cookies.get(ACCESS_TOKEN) || ''

export const clearAuth = () => {
  Cookies.remove(ACCESS_TOKEN)
  Cookies.remove(REFRESH_TOKEN)
  Cookies.remove(TEMP_TOKEN)
  if (typeof window !== 'undefined') localStorage.removeItem(USER_KEY)
}

export const isAuthenticated = () => !!Cookies.get(ACCESS_TOKEN)

export const setUser = (user: Record<string, unknown>) => {
  if (typeof window !== 'undefined')
    localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export const getUser = () => {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(USER_KEY)
  return raw ? JSON.parse(raw) : null
}
