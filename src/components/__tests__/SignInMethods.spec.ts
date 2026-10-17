import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import SignInMethods from '@/components/SignInMethods.vue'
import { useAuthStore, type User } from '@/stores/auth'
import { makeRouter, axiosError } from '@/test/utils'

const apiMock = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() }))
vi.mock('@/lib/api', () => ({ default: apiMock }))

const redirectMock = vi.hoisted(() => vi.fn())
vi.mock('@/lib/oidc', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/oidc')>()),
  redirectTo: redirectMock,
}))

const providers = [
  { id: 'authelia', name: 'Authelia' },
  { id: 'google', name: 'Google' },
]

const baseUser: User = { id: 'u1', email: 'a@b.com', username: 'a', hasPassword: true, identities: [] }

async function mountWith(user: User, hash = '') {
  const pinia = createPinia()
  setActivePinia(pinia)
  useAuthStore().setUser(user)
  const router = makeRouter()
  await router.push(`/settings${hash}`)
  await router.isReady()
  const wrapper = mount(SignInMethods, { global: { plugins: [router, pinia] } })
  await flushPromises()
  return { wrapper, router }
}

describe('SignInMethods', () => {
  beforeEach(() => {
    redirectMock.mockReset()
    for (const fn of Object.values(apiMock)) fn.mockReset()
    apiMock.get.mockImplementation(async (url: string) => {
      if (url === '/auth/providers') return { data: providers }
      return { data: baseUser }
    })
  })

  describe('providers', () => {
    it('lists providers with their link state', async () => {
      const { wrapper } = await mountWith({ ...baseUser, identities: [{ provider: 'authelia', email: 'a@b.com' }] })
      const rows = wrapper.findAll('.provider-row')
      expect(rows).toHaveLength(2)
      expect(rows[0]!.text()).toContain('Authelia')
      expect(rows[0]!.text()).toContain('Linked as a@b.com')
      expect(rows[0]!.find('.btn-unlink').exists()).toBe(true)
      expect(rows[1]!.text()).toContain('Not linked')
      expect(rows[1]!.find('.btn-link').exists()).toBe(true)
    })

    it('hides the provider list when the server has no providers', async () => {
      apiMock.get.mockImplementation(async () => ({ data: [] }))
      const { wrapper } = await mountWith(baseUser)
      expect(wrapper.find('.providers').exists()).toBe(false)
      expect(wrapper.find('form.password-form').exists()).toBe(true)
    })

    it('links a provider by requesting a link token and navigating to the start url', async () => {
      apiMock.post.mockResolvedValue({ data: { linkToken: 'lt' } })
      const { wrapper } = await mountWith(baseUser)

      await wrapper.findAll('.provider-row')[0]!.find('.btn-link').trigger('click')
      await flushPromises()

      expect(apiMock.post).toHaveBeenCalledWith('/auth/oidc/authelia/link')
      expect(redirectMock).toHaveBeenCalledWith('http://api.test/api/v1/auth/oidc/authelia/start?link=lt')
    })

    it('reports link failures', async () => {
      apiMock.post.mockRejectedValue(axiosError(404, { error: 'Unknown provider' }))
      const { wrapper } = await mountWith(baseUser)
      await wrapper.findAll('.provider-row')[0]!.find('.btn-link').trigger('click')
      await flushPromises()
      expect(wrapper.emitted('notify')?.[0]).toEqual(['danger', 'Could not link provider', 'Unknown provider'])
      expect(redirectMock).not.toHaveBeenCalled()
    })

    it('unlinks a provider and refreshes the profile', async () => {
      apiMock.delete.mockResolvedValue({ data: {} })
      const { wrapper } = await mountWith({ ...baseUser, identities: [{ provider: 'authelia' }] })

      await wrapper.find('.btn-unlink').trigger('click')
      await flushPromises()

      expect(apiMock.delete).toHaveBeenCalledWith('/user/identities/authelia')
      expect(apiMock.get).toHaveBeenCalledWith('/user/me')
      expect(useAuthStore().user?.identities).toEqual([])
      expect(wrapper.emitted('notify')?.[0]?.[0]).toBe('success')
    })

    it('disables unlinking the last sign-in method', async () => {
      const { wrapper } = await mountWith({ ...baseUser, hasPassword: false, identities: [{ provider: 'authelia' }] })
      expect(wrapper.find('.btn-unlink').attributes('disabled')).toBeDefined()
      expect(wrapper.text()).toContain('Set a password')
    })

    it('reports unlink failures', async () => {
      apiMock.delete.mockRejectedValue(axiosError(400, { error: 'last method' }))
      const { wrapper } = await mountWith({ ...baseUser, identities: [{ provider: 'authelia' }] })
      await wrapper.find('.btn-unlink').trigger('click')
      await flushPromises()
      expect(wrapper.emitted('notify')?.[0]).toEqual(['danger', 'Could not unlink provider', 'last method'])
    })

    it('shows the result of a link flow passed back in the hash and clears it', async () => {
      const { wrapper, router } = await mountWith(baseUser, '#linked=authelia')
      expect(wrapper.emitted('notify')?.[0]).toEqual(['success', 'Authelia linked', 'You can now sign in with Authelia.'])
      expect(apiMock.get).toHaveBeenCalledWith('/user/me')
      expect(router.currentRoute.value.hash).toBe('')
    })

    it('shows link errors passed back in the hash', async () => {
      const { wrapper } = await mountWith(baseUser, '#error=identity_in_use')
      const [style, title, desc] = wrapper.emitted('notify')![0] as string[]
      expect(style).toBe('danger')
      expect(title).toBe('Could not link provider')
      expect(desc).toMatch(/another/)
    })
  })

  describe('password', () => {
    it('asks for the current password when one is set', async () => {
      const { wrapper } = await mountWith(baseUser)
      expect(wrapper.find('#current-password').exists()).toBe(true)
      expect(wrapper.find('h3.password-title').text()).toBe('Change password')
    })

    it('offers to set a first password for SSO-only accounts', async () => {
      const { wrapper } = await mountWith({ ...baseUser, hasPassword: false, identities: [{ provider: 'authelia' }] })
      expect(wrapper.find('#current-password').exists()).toBe(false)
      expect(wrapper.find('h3.password-title').text()).toBe('Set a password')
    })

    it('changes the password', async () => {
      apiMock.put.mockResolvedValue({ data: {} })
      const { wrapper } = await mountWith(baseUser)

      await wrapper.find('#current-password').setValue('oldpass')
      await wrapper.find('#new-password').setValue('newpassword')
      await wrapper.find('#confirm-password').setValue('newpassword')
      await wrapper.find('form.password-form').trigger('submit')
      await flushPromises()

      expect(apiMock.put).toHaveBeenCalledWith('/user/password', { currentPassword: 'oldpass', newPassword: 'newpassword' })
      expect(wrapper.emitted('notify')?.[0]?.[0]).toBe('success')
      expect((wrapper.find('#new-password').element as HTMLInputElement).value).toBe('')
    })

    it('sets a first password without sending a current password', async () => {
      apiMock.put.mockResolvedValue({ data: {} })
      const { wrapper } = await mountWith({ ...baseUser, hasPassword: false, identities: [{ provider: 'authelia' }] })
      await wrapper.find('#new-password').setValue('newpassword')
      await wrapper.find('#confirm-password').setValue('newpassword')
      await wrapper.find('form.password-form').trigger('submit')
      await flushPromises()
      expect(apiMock.put).toHaveBeenCalledWith('/user/password', { newPassword: 'newpassword' })
      expect(apiMock.get).toHaveBeenCalledWith('/user/me')
    })

    it('rejects mismatching passwords locally', async () => {
      const { wrapper } = await mountWith(baseUser)
      await wrapper.find('#new-password').setValue('newpassword')
      await wrapper.find('#confirm-password').setValue('different1')
      await wrapper.find('form.password-form').trigger('submit')
      await flushPromises()
      expect(apiMock.put).not.toHaveBeenCalled()
      expect(wrapper.emitted('notify')?.[0]).toEqual(['warning', 'Passwords do not match', ''])
    })

    it('rejects short passwords locally', async () => {
      const { wrapper } = await mountWith(baseUser)
      await wrapper.find('#new-password').setValue('short')
      await wrapper.find('#confirm-password').setValue('short')
      await wrapper.find('form.password-form').trigger('submit')
      await flushPromises()
      expect(apiMock.put).not.toHaveBeenCalled()
      expect(wrapper.emitted('notify')?.[0]?.[1]).toBe('Password too short')
    })

    it('shows server errors', async () => {
      apiMock.put.mockRejectedValue(axiosError(401, { error: 'Current password is incorrect' }))
      const { wrapper } = await mountWith(baseUser)
      await wrapper.find('#current-password').setValue('wrong')
      await wrapper.find('#new-password').setValue('newpassword')
      await wrapper.find('#confirm-password').setValue('newpassword')
      await wrapper.find('form.password-form').trigger('submit')
      await flushPromises()
      expect(wrapper.emitted('notify')?.[0]).toEqual(['danger', 'Could not update password', 'Current password is incorrect'])
    })
  })
})
