import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ServiceAlerts from '@/components/ServiceAlerts.vue'
import { makeRouter } from '@/test/utils'

const apiMock = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('@/lib/api', () => ({ default: apiMock }))

const status = [
  { serviceTaskId: 't1', serviceTaskName: 'Engine oil', status: 'OVERDUE', intervalKm: 15000, remainingKm: -1200, intervalMonths: 12, remainingDays: -5 },
  { serviceTaskId: 't2', serviceTaskName: 'Air filter', status: 'WARNING', intervalKm: 30000, remainingKm: 800, intervalMonths: null, remainingDays: null },
  { serviceTaskId: 't3', serviceTaskName: 'Brakes', status: 'WARNING', intervalKm: null, remainingKm: null, intervalMonths: 24, remainingDays: 20 },
  { serviceTaskId: 't4', serviceTaskName: 'Battery', status: 'OK', intervalKm: 1, remainingKm: 1, intervalMonths: null, remainingDays: null },
]

async function mountFor(vehicleId: string) {
  const router = makeRouter([{ path: '/add/:type?', name: 'add', component: { template: '<p />' } }])
  await router.push('/')
  const wrapper = mount(ServiceAlerts, { props: { vehicleId }, global: { plugins: [router] } })
  await flushPromises()
  return { wrapper, router }
}

describe('ServiceAlerts', () => {
  beforeEach(() => {
    apiMock.get.mockReset()
    apiMock.get.mockResolvedValue({ data: { status, currentOdometer: 123456 } })
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('shows only warning and overdue tasks', async () => {
    const { wrapper } = await mountFor('v1')
    expect(apiMock.get).toHaveBeenCalledWith('/vehicles/v1/service-status')
    const titles = wrapper.findAll('.alert-title').map((t) => t.text())
    expect(titles).toEqual(['Overdue: Engine oil', 'Due soon: Air filter', 'Due soon: Brakes'])
  })

  it('formats remaining distance and time', async () => {
    const { wrapper } = await mountFor('v1')
    const details = wrapper.findAll('.alert-details').map((d) => d.text())
    expect(details[0]).toBe(`overdue by ${(1200).toLocaleString()} km or overdue by 5 days`)
    expect(details[1]).toBe('800 km remaining')
    expect(details[2]).toBe('20 days remaining')
  })

  it('does not fetch for the "all vehicles" selection', async () => {
    const { wrapper } = await mountFor('all')
    expect(apiMock.get).not.toHaveBeenCalled()
    expect(wrapper.find('.service-alerts-container').exists()).toBe(false)
  })

  it('renders nothing when the request fails', async () => {
    apiMock.get.mockRejectedValue(new Error('down'))
    const { wrapper } = await mountFor('v1')
    expect(wrapper.find('.alert-card').exists()).toBe(false)
  })

  it('refetches when the vehicle changes', async () => {
    const { wrapper } = await mountFor('v1')
    await wrapper.setProps({ vehicleId: 'v2' })
    await flushPromises()
    expect(apiMock.get).toHaveBeenLastCalledWith('/vehicles/v2/service-status')
  })

  it('navigates to the service form prefilled', async () => {
    const { wrapper, router } = await mountFor('v1')
    await wrapper.find('.btn-action').trigger('click')
    await flushPromises()
    const q = router.currentRoute.value.query
    expect(router.currentRoute.value.path).toBe('/add/service')
    expect(q).toMatchObject({ vehicleId: 'v1', serviceTaskId: 't1', serviceType: 'Engine oil', odometer: '123456' })
    expect(q.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
