import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'
import SettingsView from '@/views/SettingsView.vue'
import { useAuthStore } from '@/stores/auth'
import { CHANGELOG_DATA } from '@/data/changelog'
import { makeRouter, axiosError } from '@/test/utils'

const apiMock = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }))
vi.mock('@/lib/api', () => ({ default: apiMock }))

const vehiclesRef = vi.hoisted(() => ({ value: [] as unknown[] }))
vi.mock('@/composables/useVehicles', () => ({
  useVehicles: () => ({ vehicles: ref(vehiclesRef.value), fetchVehicles: vi.fn() }),
}))
vi.mock('@/components/SignInMethods.vue', async () => ({
  default: (await import('@/test/utils')).stubComponent('SignInMethods'),
}))

const vehicles = [
  { id: 'v1', name: 'Octavia', registrationPlate: 'abc', fuelType: 'diesel', isDefault: false },
  { id: 'v2', name: 'Fabia', registrationPlate: 'xyz', fuelType: 'diesel', isDefault: true },
]

class FakeReader {
  onload: ((e: { target: { result: string } }) => void | Promise<void>) | null = null
  readAsText() {
    this.onload?.({ target: { result: 'a,b\n1,2' } })
  }
}

async function mountSettings() {
  const pinia = createPinia()
  setActivePinia(pinia)
  useAuthStore().setUser({ id: 'u1', email: 'a@b.com', username: 'alice' })
  const router = makeRouter()
  await router.push('/settings')
  const wrapper = mount(SettingsView, { global: { plugins: [router, pinia] }, attachTo: document.body })
  await flushPromises()
  return wrapper
}

const toast = (w: ReturnType<typeof mount>) => w.find('.app-dialog').text()
const button = (w: ReturnType<typeof mount>, group: number, label: string) =>
  w.findAll('.data-group')[group]!.findAll('button').find((b) => b.text().includes(label))!

