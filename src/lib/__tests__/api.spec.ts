import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import type { InternalAxiosRequestConfig, AxiosResponse } from 'axios'

const routerMock = vi.hoisted(() => ({
  currentRoute: { value: { name: 'home' as string } },
  push: vi.fn(),
}))
vi.mock('@/router', () => ({ default: routerMock }))

import api from '@/lib/api'
import { useAuthStore } from '@/stores/auth'

type Handler = (config: InternalAxiosRequestConfig) => Promise<AxiosResponse>

function useAdapter(handler: Handler) {
  api.defaults.adapter = handler
}

const ok = (config: InternalAxiosRequestConfig, data: unknown = {}): AxiosResponse => ({
  data,
  status: 200,
  statusText: 'OK',
  headers: {},
  config,
})

const fail = (config: InternalAxiosRequestConfig, status: number) =>
  Promise.reject(
    Object.assign(new Error(`status ${status}`), {
      isAxiosError: true,
      config,
      response: { status, data: {}, headers: {}, config, statusText: '' },
    }),
  )

describe('api client', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    routerMock.push.mockReset()
    routerMock.currentRoute.value.name = 'home'
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  it('uses VITE_API as base url and sends credentials', () => {
    expect(api.defaults.baseURL).toBe('http://api.test/api/v1')
    expect(api.defaults.withCredentials).toBe(true)
  })

  it('adds the bearer token from localStorage', async () => {
    localStorage.setItem('token', 'abc')
    let seen: InternalAxiosRequestConfig | undefined
    useAdapter(async (config) => {
      seen = config
      return ok(config)
    })
    await api.get('/user/me')
    expect(seen?.headers.Authorization).toBe('Bearer abc')
  })

  it('sends no Authorization header without a token', async () => {
    let seen: InternalAxiosRequestConfig | undefined
    useAdapter(async (config) => {
      seen = config
      return ok(config)
    })
    await api.get('/user/me')
    expect(seen?.headers.Authorization).toBeUndefined()
  })

  it('on 401 clears auth, removes the token and redirects to login', async () => {
    localStorage.setItem('token', 'abc')
    const auth = useAuthStore()
    auth.setUser({ id: 1, email: 'a@b.com', username: 'a' })
    useAdapter((config) => fail(config, 401))

    await expect(api.get('/vehicles')).rejects.toBeTruthy()

    expect(auth.user).toBeNull()
    expect(localStorage.getItem('token')).toBeNull()
    expect(routerMock.push).toHaveBeenCalledWith('/login')
  })

  it.each(['login', 'signup'])('does not redirect when already on %s', async (name) => {
    routerMock.currentRoute.value.name = name
    useAdapter((config) => fail(config, 401))
    await expect(api.get('/user/me')).rejects.toBeTruthy()
    expect(routerMock.push).not.toHaveBeenCalled()
  })

  it.each(['/auth/signin', '/auth/signup'])('ignores 401 from %s', async (url) => {
    localStorage.setItem('token', 'keep')
    useAdapter((config) => fail(config, 401))
    await expect(api.post(url, {})).rejects.toBeTruthy()
    expect(localStorage.getItem('token')).toBe('keep')
    expect(routerMock.push).not.toHaveBeenCalled()
  })

  it('passes other errors through untouched', async () => {
    localStorage.setItem('token', 'keep')
    useAdapter((config) => fail(config, 500))
    await expect(api.get('/vehicles')).rejects.toMatchObject({ response: { status: 500 } })
    expect(localStorage.getItem('token')).toBe('keep')
  })
})
