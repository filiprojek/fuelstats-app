import api from '@/lib/api'

const TOKEN_KEY = 'token'
const REMEMBER_KEY = 'rememberMe'

/** Tokens older than this are renewed on the next navigation (sliding session) */
export const REFRESH_AFTER_MS = 12 * 60 * 60 * 1000

// Storage can be unavailable (private mode, blocked site data); never let that break the app
function read(storage: Storage, key: string): string | null {
  try {
    return storage.getItem(key)
  } catch {
    return null
  }
}

function write(storage: Storage, key: string, value: string | null) {
  try {
    if (value === null) storage.removeItem(key)
    else storage.setItem(key, value)
  } catch {
    // ignore
  }
}

export function getToken(): string | null {
  return read(localStorage, TOKEN_KEY) ?? read(sessionStorage, TOKEN_KEY)
}

/**
 * Remembered tokens survive closing the browser (localStorage); others last
 * only for the browser session (sessionStorage).
 */
export function setToken(token: string, remember: boolean) {
  write(remember ? localStorage : sessionStorage, TOKEN_KEY, token)
  write(remember ? sessionStorage : localStorage, TOKEN_KEY, null)
}

export function clearToken() {
  write(localStorage, TOKEN_KEY, null)
  write(sessionStorage, TOKEN_KEY, null)
}

/** "Remember me" checkbox state, on by default */
export function getRememberPreference(): boolean {
  return read(localStorage, REMEMBER_KEY) !== 'false'
}

export function setRememberPreference(remember: boolean) {
  write(localStorage, REMEMBER_KEY, String(remember))
}

/** Issue time of a JWT in ms, or null when it can't be read */
export function tokenIssuedAt(token: string): number | null {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
    return typeof json.iat === 'number' ? json.iat * 1000 : null
  } catch {
    return null
  }
}

let pending: Promise<boolean> | null = null

/**
 * Renew the session token once it is older than REFRESH_AFTER_MS, so active
 * users are never signed out. Failures keep the current token.
 */
export function refreshSession(now = Date.now()): Promise<boolean> {
  const token = getToken()
  if (!token) return Promise.resolve(false)
  const issuedAt = tokenIssuedAt(token)
  if (issuedAt !== null && now - issuedAt < REFRESH_AFTER_MS) return Promise.resolve(false)

  pending ??= api
    .post('/auth/refresh')
    .then((res) => {
      if (!res.data?.token) return false
      setToken(res.data.token, res.data.remember === true)
      return true
    })
    .catch(() => false)
    .finally(() => {
      pending = null
    })
  return pending
}
