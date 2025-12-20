<script setup lang="ts">
import { ref } from 'vue'
import SegmentSwitch, { type SegmentOption } from '@/components/SegmentSwitch.vue'
type Mode = 'refuel' | 'service'
const mode = ref<Mode>('refuel')
const options: SegmentOption<Mode>[] = [
  { value: 'refuel', label: 'Refuel', icon: 'local_gas_station', accent: 'success' },
  { value: 'service', label: 'Service', icon: 'build', accent: 'warning' },
]
</script>

<template>
  <SegmentSwitch id="btn-record-type" v-model="mode" :options="options" aria-label="Record type" />
  <form v-if="mode === 'refuel'">
    <label for="vehicle">Vehicle</label>
    <select id="vehicle">
      <option value="octavia">Octavia</option>
      <option value="vito">Vito</option>
    </select>
    <label for="fuel_type">Fuel Type</label>
    <select id="fuel_type">
      <option value="diesel">Diesel</option>
      <option value="gasoline95">Gasoline 95</option>
      <option value="gasoline98">Gasoline 98</option>
      <option value="other">Other</option>
    </select>
    <label for="liters">Liters</label> <input id="liters" type="number" />
    <label for="total_price">Price per liter</label> <input id="price_per_liter" type="number" />
    <label for="total_price">Total price</label> <input id="total_price" type="number" />
    <label for="mileage">Mileage</label> <input id="mileage" type="number" />
  </form>
  <form v-if="mode === 'service'">
    <label for="vehicle">Vehicle</label>
    <select id="vehicle">
      <option value="octavia">Octavia</option>
      <option value="vito">Vito</option>
    </select>
    <label for="service_type">Fuel Type</label>
    <select id="service_type">
      <option value="air-filter">Air filter</option>
      <option value="other">Other</option>
    </select>
    <label for="cost">Cost</label> <input id="liters" type="number" />
    <label for="mileage">Mileage</label>
    <input id="mileage" type="number" />
  </form>
</template>

<style lang="scss" scoped>
#btn-record-type {
  margin-top: var(--space-md) !important;
  margin-bottom: var(--space-sm) !important;
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

.flex-row {
  display: flex;
  flex-direction: row;
  justify-content: center;
  gap: var(--space-xl);
}

form {
  display: flex;
  flex-direction: column;
}
</style>