describe('SettingsView', () => {
  beforeEach(() => {
    apiMock.get.mockReset()
    apiMock.post.mockReset()
    vehiclesRef.value = vehicles
    apiMock.get.mockImplementation(async (url: string) => {
      if (url === '/version') return { data: { version: '1.2.3' } }
      return { data: 'csv-content' }
    })
    vi.stubGlobal('FileReader', FakeReader)
    window.URL.createObjectURL = vi.fn(() => 'blob:x')
    window.URL.revokeObjectURL = vi.fn()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  describe('profile and versions', () => {
    it('shows the user and app/server versions', async () => {
      const w = await mountSettings()
      expect(w.find('.profile-card h2').text()).toBe('alice')
      expect(w.find('.profile-card .email').text()).toBe('a@b.com')
      expect(w.text()).toContain(`v${__APP_VERSION__}`)
      expect(w.text()).toContain('v1.2.3')
      expect(w.find('.status-indicator').classes()).toContain('online')
    })

    it('shows connecting while the server version is unknown', async () => {
      apiMock.get.mockRejectedValue(new Error('offline'))
      const w = await mountSettings()
      expect(w.text()).toContain('Fetching...')
      expect(w.find('.status-indicator').text()).toContain('Connecting')
    })

    it('opens and closes the changelog', async () => {
      const w = await mountSettings()
      await w.find('.btn-changelog').trigger('click')
      expect(w.findAll('.release-block')).toHaveLength(CHANGELOG_DATA.length)
      await w.find('.btn-close-icon').trigger('click')
      expect(w.find('.changelog-modal').exists()).toBe(false)
    })
  })

  describe('logout', () => {
    it('removes the token and signs out on the server', async () => {
      localStorage.setItem('token', 't')
      sessionStorage.setItem('token', 's')
      apiMock.post.mockResolvedValue({})
      const w = await mountSettings()
      await w.find('#btn-signout').trigger('click')
      await flushPromises()
      expect(localStorage.getItem('token')).toBeNull()
      expect(sessionStorage.getItem('token')).toBeNull()
      expect(apiMock.post).toHaveBeenCalledWith('/auth/signout')
    })

    it('still clears the token when the server call fails', async () => {
      localStorage.setItem('token', 't')
      apiMock.post.mockRejectedValue(new Error('offline'))
      const w = await mountSettings()
      await w.find('#btn-signout').trigger('click')
      await flushPromises()
      expect(localStorage.getItem('token')).toBeNull()
    })
  })

  describe('export', () => {
    it.each([
      [0, '/refuels/export?vehicleId=v2', 'fuelstats_refuels.csv', 'Refuel logs exported successfully'],
      [1, '/services/export?vehicleId=v2', 'fuelstats_services.csv', 'Service records exported successfully'],
    ])('group %i downloads the CSV for the default vehicle', async (group, url, filename, message) => {
      const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
      const w = await mountSettings()
      await button(w, group, 'Export CSV').trigger('click')
      await flushPromises()
      expect(apiMock.get).toHaveBeenCalledWith(url, { responseType: 'blob' })
      expect(click).toHaveBeenCalled()
      expect((click.mock.contexts[0] as HTMLAnchorElement).getAttribute('download')).toBe(filename)
      expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:x')
      expect(toast(w)).toContain(message)
    })

    it('exports without vehicle filter when there are no vehicles', async () => {
      vehiclesRef.value = []
      vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
      const w = await mountSettings()
      await button(w, 0, 'Export CSV').trigger('click')
      await flushPromises()
      expect(apiMock.get).toHaveBeenCalledWith('/refuels/export', { responseType: 'blob' })
    })

    it.each([0, 1])('group %i reports export failures', async (group) => {
      apiMock.get.mockImplementation(async (url: string) => {
        if (url === '/version') return { data: { version: '1' } }
        throw axiosError(500, { message: 'export broke' })
      })
      const w = await mountSettings()
      await button(w, group, 'Export CSV').trigger('click')
      await flushPromises()
      expect(toast(w)).toContain('Export failed')
      expect(toast(w)).toContain('export broke')
    })
  })

  describe('refuel import', () => {
    const selectFile = async (w: ReturnType<typeof mount>) => {
      const input = w.findAll('.data-group')[0]!.find('input[type="file"]')
      Object.defineProperty(input.element, 'files', { value: [new File(['a'], 'r.csv')], configurable: true })
      await input.trigger('change')
      await flushPromises()
    }

    it('posts the CSV text for the default vehicle', async () => {
      apiMock.post.mockResolvedValue({})
      const w = await mountSettings()
      await selectFile(w)
      expect(apiMock.post).toHaveBeenCalledWith('/refuels/import?vehicleId=v2', 'a,b\n1,2', { headers: { 'Content-Type': 'text/csv' } })
      expect(toast(w)).toContain('Refuel logs imported successfully')
    })

    it('reports import failures', async () => {
      apiMock.post.mockRejectedValue(axiosError(400, { error: 'bad csv' }))
      const w = await mountSettings()
      await selectFile(w)
      expect(toast(w)).toContain('bad csv')
    })

    it('opens the file picker from the import button', async () => {
      const click = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {})
      const w = await mountSettings()
      await button(w, 0, 'Import CSV').trigger('click')
      expect(click).toHaveBeenCalled()
    })
  })

  describe('service import wizard', () => {
    async function openWizard() {
      const w = await mountSettings()
      await button(w, 1, 'Import CSV').trigger('click')
      return w
    }

    const chooseFile = async (w: ReturnType<typeof mount>, size = 2048) => {
      const input = w.find('.import-modal input[type="file"]')
      const file = new File(['x'.repeat(size)], 'services.csv')
      Object.defineProperty(input.element, 'files', { value: [file], configurable: true })
      await input.trigger('change')
    }

    it('preselects the default vehicle and requires a file', async () => {
      const w = await openWizard()
      expect((w.find('#import_vehicle').element as HTMLSelectElement).value).toBe('v2')
      expect(w.find('.import-modal .modal-actions .icon-label-button').attributes('disabled')).toBeDefined()
      expect(w.find('.file-prompt').exists()).toBe(true)
    })

    it('shows the chosen file with its size and imports into the selected vehicle', async () => {
      apiMock.post.mockResolvedValue({})
      const w = await openWizard()
      await w.find('#import_vehicle').setValue('v1')
      await chooseFile(w)
      expect(w.find('.file-name').text()).toBe('services.csv')
      expect(w.find('.file-size').text()).toBe('2 KB')
      await w.find('.import-modal form').trigger('submit')
      await flushPromises()
      expect(apiMock.post).toHaveBeenCalledWith('/services/import?vehicleId=v1', 'a,b\n1,2', { headers: { 'Content-Type': 'text/csv' } })
      expect(toast(w)).toContain('Service records imported successfully')
      expect(w.find('.import-modal').exists()).toBe(false)
    })

    it('keeps the wizard open on failure', async () => {
      apiMock.post.mockRejectedValue(axiosError(400, { error: 'unknown columns' }))
      const w = await openWizard()
      await chooseFile(w, 10)
      expect(w.find('.file-size').text()).toBe('10 Bytes')
      await w.find('.import-modal form').trigger('submit')
      await flushPromises()
      expect(toast(w)).toContain('unknown columns')
      expect(w.find('.import-modal').exists()).toBe(true)
    })

    it('does not submit without a file and closes on cancel', async () => {
      const w = await openWizard()
      await w.find('.import-modal form').trigger('submit')
      await flushPromises()
      expect(apiMock.post).not.toHaveBeenCalled()
      await w.find('.import-modal .btn-cancel').trigger('click')
      expect(w.find('.import-modal').exists()).toBe(false)
    })
  })
})
