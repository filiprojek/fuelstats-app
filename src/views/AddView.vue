<template>
  <!-- Notification -->
  <Transition name="toast" appear>
    <AppDialog v-if="dialogOpen" :title="dialogTitle" :description="dialogDesc" :variant="dialogStyle" />
  </Transition>

  <div class="form-wrapper">
    <SegmentSwitch id="btn-record-type" v-model="mode" :options="options" aria-label="Record type" />
    <form v-if="mode === 'refuel'" @submit.prevent="handleRefuel">
      <label for="vehicle">Vehicle</label>
      <select id="vehicle" v-model="formData.vehicleId">
        <option disabled selected value="select-an-option">-- select an option --</option>
        <option v-for="vehicle in vehicles" :key="vehicle.id" :value="vehicle.id">
          {{ vehicle.name }}
        </option>
      </select>

      <label for="fuel_type">Fuel Type</label>
      <select id="fuel_type" v-model="formData.fuelType">
        <option disabled selected value="select-an-option">-- select an option --</option>
        <option v-for="fuelType in FUEL_TYPES" :key="fuelType.value" :value="fuelType.value">
          {{ fuelType.label }}
        </option>
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
        <option disabled selected value="select-an-option">-- select an option --</option>
        <option v-for="vehicle in vehicles" :key="vehicle.id" :value="vehicle.id">
          {{ vehicle.name }}
        </option>
      </select>

      <label for="service_type">Service type</label>
      <select id="service_type" v-model="formData.serviceType">
        <option disabled selected value="select-an-option">-- select an option --</option>
        <option v-for="serviceType in SERVICE_TYPES" :key="serviceType.value" :value="serviceType.value">
          {{ serviceType.label }}
        </option>
      </select>

      <TextInput v-model="formData.cost" id="cost" type="number" placeholder="Cost" />
      <TextInput v-model="formData.mileage" id="mileage" type="number" placeholder="Mileage" />

      <IconLabelButton icon="build" label="Create service record" inline elevated />'
    </form>

    <form v-if="mode === 'vehicle'" @submit.prevent="handleVehicle">
      <TextInput v-model="formData.vehicleName" id="vehicleName" type="text" placeholder="Name" />
      <TextInput v-model="vehiclePlateModel" id="vehiclePlate" type="text" placeholder="Registration plate" />

      <label for="vehicle_fuel_type">Fuel Type</label>
      <select id="vehicle_fuel_type" v-model="formData.fuelType">
        <option disabled selected value="select-an-option">-- select an option --</option>
        <option v-for="fuelType in FUEL_TYPES" :key="fuelType.value" :value="fuelType.value">
          {{ fuelType.label }}
        </option>
      </select>

      <TextInput v-model="formData.vehicleNote" id="vehicleNote" type="text" placeholder="Note (optional)" />
      <IconLabelButton icon="directions_car" label="Create vehicle record" inline elevated />'
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import SegmentSwitch, { type SegmentOption } from '@/components/SegmentSwitch.vue'
import TextInput from '@/components/TextInput.vue'
import IconLabelButton from '@/components/IconLabelButton.vue'
import AppDialog from '@/components/AppDialog.vue'
import api from '@/lib/api'
import { useVehicles } from '@/composables/useVehicles'
import { FUEL_TYPES, SERVICE_TYPES } from '@/lib/constants'

type Mode = 'refuel' | 'service' | 'vehicle'
const mode = ref<Mode>('refuel')
const options: SegmentOption<Mode>[] = [
  { value: 'refuel', label: 'Refuel', icon: 'local_gas_station', accent: 'success' },
  { value: 'service', label: 'Service', icon: 'build', accent: 'warning' },
  { value: 'vehicle', label: 'Vehicle', icon: 'directions_car', accent: 'primary-light' },
]

const router = useRouter()

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

type DialogStyle = 'success' | 'danger' | 'warning' | 'info'

