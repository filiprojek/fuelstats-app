import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import AuthCallbackView from '@/views/AuthCallbackView.vue'
import { useAuthStore } from '@/stores/auth'
import { makeRouter } from '@/test/utils'

const apiMock = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('@/lib/api', () => ({ default: apiMock }))

async function mountWithHash(hash: string) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = makeRouter([{ path: '/auth/callback', name: 'auth-callback', component: AuthCallbackView }])
  await router.push(`/auth/callback${hash}`)
  await router.isReady()
  const wrapper = mount(AuthCallbackView, { global: { plugins: [router, pinia] } })
  await flushPromises()
  return { wrapper, router }
}

describe('AuthCallbackView', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    apiMock.get.mockReset()
  })

  it('stores a remembered token, loads the user and goes home', async () => {
    apiMock.get.mockResolvedValue({ data: { id: 'u1', email: 'a@b.com', username: 'a' } })
    const { router } = await mountWithHash('#token=jwt123&remember=1')

    expect(localStorage.getItem('token')).toBe('jwt123')
    expect(apiMock.get).toHaveBeenCalledWith('/user/me')
    expect(useAuthStore().user).toMatchObject({ id: 'u1' })
    expect(router.currentRoute.value.fullPath).toBe('/')
  })

  it('keeps a session that is not remembered in sessionStorage', async () => {
    apiMock.get.mockResolvedValue({ data: { id: 'u1', email: 'a@b.com', username: 'a' } })
    await mountWithHash('#token=jwt123')
    expect(sessionStorage.getItem('token')).toBe('jwt123')
    expect(localStorage.getItem('token')).toBeNull()
  })

  it('sends errors to the login page', async () => {
    const { router } = await mountWithHash('#error=signup_disabled')
    expect(router.currentRoute.value.path).toBe('/login')
    expect(router.currentRoute.value.hash).toBe('#error=signup_disabled')
    expect(localStorage.getItem('token')).toBeNull()
  })

  it('treats a missing token as an error', async () => {
    const { router } = await mountWithHash('')
    expect(router.currentRoute.value.fullPath).toBe('/login#error=sso_failed')
  })

  it('drops the token again if the profile cannot be loaded', async () => {
    apiMock.get.mockRejectedValue(new Error('401'))
    const { router } = await mountWithHash('#token=bad')
    expect(localStorage.getItem('token')).toBeNull()
    expect(sessionStorage.getItem('token')).toBeNull()
    expect(router.currentRoute.value.fullPath).toBe('/login#error=sso_failed')
  })

  it('shows a progress message', async () => {
    apiMock.get.mockReturnValue(new Promise(() => {}))
    const { wrapper } = await mountWithHash('#token=jwt')
    expect(wrapper.text()).toContain('Signing you in')
  })
})
