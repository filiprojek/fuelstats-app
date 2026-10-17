import { describe, it, expect, beforeEach, vi } from 'vitest'

const apiMock = vi.hoisted(() => ({ get: vi.fn(), put: vi.fn() }))
vi.mock('@/lib/api', () => ({ default: apiMock }))

import { useVehicles } from '@/composables/useVehicles'

const car = (id: string, isDefault: boolean, extra = {}) => ({
  id,
  name: `Car ${id}`,
  registrationPlate: `P-${id}`,
  fuelType: 'diesel',
  isDefault,
  createdAt: '',
  userId: 'u',
  ...extra,
})

describe('useVehicles', () => {
  beforeEach(() => {
    apiMock.get.mockReset()
    apiMock.put.mockReset()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    useVehicles().vehicles.value = []
  })

  it('fetches vehicles into shared state', async () => {
    apiMock.get.mockResolvedValue({ data: [car('1', true)] })
    const { vehicles, fetchVehicles } = useVehicles()
    await fetchVehicles()
    expect(apiMock.get).toHaveBeenCalledWith('/vehicles')
    expect(vehicles.value).toHaveLength(1)
    expect(useVehicles().vehicles.value).toBe(vehicles.value)
  })

  it('keeps the previous list when fetching fails', async () => {
    const { vehicles, fetchVehicles } = useVehicles()
    vehicles.value = [car('1', true)]
    apiMock.get.mockRejectedValue(new Error('down'))
    await fetchVehicles()
    expect(vehicles.value).toHaveLength(1)
  })

  it('does nothing when the vehicle is already default', async () => {
    await useVehicles().setVehicleDefault('1', true)
    expect(apiMock.put).not.toHaveBeenCalled()
    expect(apiMock.get).not.toHaveBeenCalled()
  })

  it('unsets the old default, sets the new one and refetches', async () => {
    const { vehicles, setVehicleDefault } = useVehicles()
    vehicles.value = [car('1', true, { vin: 'V1', note: 'n' }), car('2', false)]
    apiMock.put.mockResolvedValue({})
    apiMock.get.mockResolvedValue({ data: [] })

    await setVehicleDefault('2', false)

    expect(apiMock.put).toHaveBeenNthCalledWith(1, '/vehicles/1', {
      name: 'Car 1',
      registrationPlate: 'P-1',
      fuelType: 'diesel',
      vin: 'V1',
      note: 'n',
      isDefault: false,
    })
    expect(apiMock.put).toHaveBeenNthCalledWith(2, '/vehicles/2', {
      name: 'Car 2',
      registrationPlate: 'P-2',
      fuelType: 'diesel',
      vin: null,
      note: '',
      isDefault: true,
    })
    expect(apiMock.get).toHaveBeenCalledWith('/vehicles')
  })

  it('still refetches when updating fails', async () => {
    const { vehicles, setVehicleDefault } = useVehicles()
    vehicles.value = [car('1', false)]
    apiMock.put.mockRejectedValue(new Error('x'))
    apiMock.get.mockResolvedValue({ data: [] })
    await setVehicleDefault('1', false)
    expect(apiMock.get).toHaveBeenCalled()
  })
})