const dialogOpen = ref(false)
const dialogTitle = ref('')
const dialogDesc = ref('')
const dialogStyle = ref<DialogStyle>('info')

let hideTimer: number | undefined

function showDialog(style: DialogStyle, title: string, description = '', autoHideMs = 3500) {
  dialogStyle.value = style
  dialogTitle.value = title
  dialogDesc.value = description
  dialogOpen.value = true

  if (hideTimer) window.clearTimeout(hideTimer)
  if (autoHideMs > 0) {
    hideTimer = window.setTimeout(() => {
      dialogOpen.value = false
    }, autoHideMs)
  }
}

function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.message || err.response?.data?.error || err.message
  }
  return err instanceof Error ? err.message : String(err)
}

function resetForm() {
  formData.liters = ''
  formData.pricePerLiter = ''
  formData.totalPrice = ''
  formData.mileage = ''
  formData.cost = ''
  formData.vehicleName = ''
  formData.vehiclePlate = ''
  formData.vehicleNote = ''

  const def = vehicles.value.find((v) => v.isDefault)
  if (def) {
    formData.vehicleId = def.id
    formData.fuelType = def.fuelType
  } else {
    formData.vehicleId = 'select-an-option'
    formData.fuelType = 'select-an-option'
  }
  formData.serviceType = 'select-an-option'
}

const { vehicles, fetchVehicles } = useVehicles()

onMounted(async () => {
  await fetchVehicles()

  // set default values for selects in form
  const def = vehicles.value.find((v) => v.isDefault)
  if (def && !formData.vehicleId) {
    formData.vehicleId = def.id
    formData.fuelType = def.fuelType
  } else {
    formData.vehicleId = 'select-an-option'
    formData.fuelType = 'select-an-option'
  }
  formData.serviceType = 'select-an-option'
})

const vehiclePlateModel = computed({
  get: () => formData.vehiclePlate,
  set: (v: string) => {
    formData.vehiclePlate = v.toLocaleUpperCase()
  },
})

async function handleRefuel() {
  const body = {
    vehicleId: formData.vehicleId,
    fuelType: formData.fuelType,
    note: formData.vehicleNote || null,
    liters: Number(formData.liters),
    pricePerLiter: Number(formData.pricePerLiter),
    totalPrice: Number(formData.totalPrice),
    mileage: Number(formData.mileage),
  }
  try {
    await api.post('/refuels', body)
    showDialog('success', 'Refuel record created successfully', '', 1500)
    resetForm()
    setTimeout(() => {
      router.push('/')
    }, 1500)
  } catch (err) {
    showDialog('danger', 'Error creating refuel record', getErrorMessage(err))
  }
}

async function handleService() {
  const body = {
    vehicleId: formData.vehicleId,
    serviceType: formData.serviceType,
    cost: Number(formData.cost),
    mileage: Number(formData.mileage),
    note: formData.vehicleNote || null,
    date: new Date().toISOString(),
  }
  try {
    await api.post('/services', body)
    showDialog('success', 'Service record created successfully', '', 1500)
    resetForm()
    setTimeout(() => {
      router.push('/')
    }, 1500)
  } catch (err) {
    showDialog('danger', 'Error creating service record', getErrorMessage(err))
  }
}

async function handleVehicle() {
  const body = {
    name: formData.vehicleName,
    registrationPlate: formData.vehiclePlate,
    fuelType: formData.fuelType,
    note: formData.vehicleNote || null,
  }
  try {
    await api.post('/vehicles', body)
    showDialog('success', 'Vehicle record created successfully', '', 1500)
    resetForm()
    await fetchVehicles()
    setTimeout(() => {
      router.push('/vehicles')
    }, 1500)
  } catch (err) {
    showDialog('danger', 'Error creating vehicle record', getErrorMessage(err))
  }
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

<style lang="scss">
.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 180ms ease,
    transform 180ms ease,
    filter 180ms ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.98);
  filter: blur(2px);
}

.toast-enter-to,
.toast-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
  filter: blur(0);
}
</style>
