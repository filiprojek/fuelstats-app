import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { RouterView } from 'vue-router'
import AddView from '@/views/AddView.vue'
import { useVehicles } from '@/composables/useVehicles'
import { makeRouter, axiosError } from '@/test/utils'

const apiMock = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }))
vi.mock('@/lib/api', () => ({ default: apiMock }))

const vehicles = [
  { id: 'v1', name: 'Octavia', registrationPlate: 'A', fuelType: 'diesel', isDefault: true, createdAt: '', userId: 'u' },
  { id: 'v2', name: 'Fabia', registrationPlate: 'B', fuelType: 'gasoline95', isDefault: false, createdAt: '', userId: 'u' },
]

async function mountAt(path: string, vehicleList: unknown[] = vehicles) {
  apiMock.get.mockImplementation(async (url: string) => {
    if (url === '/vehicles') return { data: vehicleList }
    if (url === '/vehicles/service-tasks') return { data: [{ _id: 't1', name: 'Timing belt' }] }
    return { data: [] }
  })
  const router = makeRouter([
    { path: '/add/:type?', name: 'add', component: AddView },
    { path: '/vehicles', name: 'vehicles', component: { template: '<p />' } },
    { path: '/history', name: 'history', component: { template: '<p />' } },
  ])
  await router.push(path)
  await router.isReady()
  // mounted through RouterView like in the app, so navigating away unmounts the view
  const wrapper = mount(defineComponent({ render: () => h(RouterView) }), { global: { plugins: [router] } })
  await flushPromises()
  return { wrapper, router }
}

const value = (w: ReturnType<typeof mount>, sel: string) => (w.find(sel).element as HTMLInputElement).value

