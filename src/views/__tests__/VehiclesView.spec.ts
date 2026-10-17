import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import VehiclesView from '@/views/VehiclesView.vue'
import { useVehicles } from '@/composables/useVehicles'
import { makeRouter, axiosError } from '@/test/utils'

const apiMock = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() }))
vi.mock('@/lib/api', () => ({ default: apiMock }))

const vehicles = [
  { id: 'v1', name: 'Octavia', registrationPlate: '1ab2345', fuelType: 'diesel', vin: 'TMB123', isDefault: true, note: 'daily', createdAt: '', userId: 'u' },
  { id: 'v2', name: 'Fabia', registrationPlate: '9zz9999', fuelType: 'gasoline95', vin: null, isDefault: false, note: null, createdAt: '', userId: 'u' },
]

const tasks = [
  { _id: 't1', name: 'Engine oil' },
  { id: 't2', name: 'Brakes' },
]

let vehicleData: unknown[]

async function mountView() {
  const router = makeRouter([{ path: '/add/:type?', name: 'add', component: { template: '<p />' } }])
  await router.push('/')
  const wrapper = mount(VehiclesView, { global: { plugins: [router] } })
  await flushPromises()
  return wrapper
}

const rows = (w: ReturnType<typeof mount>) => w.findAll('.vehicle')
const toast = (w: ReturnType<typeof mount>) => w.find('.app-dialog').text()

