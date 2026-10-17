import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { defineComponent, h } from 'vue'

const apiMock = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('@/lib/api', () => ({ default: apiMock }))
vi.mock('@/views/HomeView.vue', () => ({ default: defineComponent({ render: () => h('div', 'home') }) }))

async function freshRouter() {
  vi.resetModules()
  const { default: router } = await import('@/router')
  return router
}

describe('router auth guard', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    apiMock.get.mockReset()
  })

  it('redirects to /login when not authenticated', async () => {
    apiMock.get.mockRejectedValue(new Error('401'))
    const router = await freshRouter()
    await router.push('/')
    expect(router.currentRoute.value.path).toBe('/login')
  })

  it('allows protected routes when /user/me succeeds', async () => {
    apiMock.get.mockResolvedValue({ data: { id: 1, email: 'a@b.com', username: 'a' } })
    const router = await freshRouter()
    await router.push('/')
    expect(router.currentRoute.value.path).toBe('/')
    expect(apiMock.get).toHaveBeenCalledWith('/user/me')
  })

  it('checks the session only once', async () => {
    apiMock.get.mockResolvedValue({ data: { id: 1, email: 'a@b.com', username: 'a' } })
    const router = await freshRouter()
    await router.push('/')
    await router.push('/login')
    await router.push('/')
    expect(apiMock.get).toHaveBeenCalledTimes(1)
  })

  it('lets anonymous users open public routes', async () => {
    apiMock.get.mockRejectedValue(new Error('401'))
    const router = await freshRouter()
    await router.push('/signup')
    expect(router.currentRoute.value.path).toBe('/signup')
  })

  it('exposes the public SSO callback route without navigation chrome', async () => {
    apiMock.get.mockRejectedValue(new Error('401'))
    const router = await freshRouter()
    const route = router.resolve('/auth/callback')
    expect(route.name).toBe('auth-callback')
    expect(route.meta).toMatchObject({ hideNav: true, hideHeader: true })
    expect(route.meta.requiresAuth).toBeFalsy()
  })
})