describe('AddView', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    apiMock.get.mockReset()
    apiMock.post.mockReset()
    useVehicles().vehicles.value = []
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => vi.useRealTimers())

  describe('mode switching', () => {
    it.each([
      ['/add', 'Create refuel record'],
      ['/add/refuel', 'Create refuel record'],
      ['/add/service', 'Create service record'],
      ['/add/odometer', 'Create odometer record'],
      ['/add/vehicle', 'Create vehicle record'],
      ['/add/bogus', 'Create refuel record'],
    ])('%s shows the matching form', async (path, label) => {
      const { wrapper } = await mountAt(path)
      expect(wrapper.find('form .label').text()).toBe(label)
    })

    it('updates the url when switching mode', async () => {
      const { wrapper, router } = await mountAt('/add/refuel')
      await wrapper.findAll('#btn-record-type button')[2]!.trigger('click')
      await flushPromises()
      expect(router.currentRoute.value.path).toBe('/add/odometer')
      expect(wrapper.find('form .label').text()).toBe('Create odometer record')
    })

    it('follows route changes', async () => {
      const { wrapper, router } = await mountAt('/add/refuel')
      await router.push('/add/vehicle')
      await flushPromises()
      expect(wrapper.find('form .label').text()).toBe('Create vehicle record')
      await router.push('/add')
      await flushPromises()
      expect(wrapper.find('form .label').text()).toBe('Create refuel record')
    })
  })

  describe('prefill', () => {
    it('selects the default vehicle and its fuel type', async () => {
      const { wrapper } = await mountAt('/add/refuel')
      expect(value(wrapper, '#vehicle')).toBe('v1')
      expect(value(wrapper, '#fuel_type')).toBe('diesel')
    })

    it('uses query parameters from service alerts', async () => {
      const { wrapper } = await mountAt('/add/service?vehicleId=v2&serviceType=Timing%20belt&odometer=1234&date=2026-01-02')
      expect(value(wrapper, '#vehicle')).toBe('v2')
      expect(value(wrapper, '#service_type')).toBe('Timing belt')
      expect(value(wrapper, '#mileage')).toBe('1234')
      expect(value(wrapper, '#service_date')).toBe('2026-01-02')
      expect(wrapper.find('optgroup[label="Maintenance Tracker Tasks"]').exists()).toBe(true)
    })

    it('asks to select a vehicle when none is default', async () => {
      const { wrapper } = await mountAt('/add/refuel', [{ ...vehicles[1] }])
      expect(value(wrapper, '#vehicle')).toBe('select-an-option')
    })
  })

  describe('refuel calculator', () => {
    it('computes total from liters and price', async () => {
      const { wrapper } = await mountAt('/add/refuel')
      await wrapper.find('#price_per_liter').setValue('40')
      await wrapper.find('#liters').setValue('30.5')
      expect(value(wrapper, '#total_price')).toBe('1220')
    })

    it('computes price from total and liters', async () => {
      const { wrapper } = await mountAt('/add/refuel')
      await wrapper.find('#total_price').setValue('1000')
      await wrapper.find('#liters').setValue('30')
      expect(value(wrapper, '#price_per_liter')).toBe('33.333')
    })

    it('computes liters from total and price', async () => {
      const { wrapper } = await mountAt('/add/refuel')
      await wrapper.find('#total_price').setValue('1000')
      await wrapper.find('#price_per_liter').setValue('40')
      expect(value(wrapper, '#liters')).toBe('25')
    })

    it('recomputes price when total changes after liters', async () => {
      const { wrapper } = await mountAt('/add/refuel')
      await wrapper.find('#liters').setValue('20')
      await wrapper.find('#total_price').setValue('900')
      expect(value(wrapper, '#price_per_liter')).toBe('45')
    })
  })

  describe('submitting', () => {
    it('creates a refuel record and returns home', async () => {
      apiMock.post.mockResolvedValue({ data: {} })
      const { wrapper, router } = await mountAt('/add/refuel')
      await wrapper.find('#refuel_date').setValue('2026-10-01')
      await wrapper.find('#price_per_liter').setValue('40')
      await wrapper.find('#liters').setValue('30')
      await wrapper.find('#mileage').setValue('10000')
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(apiMock.post).toHaveBeenCalledWith('/refuels', {
        vehicleId: 'v1',
        fuelType: 'diesel',
        note: null,
        liters: 30,
        pricePerLiter: 40,
        totalPrice: 1200,
        mileage: 10000,
        date: new Date('2026-10-01').toISOString(),
      })
      expect(wrapper.text()).toContain('Refuel record created successfully')
      vi.advanceTimersByTime(1500)
      await flushPromises()
      expect(router.currentRoute.value.path).toBe('/')
    })

    it('creates a service record with photos', async () => {
      apiMock.post.mockResolvedValue({ data: {} })
      const { wrapper } = await mountAt('/add/service?serviceType=engine-oil')
      await wrapper.find('#cost').setValue('2500')
      await wrapper.find('#mileage').setValue('15000')
      await wrapper.find('form').trigger('submit')
      await flushPromises()
      expect(apiMock.post).toHaveBeenCalledWith('/services', expect.objectContaining({ vehicleId: 'v1', serviceType: 'engine-oil', cost: 2500, mileage: 15000, photos: [] }))
    })

    it('creates an odometer record and goes to history', async () => {
      apiMock.post.mockResolvedValue({ data: {} })
      const { wrapper, router } = await mountAt('/add/odometer')
      await wrapper.find('#odometer_mileage').setValue('20000')
      await wrapper.find('#odometer_note').setValue('trip')
      await wrapper.find('form').trigger('submit')
      await flushPromises()
      expect(apiMock.post).toHaveBeenCalledWith('/odometer', expect.objectContaining({ vehicleId: 'v1', mileage: 20000, note: 'trip' }))
      vi.advanceTimersByTime(1500)
      await flushPromises()
      expect(router.currentRoute.value.path).toBe('/history')
    })

    it('creates a vehicle with upper-cased plate and VIN', async () => {
      apiMock.post.mockResolvedValue({ data: {} })
      const { wrapper, router } = await mountAt('/add/vehicle')
      await wrapper.find('#vehicleName').setValue('Golf')
      await wrapper.find('#vehiclePlate').setValue('1ab 2345')
      await wrapper.find('#vehicleVin').setValue('wvw123')
      await wrapper.find('#vehicle_fuel_type').setValue('gasoline98')
      await wrapper.find('form').trigger('submit')
      await flushPromises()
      expect(apiMock.post).toHaveBeenCalledWith('/vehicles', { name: 'Golf', registrationPlate: '1AB 2345', fuelType: 'gasoline98', vin: 'WVW123', note: null })
      vi.advanceTimersByTime(1500)
      await flushPromises()
      expect(router.currentRoute.value.path).toBe('/vehicles')
    })

    it.each([
      ['/add/refuel', 'Error creating refuel record'],
      ['/add/service', 'Error creating service record'],
      ['/add/odometer', 'Error creating odometer record'],
      ['/add/vehicle', 'Error creating vehicle record'],
    ])('%s shows server errors', async (path, title) => {
      apiMock.post.mockRejectedValue(axiosError(400, { message: 'Missing fields' }))
      const { wrapper } = await mountAt(path)
      await wrapper.find('form').trigger('submit')
      await flushPromises()
      expect(wrapper.find('.app-dialog').text()).toContain(title)
      expect(wrapper.find('.app-dialog').text()).toContain('Missing fields')
    })
  })

  describe('photos', () => {
    it('previews uploaded photos and removes them', async () => {
      class FakeReader {
        onload: ((e: { target: { result: string } }) => void) | null = null
        readAsDataURL(file: File) {
          this.onload?.({ target: { result: `data:${file.name}` } })
        }
      }
      vi.stubGlobal('FileReader', FakeReader)
      const { wrapper } = await mountAt('/add/service')
      const input = wrapper.find('input[type="file"]')
      Object.defineProperty(input.element, 'files', { value: [new File(['a'], 'a.png'), new File(['b'], 'b.png')] })
      await input.trigger('change')
      expect(wrapper.findAll('.photo-preview-item img').map((i) => i.attributes('src'))).toEqual(['data:a.png', 'data:b.png'])
      await wrapper.find('.remove-photo-btn').trigger('click')
      expect(wrapper.findAll('.photo-preview-item')).toHaveLength(1)
      vi.unstubAllGlobals()
    })
  })
})
