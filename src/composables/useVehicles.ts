import { ref } from 'vue'
import api from '@/lib/api'

type Vehicle = {
  id: string
  name: string
  registrationPlate: string
  fuelType: string
  isDefault: boolean
  note?: string | null
  createdAt: string
  userId: string
}

const vehicles = ref<Vehicle[]>([])

async function fetchVehicles() {
  try {
    const res = await api.get('/vehicles')
    vehicles.value = res.data
  } catch (err) {
    console.error(err)
  }
}

async function setVehicleDefault(vehicleId: string, vehicleDefaultState: boolean) {
  if (vehicleDefaultState) return // already default, do nothing

  try {
    // 1. Find the current default vehicle and unset it in DB
    const currentDefault = vehicles.value.find((v) => v.isDefault)
    if (currentDefault) {
      await api.put(`/vehicles/${currentDefault.id}`, {
        name: currentDefault.name,
        registrationPlate: currentDefault.registrationPlate,
        fuelType: currentDefault.fuelType,
        note: currentDefault.note || '',
        isDefault: false,
      })
    }

    // 2. Set the new vehicle as default
    const newDefault = vehicles.value.find((v) => v.id === vehicleId)
    if (newDefault) {
      await api.put(`/vehicles/${vehicleId}`, {
        name: newDefault.name,
        registrationPlate: newDefault.registrationPlate,
        fuelType: newDefault.fuelType,
        note: newDefault.note || '',
        isDefault: true,
      })
    }
  } catch (err) {
    console.error('Failed to set vehicle default:', err)
  }
  await fetchVehicles()
}

export function useVehicles() {
  return { vehicles, fetchVehicles, setVehicleDefault }
}

