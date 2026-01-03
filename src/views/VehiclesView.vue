<template>
  <div id="vehicles">
    <div v-for="vehicle in vehicles" :key="vehicle.id" class="vehicle" :class="{ favorite: vehicle.isDefault }">
      <div class="left-wrp">
        <div class="v-default">
          <IconLabelButton icon="star" @click="setVehicleDefault(vehicle.id, vehicle.isDefault)" />
        </div>
        <div class="v-info">
          <b>{{ vehicle.name }}</b>
          <p>{{ vehicle.registrationPlate.toUpperCase() }} • {{ vehicle.fuelType }} • {{ vehicle.note }}</p>
        </div>
      </div>
      <div class="v-actions">
        <IconLabelButton class="i-edit" icon="edit" />
        <IconLabelButton class="i-delete" icon="delete" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import IconLabelButton from '@/components/IconLabelButton.vue'
import { onMounted, ref } from 'vue'
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

onMounted(fetchVehicles)
</script>

<style lang="scss" scoped>
#vehicles {
  display: flex;
  flex-direction: column;
  margin: 0 var(--space-md);
  gap: var(--space-md);

  .vehicle {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    border-color: var(--bg-secondary);
    border-style: solid;
    padding: var(--space-md);
    border-radius: var(--radius-md);
  }
}

.vehicle.favorite .v-default :deep(.material-symbols-outlined) {
  color: var(--color-favorite);
}

.vehicle .v-actions .i-edit :deep(.material-symbols-outlined) {
  color: var(--color-primary);
}

.vehicle .v-actions .i-delete :deep(.material-symbols-outlined) {
  color: var(--color-danger);
}

.left-wrp,
.v-actions {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: var(--space-md);
}
</style>
