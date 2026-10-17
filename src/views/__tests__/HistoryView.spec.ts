import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import HistoryView from '@/views/AboutView.vue'
import { useVehicles } from '@/composables/useVehicles'
import { makeRouter, axiosError } from '@/test/utils'

const apiMock = vi.hoisted(() => ({ get: vi.fn(), put: vi.fn(), delete: vi.fn() }))
vi.mock('@/lib/api', () => ({ default: apiMock }))

const vehicles = [
  { id: 'v1', name: 'Octavia', registrationPlate: 'A', fuelType: 'diesel', isDefault: true, createdAt: '', userId: 'u' },
  { id: 'v2', name: 'Fabia', registrationPlate: 'B', fuelType: 'gasoline95', isDefault: false, createdAt: '', userId: 'u' },
]

const refuels = [
  { id: 'r1', userId: 'u', vehicleId: 'v1', fuelType: 'diesel', note: 'full tank', liters: 40, pricePerLiter: 38.5, totalPrice: 1540, mileage: 10000, date: '2026-10-01T10:00:00Z', createdAt: '' },
  { id: 'r2', userId: 'u', vehicleId: 'v2', fuelType: 'gasoline95', note: null, liters: 30, pricePerLiter: 40, totalPrice: 1200, mileage: 5000, date: '2026-10-05T10:00:00Z', createdAt: '' },
  { id: 'gone', userId: 'u', vehicleId: 'deleted', fuelType: 'diesel', note: null, liters: 1, pricePerLiter: 1, totalPrice: 1, mileage: 1, date: '2026-10-06T10:00:00Z', createdAt: '' },
]
const services = [
  { id: 's1', userId: 'u', vehicleId: 'v1', serviceType: 'engine-oil', customType: null, itemName: null, cost: 2500, mileage: 10500, shop: null, selfService: false, note: null, photos: ['/uploads/a.jpg'], date: '2026-10-03T10:00:00Z', createdAt: '' },
]
const odometers = [{ id: 'o1', userId: 'u', vehicleId: 'v1', mileage: 11000, note: 'trip', date: '2026-10-10T10:00:00Z', createdAt: '' }]

async function mountView() {
  apiMock.get.mockImplementation(async (url: string) => {
    const data: Record<string, unknown> = { '/vehicles': vehicles, '/refuels': refuels, '/services': services, '/odometer': odometers }
    return { data: data[url] ?? [] }
  })
  const router = makeRouter([{ path: '/add/:type?', name: 'add', component: { template: '<p />' } }])
  await router.push('/')
  const wrapper = mount(HistoryView, { global: { plugins: [router] } })
  await flushPromises()
  return wrapper
}

const ids = (w: ReturnType<typeof mount>) => w.findAll('.history-card').map((c) => c.find('.type-text').text())
const toast = (w: ReturnType<typeof mount>) => w.find('.app-dialog').text()

