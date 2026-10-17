import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { defineComponent, h, ref } from 'vue'
import SettingsView from '@/views/SettingsView.vue'
import { useAuthStore } from '@/stores/auth'
import { makeRouter } from '@/test/utils'

const apiMock = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }))
vi.mock('@/lib/api', () => ({ default: apiMock }))
vi.mock('@/composables/useVehicles', () => ({
  useVehicles: () => ({ vehicles: ref([]), fetchVehicles: vi.fn() }),
}))
vi.mock('@/components/SignInMethods.vue', () => ({
  default: defineComponent({
    name: 'SignInMethods',
    emits: ['notify'],
    setup(_, { emit }) {
      return () => h('button', { class: 'stub-notify', onClick: () => emit('notify', 'success', 'Authelia linked', 'desc') })
    },
  }),
}))

async function mountSettings() {
  const pinia = createPinia()
  setActivePinia(pinia)
  useAuthStore().setUser({ id: 'u1', email: 'a@b.com', username: 'alice' })
  const router = makeRouter()
  await router.push('/settings')
  const wrapper = mount(SettingsView, { global: { plugins: [router, pinia] } })
  await flushPromises()
  return wrapper
}

describe('SettingsView – sign-in methods', () => {
  beforeEach(() => {
    apiMock.get.mockReset()
    apiMock.get.mockResolvedValue({ data: { version: '1.0.0' } })
  })

  it('renders the sign-in methods section', async () => {
    const wrapper = await mountSettings()
    expect(wrapper.text()).toContain('Sign-in methods')
    expect(wrapper.findComponent({ name: 'SignInMethods' }).exists()).toBe(true)
  })

  it('shows notifications from the sign-in methods panel as toast', async () => {
    const wrapper = await mountSettings()
    await wrapper.find('.stub-notify').trigger('click')
    expect(wrapper.find('.app-dialog').text()).toContain('Authelia linked')
  })
})
