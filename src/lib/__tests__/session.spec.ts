import { describe, it, expect, beforeEach, vi } from 'vitest'

const apiMock = vi.hoisted(() => ({ post: vi.fn() }))
vi.mock('@/lib/api', () => ({ default: apiMock }))

import {
  getToken,
  setToken,
  clearToken,
  getRememberPreference,
  setRememberPreference,
  tokenIssuedAt,
  refreshSession,
  REFRESH_AFTER_MS,
} from '@/lib/session'

/** unsigned JWT with the given payload (the app never verifies signatures) */
const fakeJwt = (payload: Record<string, unknown>) =>
  ['e30', btoa(JSON.stringify(payload)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_'), 'sig'].join('.')

const NOW = Date.UTC(2026, 9, 18, 12)
const issuedAgo = (ms: number) => fakeJwt({ sub: 'u1', iat: Math.floor((NOW - ms) / 1000) })

describe('session storage', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    apiMock.post.mockReset()
  })

  it('keeps remembered tokens in localStorage', () => {
    setToken('abc', true)
    expect(localStorage.getItem('token')).toBe('abc')
    expect(sessionStorage.getItem('token')).toBeNull()
    expect(getToken()).toBe('abc')
  })

  it('keeps other tokens in sessionStorage only', () => {
    localStorage.setItem('token', 'old')
    setToken('abc', false)
    expect(localStorage.getItem('token')).toBeNull()
    expect(sessionStorage.getItem('token')).toBe('abc')
    expect(getToken()).toBe('abc')
  })

  it('moves a session token to localStorage when it becomes remembered', () => {
    setToken('abc', false)
    setToken('def', true)
    expect(sessionStorage.getItem('token')).toBeNull()
    expect(getToken()).toBe('def')
  })

  it('clears the token everywhere', () => {
    localStorage.setItem('token', 'a')
    sessionStorage.setItem('token', 'b')
    clearToken()
    expect(getToken()).toBeNull()
  })

  it('survives unavailable storage', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(getToken()).toBeNull()
    expect(() => setToken('a', true)).not.toThrow()
    expect(() => clearToken()).not.toThrow()
    expect(getRememberPreference()).toBe(true)
    expect(() => setRememberPreference(false)).not.toThrow()
  })

  it('remembers by default and stores the preference', () => {
    expect(getRememberPreference()).toBe(true)
    setRememberPreference(false)
    expect(getRememberPreference()).toBe(false)
    setRememberPreference(true)
    expect(getRememberPreference()).toBe(true)
  })
})

describe('tokenIssuedAt', () => {
  it('reads iat from the payload in milliseconds', () => {
    expect(tokenIssuedAt(fakeJwt({ iat: 1700000000 }))).toBe(1700000000000)
  })

  it('returns null for malformed tokens', () => {
    expect(tokenIssuedAt('nope')).toBeNull()
    expect(tokenIssuedAt('a.%%%.c')).toBeNull()
    expect(tokenIssuedAt(fakeJwt({ sub: 'x' }))).toBeNull()
  })
})

describe('refreshSession', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    apiMock.post.mockReset()
  })

  it('does nothing without a token', async () => {
    await expect(refreshSession(NOW)).resolves.toBe(false)
    expect(apiMock.post).not.toHaveBeenCalled()
  })

  it('does nothing while the token is fresh', async () => {
    setToken(issuedAgo(REFRESH_AFTER_MS - 60000), true)
    await expect(refreshSession(NOW)).resolves.toBe(false)
    expect(apiMock.post).not.toHaveBeenCalled()
  })

  it('renews an older remembered token', async () => {
    setToken(issuedAgo(REFRESH_AFTER_MS + 60000), true)
    apiMock.post.mockResolvedValue({ data: { token: 'new', remember: true } })
    await expect(refreshSession(NOW)).resolves.toBe(true)
    expect(apiMock.post).toHaveBeenCalledWith('/auth/refresh')
    expect(localStorage.getItem('token')).toBe('new')
  })

  it('keeps a renewed session token in sessionStorage', async () => {
    setToken(issuedAgo(REFRESH_AFTER_MS + 60000), false)
    apiMock.post.mockResolvedValue({ data: { token: 'new', remember: false } })
    await refreshSession(NOW)
    expect(sessionStorage.getItem('token')).toBe('new')
    expect(localStorage.getItem('token')).toBeNull()
  })

  it('renews tokens without a readable issue time', async () => {
    setToken('opaque', true)
    apiMock.post.mockResolvedValue({ data: { token: 'new', remember: true } })
    await expect(refreshSession(NOW)).resolves.toBe(true)
  })

  it('keeps the current token when the refresh fails', async () => {
    const token = issuedAgo(REFRESH_AFTER_MS + 60000)
    setToken(token, true)
    apiMock.post.mockRejectedValue(new Error('offline'))
    await expect(refreshSession(NOW)).resolves.toBe(false)
    expect(getToken()).toBe(token)
  })

  it('ignores responses without a token', async () => {
    const token = issuedAgo(REFRESH_AFTER_MS + 60000)
    setToken(token, true)
    apiMock.post.mockResolvedValue({ data: {} })
    await expect(refreshSession(NOW)).resolves.toBe(false)
    expect(getToken()).toBe(token)
  })

  it('sends a single request for concurrent calls', async () => {
    setToken(issuedAgo(REFRESH_AFTER_MS + 60000), true)
    let resolve!: (v: unknown) => void
    apiMock.post.mockReturnValue(new Promise((r) => (resolve = r)))
    const a = refreshSession(NOW)
    const b = refreshSession(NOW)
    resolve({ data: { token: 'new', remember: true } })
    await expect(Promise.all([a, b])).resolves.toEqual([true, true])
    expect(apiMock.post).toHaveBeenCalledTimes(1)
  })
})
