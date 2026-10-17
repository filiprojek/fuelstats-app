import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ServiceOverview from '@/components/ServiceOverview.vue'
import { makeRouter } from '@/test/utils'

const apiMock = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('@/lib/api', () => ({ default: apiMock }))

const item = (extra: Record<string, unknown>) => ({
  intervalKm: null,
  remainingKm: null,
  intervalMonths: null,
  remainingDays: null,
  lastServiceOdometer: null,
  nextServiceOdometer: null,
  nextServiceDate: null,
  ...extra,
})

const status = [
  item({ serviceTaskId: 'ok', serviceTaskName: 'Battery', status: 'OK', intervalKm: 10000, lastServiceOdometer: 95000, nextServiceOdometer: 105000, remainingKm: 5000 }),
  item({ serviceTaskId: 'warn', serviceTaskName: 'Brakes', status: 'WARNING', intervalMonths: 12, remainingDays: 30, nextServiceDate: '2026-11-16' }),
  item({
    serviceTaskId: 'over',
    serviceTaskName: 'Oil',
    status: 'OVERDUE',
    intervalKm: 15000,
    lastServiceOdometer: 80000,
    nextServiceOdometer: 95000,
    remainingKm: -5000,
    intervalMonths: 12,
    remainingDays: 10,
    nextServiceDate: '2026-10-27',
  }),
  item({ serviceTaskId: 'ok2', serviceTaskName: 'Filter', status: 'OK', intervalKm: 10000, lastServiceOdometer: 99000, nextServiceOdometer: 109000, remainingKm: 9000 }),
]

async function mountFor(vehicleId = 'v1') {
  const router = makeRouter([
    { path: '/add/:type?', name: 'add', component: { template: '<p />' } },
    { path: '/vehicles', name: 'vehicles', component: { template: '<p />' } },
  ])
  await router.push('/')
  const wrapper = mount(ServiceOverview, { props: { vehicleId }, global: { plugins: [router] } })
  await flushPromises()
  return { wrapper, router }
}

describe('ServiceOverview', () => {
  beforeEach(() => {
    apiMock.get.mockReset()
    apiMock.get.mockResolvedValue({ data: { status, currentOdometer: 100000 } })
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('sorts by status, then by elapsed life', async () => {
    const { wrapper } = await mountFor()
    expect(wrapper.findAll('.service-name').map((n) => n.text())).toEqual(['Oil', 'Brakes', 'Battery', 'Filter'])
  })

  it('computes elapsed percentage from distance and time, capped at 100', async () => {
    const { wrapper } = await mountFor()
    const pct = wrapper.findAll('.pct-label').map((p) => p.text())
    expect(pct[0]).toBe('100% elapsed') // 20000 / 15000 km
    expect(pct[1]).toBe(`${Math.round(((365.25 - 30) / 365.25) * 100)}% elapsed`)
    expect(pct[2]).toBe('50% elapsed')
    expect(pct[3]).toBe('10% elapsed')
  })

  it('formats countdowns and status badges', async () => {
    const { wrapper } = await mountFor()
    const remaining = wrapper.findAll('.remaining-label').map((r) => r.text())
    expect(remaining[0]).toBe(`${(5000).toLocaleString()} km past due / 10 days left`)
    expect(remaining[1]).toBe('30 days left')
    expect(remaining[2]).toBe(`${(5000).toLocaleString()} km left`)
    expect(wrapper.findAll('.status-badge').map((b) => b.text())).toEqual(['Overdue', 'Due soon', 'OK', 'OK'])
  })

  it('shows targets by distance and date', async () => {
    const { wrapper } = await mountFor()
    expect(wrapper.findAll('.service-due')[0]!.text()).toContain(`${(95000).toLocaleString()} km or`)
  })

  it('shows an empty state linking to vehicle plans', async () => {
    apiMock.get.mockResolvedValue({ data: { status: [], currentOdometer: 0 } })
    const { wrapper } = await mountFor()
    expect(wrapper.find('.overview-empty').exists()).toBe(true)
    expect(wrapper.find('.btn-setup').attributes('href')).toBe('/vehicles')
  })

  it('skips fetching for all vehicles and handles errors', async () => {
    await mountFor('all')
    expect(apiMock.get).not.toHaveBeenCalled()
    apiMock.get.mockRejectedValue(new Error('x'))
    const { wrapper } = await mountFor('v1')
    expect(wrapper.find('.overview-empty').exists()).toBe(true)
  })

  it('records a service with prefilled query', async () => {
    const { wrapper, router } = await mountFor()
    await wrapper.find('.btn-record').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/add/service')
    expect(router.currentRoute.value.query).toMatchObject({ serviceTaskId: 'over', serviceType: 'Oil', odometer: '100000', vehicleId: 'v1' })
  })

  it('refetches when the vehicle changes', async () => {
    const { wrapper } = await mountFor()
    await wrapper.setProps({ vehicleId: 'v9' })
    await flushPromises()
    expect(apiMock.get).toHaveBeenLastCalledWith('/vehicles/v9/service-status')
  })
})
