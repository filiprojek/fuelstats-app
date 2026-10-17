import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import HomeView from '@/views/HomeView.vue'
import { useVehicles } from '@/composables/useVehicles'
import { makeRouter } from '@/test/utils'

const apiMock = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('@/lib/api', () => ({ default: apiMock }))

vi.mock('@/components/LineChart.vue', async () => ({
  default: (await import('@/test/utils')).stubComponent('LineChart', ['labels', 'data', 'label']),
}))
vi.mock('@/components/ServiceAlerts.vue', async () => ({
  default: (await import('@/test/utils')).stubComponent('ServiceAlerts', ['vehicleId']),
}))
vi.mock('@/components/ServiceOverview.vue', async () => ({
  default: (await import('@/test/utils')).stubComponent('ServiceOverview', ['vehicleId']),
}))

const NOW = new Date('2026-10-17T12:00:00Z')
const daysAgo = (d: number) => new Date(NOW.getTime() - d * 86400000).toISOString()

const vehicles = [
  { id: 'v1', name: 'Octavia', registrationPlate: '1ab2345', fuelType: 'diesel', isDefault: false, createdAt: '', userId: 'u' },
  { id: 'v2', name: 'Fabia', registrationPlate: '9zz9999', fuelType: 'gasoline95', isDefault: true, createdAt: '', userId: 'u' },
]

const refuel = (id: string, mileage: number, liters: number, ago: number, extra = {}) => ({
  id,
  userId: 'u',
  vehicleId: 'v2',
  fuelType: 'gasoline95',
  note: null,
  liters,
  pricePerLiter: 40 + mileage / 100000,
  totalPrice: 0,
  mileage,
  date: daysAgo(ago),
  createdAt: daysAgo(ago),
  ...extra,
})

// sorted by date: 400 days ago ... 2 days ago
const refuels = [
  refuel('r3', 10900, 40, 10),
  refuel('r1', 10000, 30, 400),
  refuel('r2', 10500, 35, 100),
  refuel('r4', 11400, 30, 2),
  refuel('other', 99999, 99, 1, { vehicleId: 'v1' }),
]

function respond(vehiclesData: unknown[], refuelsData: unknown[]) {
  apiMock.get.mockImplementation(async (url: string) => {
    if (url === '/vehicles') return { data: vehiclesData }
    if (url === '/refuels') return { data: refuelsData }
    return { data: {} }
  })
}

async function mountHome() {
  const router = makeRouter([
    { path: '/add/:type?', name: 'add', component: { template: '<p />' } },
  ])
  await router.push('/')
  const wrapper = mount(HomeView, { global: { plugins: [router] } })
  await flushPromises()
  return wrapper
}

const statValue = (w: ReturnType<typeof mount>, section: string, label: string) =>
  w
    .findAll(`#${section} .stat-card`)
    .find((c) => c.find('.label').text() === label)
    ?.find('.title')
    .text()

describe('HomeView', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(NOW)
    apiMock.get.mockReset()
    useVehicles().vehicles.value = []
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => vi.useRealTimers())

  it('shows an empty state without vehicles', async () => {
    respond([], [])
    const w = await mountHome()
    expect(w.find('.empty-state h3').text()).toBe('No vehicles found')
    expect(w.find('.empty-state a').attributes('href')).toBe('/add/vehicle')
  })

  it('shows the default vehicle with service widgets', async () => {
    respond(vehicles, refuels)
    const w = await mountHome()
    expect(w.find('#default-car-card b').text()).toBe('Fabia')
    expect(w.find('#default-car-card p').text()).toBe('9ZZ9999')
    expect(w.findComponent({ name: 'ServiceAlerts' }).props('vehicleId')).toBe('v2')
    expect(w.findComponent({ name: 'ServiceOverview' }).props('vehicleId')).toBe('v2')
  })

  it('falls back to the first vehicle when none is default', async () => {
    respond([{ ...vehicles[0], isDefault: false }], [])
    const w = await mountHome()
    expect(w.find('#default-car-card b').text()).toBe('Octavia')
  })

  it('computes consumption stats for the default vehicle only', async () => {
    respond(vehicles, refuels)
    const w = await mountHome()
    // (35 + 40 + 30) / (11400 - 10000) * 100
    expect(statValue(w, 'refuel-stats', 'Avg consumption')).toBe('7.50 L/100')
    // 30 / 500 * 100
    expect(statValue(w, 'refuel-stats', 'Since last refuel')).toBe('6.00 L/100')
  })

  it('computes distances for each period', async () => {
    respond(vehicles, refuels)
    const w = await mountHome()
    expect(statValue(w, 'kilometers-driven', 'Since last refuel')).toBe('500 km')
    expect(statValue(w, 'kilometers-driven', 'Past month')).toBe(`${(900).toLocaleString()} km`)
    expect(statValue(w, 'kilometers-driven', 'Past 6 months')).toBe(`${(1400).toLocaleString()} km`)
    expect(statValue(w, 'kilometers-driven', 'Past year')).toBe(`${(1400).toLocaleString()} km`)
    expect(statValue(w, 'kilometers-driven', 'All time')).toBe(`${(1400).toLocaleString()} km`)
  })

  it('renders price and consumption charts', async () => {
    respond(vehicles, refuels)
    const w = await mountHome()
    const charts = w.findAllComponents({ name: 'LineChart' })
    expect(charts).toHaveLength(2)
    expect(charts[0]!.props('data')).toHaveLength(4)
    expect(charts[1]!.props('data')).toEqual([7, 40 / 4, 6])
  })

  it('asks for more data with fewer than two refuels', async () => {
    respond(vehicles, [refuel('r1', 10000, 30, 5)])
    const w = await mountHome()
    expect(w.find('#refuels-status-card').exists()).toBe(true)
    expect(statValue(w, 'refuel-stats', 'Avg consumption')).toBe('N/A')
    expect(statValue(w, 'kilometers-driven', 'Past month')).toBe('N/A')
    expect(w.findAllComponents({ name: 'LineChart' })).toHaveLength(0)
  })

  it('reports N/A for non-increasing mileage and 0 km for empty periods', async () => {
    respond(vehicles, [refuel('a', 10000, 30, 300), refuel('b', 10000, 30, 200)])
    const w = await mountHome()
    expect(statValue(w, 'refuel-stats', 'Avg consumption')).toBe('N/A')
    expect(statValue(w, 'refuel-stats', 'Since last refuel')).toBe('N/A')
    expect(statValue(w, 'kilometers-driven', 'Past month')).toBe('0 km')
  })

  it('still renders when refuels fail to load', async () => {
    apiMock.get.mockImplementation(async (url: string) => {
      if (url === '/vehicles') return { data: vehicles }
      throw new Error('down')
    })
    const w = await mountHome()
    expect(w.find('#default-car-card').exists()).toBe(true)
    expect(w.find('#refuels-status-card').exists()).toBe(true)
  })
})
