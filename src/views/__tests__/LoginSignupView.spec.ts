import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import LoginSignupView from '@/views/LoginSignupView.vue'
import { useAuthStore } from '@/stores/auth'
import { makeRouter, axiosError } from '@/test/utils'

const apiMock = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }))
vi.mock('@/lib/api', () => ({ default: apiMock }))

const providers = [
  { id: 'authelia', name: 'Authelia' },
  { id: 'google', name: 'Google' },
]

async function mountAt(path: string) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = makeRouter()
  await router.push(path)
  await router.isReady()
  const wrapper = mount(LoginSignupView, { global: { plugins: [router, pinia] }, attachTo: document.body })
  await flushPromises()
  return { wrapper, router }
}

describe('LoginSignupView', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
    apiMock.get.mockReset()
    apiMock.post.mockReset()
    apiMock.get.mockImplementation(async (url: string) => {
      if (url === '/user/me') return { data: { id: 1, email: 'a@b.com', username: 'a' } }
      return { data: [] }
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  describe('login', () => {
    it('renders the login form', async () => {
      const { wrapper } = await mountAt('/login')
      expect(wrapper.find('h2').text()).toBe('Login to Fuel Stats')
      expect(wrapper.find('#btn-login').exists()).toBe(true)
      expect(wrapper.find('#username').exists()).toBe(false)
    })

    it('signs in, stores the token, loads the user and navigates home', async () => {
      apiMock.post.mockResolvedValue({ data: { token: 'jwt-token' } })
      const { wrapper, router } = await mountAt('/login')

      await wrapper.find('#email').setValue('a@b.com')
      await wrapper.find('#password').setValue('secret')
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(apiMock.post).toHaveBeenCalledWith('/auth/signin', { email: 'a@b.com', password: 'secret' })
      expect(localStorage.getItem('token')).toBe('jwt-token')
      expect(useAuthStore().user).toEqual({ id: 1, email: 'a@b.com', username: 'a' })
      expect(wrapper.text()).toContain("You're logged in")

      vi.advanceTimersByTime(600)
      await flushPromises()
      expect(router.currentRoute.value.path).toBe('/')
    })

    it('shows the server error message on failure', async () => {
      apiMock.post.mockRejectedValue(axiosError(401, { error: 'Invalid credentials' }))
      const { wrapper, router } = await mountAt('/login')

      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(wrapper.text()).toContain('Login error')
      expect(wrapper.text()).toContain('Invalid credentials')
      expect(localStorage.getItem('token')).toBeNull()
      expect(router.currentRoute.value.path).toBe('/login')
    })
  })

  describe('signup', () => {
    it('renders the signup form', async () => {
      const { wrapper } = await mountAt('/signup')
      expect(wrapper.find('h2').text()).toBe('Create your Fuel Stats account')
      expect(wrapper.find('#username').exists()).toBe(true)
    })

    it('creates the account and redirects to login', async () => {
      apiMock.post.mockResolvedValue({ data: { user: {} } })
      const { wrapper, router } = await mountAt('/signup')

      await wrapper.find('#username').setValue('bob')
      await wrapper.find('#email').setValue('bob@example.com')
      await wrapper.find('#password').setValue('secret')
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(apiMock.post).toHaveBeenCalledWith('/auth/signup', { username: 'bob', email: 'bob@example.com', password: 'secret' })
      expect(wrapper.text()).toContain('Account created')

      vi.advanceTimersByTime(1300)
      await flushPromises()
      expect(router.currentRoute.value.path).toBe('/login')
    })

    it('shows an error when signup fails', async () => {
      apiMock.post.mockRejectedValue(axiosError(409, { error: 'Email already in use' }))
      const { wrapper } = await mountAt('/signup')
      await wrapper.find('form').trigger('submit')
      await flushPromises()
      expect(wrapper.text()).toContain('Signup error')
      expect(wrapper.text()).toContain('Email already in use')
    })
  })

  describe('single sign-on', () => {
    beforeEach(() => {
      apiMock.get.mockImplementation(async (url: string) => {
        if (url === '/auth/providers') return { data: providers }
        return { data: { id: 1, email: 'a@b.com', username: 'a' } }
      })
    })

    it.each(['/login', '/signup'])('shows a button per provider on %s', async (path) => {
      const { wrapper } = await mountAt(path)
      const links = wrapper.findAll('a.sso-button')
      expect(links.map((l) => l.find('.sso-label').text())).toEqual(['Continue with Authelia', 'Continue with Google'])
      expect(links[0]!.attributes('href')).toBe('http://api.test/api/v1/auth/oidc/authelia/start')
    })

    it('hides the SSO block when no providers are configured', async () => {
      apiMock.get.mockImplementation(async () => ({ data: [] }))
      const { wrapper } = await mountAt('/login')
      expect(wrapper.find('.sso').exists()).toBe(false)
    })

    it('shows an SSO error passed back in the url hash', async () => {
      const { wrapper } = await mountAt('/login#error=account_exists_unverified')
      expect(wrapper.text()).toContain('Single sign-on failed')
      expect(wrapper.text()).toMatch(/password/i)
    })
  })
})