describe('VehiclesView', () => {
  beforeEach(() => {
    for (const fn of Object.values(apiMock)) fn.mockReset()
    vehicleData = vehicles
    useVehicles().vehicles.value = []
    apiMock.get.mockImplementation(async (url: string) => {
      if (url === '/vehicles') return { data: vehicleData }
      if (url === '/vehicles/service-tasks') return { data: tasks }
      if (url === '/vehicles/v1/service-intervals') return { data: [{ serviceTaskId: 't1', intervalKm: 15000, intervalMonths: null }] }
      return { data: [] }
    })
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  describe('list', () => {
    it('lists vehicles with plate, fuel label, note and default marker', async () => {
      const w = await mountView()
      expect(rows(w)).toHaveLength(2)
      expect(rows(w)[0]!.classes()).toContain('favorite')
      expect(rows(w)[0]!.find('.v-info p').text()).toBe('1AB2345 • Diesel • daily')
      expect(rows(w)[1]!.find('.v-info p').text()).toBe('9ZZ9999 • Gasoline 95 • No notes')
      expect(rows(w)[0]!.find('.vin-text').text()).toBe('VIN: TMB123')
      expect(rows(w)[1]!.find('.vin-text').exists()).toBe(false)
    })

    it('shows an empty state', async () => {
      vehicleData = []
      const w = await mountView()
      expect(w.find('.empty-state h3').text()).toBe('No vehicles found')
    })

    it('makes a vehicle the default', async () => {
      apiMock.put.mockResolvedValue({})
      const w = await mountView()
      await rows(w)[1]!.find('.v-default button').trigger('click')
      await flushPromises()
      expect(apiMock.put).toHaveBeenCalledWith('/vehicles/v2', expect.objectContaining({ isDefault: true }))
    })

    it('copies the VIN to the clipboard', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined)
      vi.stubGlobal('navigator', { clipboard: { writeText } })
      const w = await mountView()
      await w.find('.vin-badge-container').trigger('click')
      await flushPromises()
      expect(writeText).toHaveBeenCalledWith('TMB123')
      expect(toast(w)).toContain('VIN copied to clipboard')
      vi.unstubAllGlobals()
    })

    it('reports clipboard failures', async () => {
      vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } })
      const w = await mountView()
      await w.find('.vin-badge-container').trigger('click')
      await flushPromises()
      expect(toast(w)).toContain('Failed to copy VIN')
      vi.unstubAllGlobals()
    })
  })

  describe('edit', () => {
    it('prefills the form and saves with upper-cased plate and VIN', async () => {
      apiMock.put.mockResolvedValue({})
      const w = await mountView()
      await rows(w)[1]!.find('.i-edit').trigger('click')

      expect((w.find('#edit_name').element as HTMLInputElement).value).toBe('Fabia')
      await w.find('#edit_plate').setValue('new 1')
      await w.find('#edit_vin').setValue('abc')
      await w.find('.edit-modal form').trigger('submit')
      await flushPromises()

      expect(apiMock.put).toHaveBeenCalledWith('/vehicles/v2', {
        name: 'Fabia',
        registrationPlate: 'NEW 1',
        fuelType: 'gasoline95',
        vin: 'ABC',
        note: '',
        isDefault: false,
      })
      expect(w.find('.edit-modal').exists()).toBe(false)
      expect(toast(w)).toContain('Vehicle updated successfully')
    })

    it('keeps the modal open and reports errors', async () => {
      apiMock.put.mockRejectedValue(axiosError(400, { error: 'Invalid plate' }))
      const w = await mountView()
      await rows(w)[0]!.find('.i-edit').trigger('click')
      await w.find('.edit-modal form').trigger('submit')
      await flushPromises()
      expect(w.find('.edit-modal').exists()).toBe(true)
      expect(toast(w)).toContain('Invalid plate')
    })

    it('closes on cancel', async () => {
      const w = await mountView()
      await rows(w)[0]!.find('.i-edit').trigger('click')
      await w.find('.btn-cancel').trigger('click')
      expect(w.find('.edit-modal').exists()).toBe(false)
    })
  })

  describe('delete', () => {
    it('does nothing when not confirmed', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false)
      const w = await mountView()
      await rows(w)[0]!.find('.i-delete').trigger('click')
      expect(apiMock.delete).not.toHaveBeenCalled()
    })

    it('deletes and promotes another vehicle to default', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true)
      apiMock.delete.mockImplementation(async () => {
        vehicleData = [vehicles[1]]
        return {}
      })
      apiMock.put.mockResolvedValue({})
      const w = await mountView()
      await rows(w)[0]!.find('.i-delete').trigger('click')
      await flushPromises()
      expect(apiMock.delete).toHaveBeenCalledWith('/vehicles/v1')
      expect(apiMock.put).toHaveBeenCalledWith('/vehicles/v2', expect.objectContaining({ isDefault: true }))
    })

    it('reports delete errors', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true)
      apiMock.delete.mockRejectedValue(axiosError(500, { message: 'boom' }))
      const w = await mountView()
      await rows(w)[1]!.find('.i-delete').trigger('click')
      await flushPromises()
      expect(toast(w)).toContain('Error deleting vehicle')
    })
  })

  describe('service plans', () => {
    async function openPlans() {
      const w = await mountView()
      await rows(w)[0]!.find('.i-service').trigger('click')
      await flushPromises()
      return w
    }

    it('loads tasks and existing intervals', async () => {
      const w = await openPlans()
      expect(w.find('.service-plans-modal h3').text()).toBe('Service Plans: Octavia')
      const plans = w.findAll('.plan-row')
      expect(plans.map((p) => p.find('.task-name').text())).toEqual(['Engine oil', 'Brakes'])
      const [km, months] = plans[0]!.findAll('input')
      expect((km!.element as HTMLInputElement).value).toBe('15000')
      expect((months!.element as HTMLInputElement).value).toBe('')
    })

    it('saves intervals as numbers or null', async () => {
      apiMock.post.mockResolvedValue({})
      const w = await openPlans()
      await w.findAll('.plan-row')[1]!.findAll('input')[1]!.setValue('24')
      await w.find('.service-plans-modal form').trigger('submit')
      await flushPromises()
      expect(apiMock.post).toHaveBeenCalledWith('/vehicles/v1/service-intervals', {
        intervals: [
          { serviceTaskId: 't1', intervalKm: 15000, intervalMonths: null },
          { serviceTaskId: 't2', intervalKm: null, intervalMonths: 24 },
        ],
      })
      expect(w.find('.service-plans-modal').exists()).toBe(false)
      expect(toast(w)).toContain('Service plans updated successfully')
    })

    it('clears a row', async () => {
      apiMock.post.mockResolvedValue({})
      const w = await openPlans()
      await w.findAll('.plan-row')[0]!.find('.btn-clear-row').trigger('click')
      await w.find('.service-plans-modal form').trigger('submit')
      await flushPromises()
      expect(apiMock.post.mock.calls[0]![1].intervals[0]).toEqual({ serviceTaskId: 't1', intervalKm: null, intervalMonths: null })
    })

    it('adds a custom service item with thresholds', async () => {
      apiMock.post.mockResolvedValue({ data: { _id: 't3', name: 'Spark plugs' } })
      const w = await openPlans()
      await w.find('.btn-add-custom-toggle').trigger('click')
      expect(w.find('.btn-save-custom').attributes('disabled')).toBeDefined()
      await w.find('.custom-name-input').setValue('  Spark plugs ')
      const [km, months] = w.findAll('.custom-inputs-row input')
      await km!.setValue('60000')
      await months!.setValue('48')
      await w.find('.btn-save-custom').trigger('click')
      await flushPromises()

      expect(apiMock.post).toHaveBeenCalledWith('/vehicles/service-tasks', { name: 'Spark plugs' })
      const newRow = w.findAll('.plan-row')[2]!
      expect(newRow.find('.task-name').text()).toBe('Spark plugs')
      expect(newRow.findAll('input').map((i) => (i.element as HTMLInputElement).value)).toEqual(['60000', '48'])
      expect(w.find('.custom-task-form').exists()).toBe(false)
    })

    it('reports errors when adding a custom item', async () => {
      apiMock.post.mockRejectedValue(axiosError(409, { error: 'Task exists' }))
      const w = await openPlans()
      await w.find('.btn-add-custom-toggle').trigger('click')
      await w.find('.custom-name-input').setValue('Brakes')
      await w.find('.custom-name-input').trigger('keyup.enter')
      await flushPromises()
      expect(toast(w)).toContain('Task exists')
    })

    it('closes and reports when plans fail to load', async () => {
      apiMock.get.mockImplementation(async (url: string) => {
        if (url === '/vehicles') return { data: vehicles }
        throw axiosError(500, { message: 'down' })
      })
      const w = await openPlans()
      expect(w.find('.service-plans-modal').exists()).toBe(false)
      expect(toast(w)).toContain('Error loading service plans')
    })

    it('reports save errors and stays open', async () => {
      apiMock.post.mockRejectedValue(axiosError(400, { message: 'bad' }))
      const w = await openPlans()
      await w.find('.service-plans-modal form').trigger('submit')
      await flushPromises()
      expect(w.find('.service-plans-modal').exists()).toBe(true)
      expect(toast(w)).toContain('Error saving service plans')
    })
  })
})