describe('History view', () => {
  beforeEach(() => {
    for (const fn of Object.values(apiMock)) fn.mockReset()
    useVehicles().vehicles.value = []
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  describe('listing', () => {
    it('preselects the default vehicle and lists its records newest first', async () => {
      const w = await mountView()
      expect((w.find('#history_vehicle').element as HTMLSelectElement).value).toBe('v1')
      expect(ids(w)).toEqual(['Odometer Log', 'Engine oil change', 'Refuel'])
    })

    it('shows every vehicle except deleted ones under "all"', async () => {
      const w = await mountView()
      await w.find('#history_vehicle').setValue('all')
      expect(w.findAll('.history-card')).toHaveLength(4)
      expect(w.text()).not.toContain('Unknown Vehicle')
    })

    it('filters by record type', async () => {
      const w = await mountView()
      await w.findAll('#btn-history-type button')[2]!.trigger('click')
      expect(ids(w)).toEqual(['Engine oil change'])
      await w.findAll('#btn-history-type button')[3]!.trigger('click')
      expect(ids(w)).toEqual(['Odometer Log'])
    })

    it.each([
      ['date-asc', ['Refuel', 'Engine oil change', 'Odometer Log']],
      ['cost-desc', ['Engine oil change', 'Refuel', 'Odometer Log']],
      ['cost-asc', ['Odometer Log', 'Refuel', 'Engine oil change']],
      ['mileage-desc', ['Odometer Log', 'Engine oil change', 'Refuel']],
      ['mileage-asc', ['Refuel', 'Engine oil change', 'Odometer Log']],
    ])('sorts by %s', async (sort, expected) => {
      const w = await mountView()
      await w.find('#history_sort').setValue(sort)
      expect(ids(w)).toEqual(expected)
    })

    it('renders record details', async () => {
      const w = await mountView()
      const refuelCard = w.findAll('.history-card').find((c) => c.classes('refuel'))!
      expect(refuelCard.text()).toContain('40 L')
      expect(refuelCard.text()).toContain('38.50 ,-')
      expect(refuelCard.text()).toContain('1540.00 ,-')
      expect(refuelCard.text()).toContain(`${(10000).toLocaleString()} km`)
      expect(refuelCard.find('.note-box').text()).toContain('full tank')
      expect(refuelCard.find('.vehicle-info b').text()).toBe('Octavia')
    })

    it('shows an empty state', async () => {
      const w = await mountView()
      await w.find('#history_vehicle').setValue('v2')
      await w.findAll('#btn-history-type button')[2]!.trigger('click')
      expect(w.find('.empty-state').exists()).toBe(true)
    })

    it('opens and closes service photos', async () => {
      const w = await mountView()
      const thumb = w.find('.photo-thumbnail')
      expect(thumb.attributes('src')).toBe('http://api.test/uploads/a.jpg')
      await thumb.trigger('click')
      expect(w.find('.photo-viewer-backdrop img').attributes('src')).toBe('http://api.test/uploads/a.jpg')
      await w.find('.photo-viewer-backdrop').trigger('click')
      expect(w.find('.photo-viewer-backdrop').exists()).toBe(false)
    })
  })

  describe('editing', () => {
    const editCard = async (w: ReturnType<typeof mount>, type: string) => {
      await w.findAll('.history-card').find((c) => c.classes(type))!.find('.btn-edit').trigger('click')
    }

    it('updates a refuel record', async () => {
      apiMock.put.mockResolvedValue({})
      const w = await mountView()
      await editCard(w, 'refuel')
      expect((w.find('#edit_hist_liters').element as HTMLInputElement).value).toBe('40')
      await w.find('#edit_hist_liters').setValue('42')
      await w.find('#edit_hist_note').setValue('')
      await w.find('.edit-modal form').trigger('submit')
      await flushPromises()
      expect(apiMock.put).toHaveBeenCalledWith('/refuels/r1', expect.objectContaining({ vehicleId: 'v1', fuelType: 'diesel', liters: 42, pricePerLiter: 38.5, totalPrice: 1540, mileage: 10000, note: null }))
      expect(apiMock.put.mock.calls[0]![1].date).toBe(new Date('2026-10-01T10:00:00Z').toISOString())
      expect(toast(w)).toContain('Refuel record updated successfully')
      expect(w.find('.edit-modal').exists()).toBe(false)
    })

    it('updates a service record keeping and removing photos', async () => {
      apiMock.put.mockResolvedValue({})
      class FakeReader {
        onload: ((e: { target: { result: string } }) => void) | null = null
        readAsDataURL() {
          this.onload?.({ target: { result: 'data:new' } })
        }
      }
      vi.stubGlobal('FileReader', FakeReader)
      const w = await mountView()
      await editCard(w, 'service')
      expect((w.find('#edit_hist_service_type').element as HTMLSelectElement).value).toBe('engine-oil')

      const input = w.find('.edit-modal input[type="file"]')
      Object.defineProperty(input.element, 'files', { value: [new File(['x'], 'x.png')] })
      await input.trigger('change')
      await w.find('.edit-modal form').trigger('submit')
      await flushPromises()
      expect(apiMock.put).toHaveBeenLastCalledWith('/services/s1', expect.objectContaining({ cost: 2500, photos: ['/uploads/a.jpg', 'data:new'] }))

      await editCard(w, 'service')
      await w.find('[aria-label="Remove saved photo"]').trigger('click')
      await w.find('.edit-modal form').trigger('submit')
      await flushPromises()
      expect(apiMock.put).toHaveBeenLastCalledWith('/services/s1', expect.objectContaining({ photos: [] }))
      vi.unstubAllGlobals()
    })

    it('removes newly added photos before saving', async () => {
      class FakeReader {
        onload: ((e: { target: { result: string } }) => void) | null = null
        readAsDataURL() {
          this.onload?.({ target: { result: 'data:new' } })
        }
      }
      vi.stubGlobal('FileReader', FakeReader)
      const w = await mountView()
      await editCard(w, 'service')
      const input = w.find('.edit-modal input[type="file"]')
      Object.defineProperty(input.element, 'files', { value: [new File(['x'], 'x.png')] })
      await input.trigger('change')
      await w.find('[aria-label="Remove new photo"]').trigger('click')
      expect(w.findAll('.edit-modal .photo-preview-item')).toHaveLength(1)
      vi.unstubAllGlobals()
    })

    it('updates an odometer record', async () => {
      apiMock.put.mockResolvedValue({})
      const w = await mountView()
      await editCard(w, 'odometer')
      await w.find('#edit_hist_mileage').setValue('11111')
      await w.find('.edit-modal form').trigger('submit')
      await flushPromises()
      expect(apiMock.put).toHaveBeenCalledWith('/odometer/o1', expect.objectContaining({ mileage: 11111, note: 'trip' }))
    })

    it('reports update errors and keeps the modal open', async () => {
      apiMock.put.mockRejectedValue(axiosError(400, { message: 'invalid' }))
      const w = await mountView()
      await editCard(w, 'odometer')
      await w.find('.edit-modal form').trigger('submit')
      await flushPromises()
      expect(toast(w)).toContain('Error updating record')
      expect(w.find('.edit-modal').exists()).toBe(true)
      await w.find('.btn-cancel').trigger('click')
      expect(w.find('.edit-modal').exists()).toBe(false)
    })
  })

  describe('deleting', () => {
    it.each([
      ['refuel', '/refuels/r1', 'refuel record'],
      ['service', '/services/s1', 'service record'],
      ['odometer', '/odometer/o1', 'odometer record'],
    ])('deletes a %s after confirmation', async (type, url, label) => {
      const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
      apiMock.delete.mockResolvedValue({})
      const w = await mountView()
      await w.findAll('.history-card').find((c) => c.classes(type))!.find('.btn-delete').trigger('click')
      await flushPromises()
      expect(confirm).toHaveBeenCalledWith(`Are you sure you want to delete this ${label}?`)
      expect(apiMock.delete).toHaveBeenCalledWith(url)
      expect(toast(w)).toContain('Record deleted successfully')
    })

    it('keeps the record when cancelled', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false)
      const w = await mountView()
      await w.find('.btn-delete').trigger('click')
      expect(apiMock.delete).not.toHaveBeenCalled()
    })

    it('reports delete errors', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true)
      apiMock.delete.mockRejectedValue(axiosError(500, { message: 'nope' }))
      const w = await mountView()
      await w.find('.btn-delete').trigger('click')
      await flushPromises()
      expect(toast(w)).toContain('Error deleting record')
    })
  })

  it('falls back to all vehicles when none is default and tolerates failed requests', async () => {
    apiMock.get.mockImplementation(async (url: string) => {
      if (url === '/vehicles') return { data: [{ ...vehicles[1] }] }
      throw new Error('down')
    })
    const router = makeRouter()
    const w = mount(HistoryView, { global: { plugins: [router] } })
    await flushPromises()
    expect((w.find('#history_vehicle').element as HTMLSelectElement).value).toBe('all')
    expect(w.find('.empty-state').exists()).toBe(true)
  })
})
