<template>
  <div class="form-wrapper">
    <SegmentSwitch id="btn-record-type" v-model="mode" :options="options" aria-label="Record type" />
    <form v-if="mode === 'refuel'" @submit.prevent="handleRefuel">
      <label for="vehicle">Vehicle</label>
      <select id="vehicle" v-model="formData.vehicleId">
        <option value="octavia">Octavia</option>
        <option value="vito">Vito</option>
      </select>

      <label for="fuel_type">Fuel Type</label>
      <select id="fuel_type" v-model="formData.fuelType">
        <option value="diesel">Diesel</option>
        <option value="gasoline95">Gasoline 95</option>
        <option value="gasoline98">Gasoline 98</option>
        <option value="other">Other</option>
      </select>

      <TextInput v-model="formData.liters" id="liters" type="number" placeholder="Liters" />
      <TextInput v-model="formData.pricePerLiter" id="price_per_liter" type="number" placeholder="Price per liter" />
      <TextInput v-model="formData.totalPrice" id="total_price" type="number" placeholder="Total price" />
      <TextInput v-model="formData.mileage" id="mileage" type="number" placeholder="Mileage" />

      <IconLabelButton icon="local_gas_station" label="Create refuel record" inline elevated />'
    </form>

    <form v-if="mode === 'service'" @submit.prevent="handleService">
      <label for="vehicle">Vehicle</label>
      <select id="vehicle" v-model="formData.vehicleId">
        <option value="octavia">Octavia</option>
        <option value="vito">Vito</option>
      </select>

      <label for="service_type">Service type</label>
      <select id="service_type" v-model="formData.serviceType">
        <option value="air-filter">Air filter</option>
        <option value="other">Other</option>
      </select>

      <TextInput v-model="formData.cost" id="cost" type="number" placeholder="Cost" />
      <TextInput v-model="formData.mileage" id="mileage" type="number" placeholder="Mileage" />

      <IconLabelButton icon="build" label="Create service record" inline elevated />'
    </form>

    <form v-if="mode === 'vehicle'" @submit.prevent="handleVehicle">
      <TextInput v-model="formData.vehicleName" id="vehicleName" type="text" placeholder="Name" />
      <TextInput v-model="formData.vehiclePlate" id="vehiclePlate" type="text" placeholder="Registration plate" />
      <label for="vehicle_fuel_type">Fuel Type</label>
      <select id="vehicle_fuel_type" v-model="formData.fuelType">
        <option value="diesel">Diesel</option>
        <option value="gasoline95">Gasoline 95</option>
        <option value="gasoline98">Gasoline 98</option>
        <option value="other">Other</option>
      </select>
      <TextInput v-model="formData.vehicleNote" id="vehicleNote" type="text" placeholder="Note (optional)" />
      <IconLabelButton icon="directions_car" label="Create vehicle record" inline elevated />'
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import SegmentSwitch, { type SegmentOption } from '@/components/SegmentSwitch.vue'
import TextInput from '@/components/TextInput.vue'
import IconLabelButton from '@/components/IconLabelButton.vue'

type Mode = 'refuel' | 'service' | 'vehicle'
const mode = ref<Mode>('refuel')
const options: SegmentOption<Mode>[] = [
  { value: 'refuel', label: 'Refuel', icon: 'local_gas_station', accent: 'success' },
  { value: 'service', label: 'Service', icon: 'build', accent: 'warning' },
  { value: 'vehicle', label: 'Vehicle', icon: 'directions_car', accent: 'primary-light' },
]

const formData = reactive({
  liters: '',
  pricePerLiter: '',
  totalPrice: '',
  mileage: '',
  cost: '',
  serviceType: '',
  vehicleId: '',
  vehicleName: '',
  vehiclePlate: '',
  vehicleNote: '',
  fuelType: '',
})

async function handleRefuel() {
  console.log('Handle refuel')
  const body = {
    vehicleId: formData.vehicleId,
    fuelType: formData.fuelType,
    note: formData.vehicleNote,
    liters: formData.liters,
    pricePerLiter: formData.pricePerLiter,
    totalPrice: formData.totalPrice,
    mileage: formData.mileage,
  }
  console.log(body)
}
async function handleService() {
  console.log('Handle service')
  const body = {
    vehicleId: formData.vehicleId,
    serviceType: formData.serviceType,
    //customType: formData.customType,
    //itemName: formData.itemName,
    cost: formData.cost,
    mileage: formData.mileage,
    //shop: formData.shop,
    //selfService: formData.selfService,
    note: formData.vehicleNote,
    //photos: formData.photos, // array of string bytes
    //date: formData.date,
  }
  console.log(body)
}
async function handleVehicle() {
  console.log('Handle vehicle')
  const body = {
    name: formData.vehicleName,
    plate: formData.vehiclePlate,
    fuel_type: formData.fuelType,
    note: formData.vehicleNote,
  }
  console.log(body)
}
</script>

<style lang="scss" scoped>
#btn-record-type {
  margin-top: var(--space-md) !important;
  margin-bottom: var(--space-sm) !important;

  max-width: 30rem;
  width: 90%;
}

#btn-record-type,
form {
  margin: 0 var(--space-md);
}

#btn-refuel> :deep(.material-symbols-outlined) {
  color: green;
}

#btn-service> :deep(.material-symbols-outlined) {
  color: orange;
}

.form-wrapper {
  display: flex;
  align-items: center;
  flex-direction: column;
  width: 100vw;
  margin: 0 var(--space-md);
  margin-left: auto;
  margin-right: auto;
}

.flex-row {
  display: flex;
  flex-direction: row;
  justify-content: center;
  gap: var(--space-xl);
}

form {
  display: flex;
  flex-direction: column;
  // align-items: center;
  gap: var(--space-sm);

  max-width: 30rem;
  width: 90%;

  .icon-label-button {
    margin-top: var(--space-sm);
  }
}

select {
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);

  background-color: var(--bg-secondary);
  color: var(--text-primary);

  border: 1px solid var(--bg-elevated);
  outline: none;
}
</style>
