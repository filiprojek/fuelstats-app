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
  console.log(vehicleId)
  try {
    await api.put(`/vehicles/${vehicleId}`, {
      isDefault: !vehicleDefaultState,
    })
  } catch (err) {
    console.error(err)
  }
  await fetchVehicles()
}

export function useVehicles() {
  return { vehicles, fetchVehicles, setVehicleDefault }
}

