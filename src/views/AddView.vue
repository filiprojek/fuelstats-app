<template>
  <!-- Notification -->
  <Transition name="toast" appear>
    <AppDialog v-if="dialogOpen" :title="dialogTitle" :description="dialogDesc" :variant="dialogStyle" />
  </Transition>

  <div class="form-wrapper">
    <SegmentSwitch id="btn-record-type" v-model="mode" :options="options" aria-label="Record type" />
    <form v-if="mode === 'refuel'" @submit.prevent="handleRefuel">
      <TextInput v-model="formData.date" id="refuel_date" type="date" placeholder="Date" />

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

      <TextInput
        v-model="formData.liters"
        @update:modelValue="onLitersUpdate"
        id="liters"
        type="number"
        placeholder="Liters"
      />
      <TextInput
        v-model="formData.pricePerLiter"
        @update:modelValue="onPriceUpdate"
        id="price_per_liter"
        type="number"
        placeholder="Price per liter"
      />
      <TextInput
        v-model="formData.totalPrice"
        @update:modelValue="onTotalUpdate"
        id="total_price"
        type="number"
        placeholder="Total price"
      />
      <TextInput v-model="formData.mileage" id="mileage" type="number" placeholder="Mileage" />
      <TextInput v-model="formData.note" id="refuel_note" type="text" placeholder="Note (optional)" />

      <IconLabelButton icon="local_gas_station" label="Create refuel record" inline elevated />
    </form>

    <form v-if="mode === 'service'" @submit.prevent="handleService">
      <TextInput v-model="formData.date" id="service_date" type="date" placeholder="Date" />

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
        <optgroup label="Standard Tasks">
          <option v-for="serviceType in SERVICE_TYPES" :key="serviceType.value" :value="serviceType.value">
            {{ serviceType.label }}
          </option>
        </optgroup>
        <optgroup v-if="serviceTasks.length > 0" label="Maintenance Tracker Tasks">
          <option v-for="task in serviceTasks" :key="task._id" :value="task.name">
            {{ task.name }}
          </option>
        </optgroup>
      </select>

      <TextInput v-model="formData.cost" id="cost" type="number" placeholder="Cost" />
      <TextInput v-model="formData.mileage" id="mileage" type="number" placeholder="Mileage" />
      <TextInput v-model="formData.note" id="service_note" type="text" placeholder="Note (optional)" />

      <label>Photos (optional)</label>
      <div class="photo-upload-container">
        <label class="photo-upload-btn">
          <span class="material-symbols-outlined">add_a_photo</span>
          Upload Photos
          <input type="file" accept="image/*" multiple @change="handlePhotoUpload" class="hidden-input" />
        </label>

        <div v-if="uploadedPhotos.length > 0" class="photo-previews">
          <div v-for="(photo, index) in uploadedPhotos" :key="index" class="photo-preview-item">
            <img :src="photo" alt="Preview" />
            <button type="button" class="remove-photo-btn" @click="removePhoto(index)" aria-label="Remove photo">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>
      </div>

      <IconLabelButton icon="build" label="Create service record" inline elevated />
    </form>

    <form v-if="mode === 'vehicle'" @submit.prevent="handleVehicle">
      <TextInput v-model="formData.vehicleName" id="vehicleName" type="text" placeholder="Name" />
      <TextInput v-model="vehiclePlateModel" id="vehiclePlate" type="text" placeholder="Registration plate" />
      <TextInput v-model="vehicleVinModel" id="vehicleVin" type="text" placeholder="VIN (optional)" />

      <label for="vehicle_fuel_type">Fuel Type</label>
      <select id="vehicle_fuel_type" v-model="formData.fuelType">
        <option disabled selected value="select-an-option">-- select an option --</option>
        <option v-for="fuelType in FUEL_TYPES" :key="fuelType.value" :value="fuelType.value">
          {{ fuelType.label }}
        </option>
      </select>

      <TextInput v-model="formData.note" id="vehicleNote" type="text" placeholder="Note (optional)" />
      <IconLabelButton icon="directions_car" label="Create vehicle record" inline elevated />
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'
import SegmentSwitch, { type SegmentOption } from '@/components/SegmentSwitch.vue'
import TextInput from '@/components/TextInput.vue'
import IconLabelButton from '@/components/IconLabelButton.vue'
import AppDialog from '@/components/AppDialog.vue'
import api from '@/lib/api'
import { useVehicles } from '@/composables/useVehicles'
import { FUEL_TYPES, SERVICE_TYPES } from '@/lib/constants'

const router = useRouter()
const route = useRoute()

type Mode = 'refuel' | 'service' | 'vehicle'

const getInitialMode = (): Mode => {
  const type = route.params.type
  if (type === 'vehicle' || type === 'service' || type === 'refuel') {
    return type as Mode
  }
  return 'refuel'
}

const mode = ref<Mode>(getInitialMode())

watch(
  () => route.params.type,
  (newType) => {
    if (newType === 'vehicle' || newType === 'service' || newType === 'refuel') {
      mode.value = newType as Mode
    } else if (!newType) {
      mode.value = 'refuel'
    }
  },
)

watch(mode, (newMode) => {
  if (route.params.type !== newMode) {
    router.replace(`/add/${newMode}`)
  }
})

const options: SegmentOption<Mode>[] = [
  { value: 'refuel', label: 'Refuel', icon: 'local_gas_station', accent: 'success' },
  { value: 'service', label: 'Service', icon: 'build', accent: 'warning' },
  { value: 'vehicle', label: 'Vehicle', icon: 'directions_car', accent: 'primary-light' },
]

const uploadedPhotos = ref<string[]>([])
const serviceTasks = ref<any[]>([])

function handlePhotoUpload(event: Event) {
  const files = (event.target as HTMLInputElement).files
  if (!files) return

  for (let i = 0; i < files.length; i++) {
    const file = files[i]!
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === 'string') {
        uploadedPhotos.value.push(e.target.result)
      }
    }
    reader.readAsDataURL(file)
  }
}

function removePhoto(index: number) {
  uploadedPhotos.value.splice(index, 1)
}

function getTodayString() {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

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
  vehicleVin: '',
  note: '',
  fuelType: '',
  date: getTodayString(),
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
  formData.vehicleVin = ''
  formData.note = ''
  formData.date = getTodayString()
  uploadedPhotos.value = []

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

  // Fetch service tasks list
  try {
    const res = await api.get('/vehicles/service-tasks')
    serviceTasks.value = res.data
  } catch (err) {
    console.error('Failed to load service tasks:', err)
  }

  // Pre-fill query parameters if present
  if (route.query.vehicleId) {
    const found = vehicles.value.find(v => v.id === route.query.vehicleId)
    if (found) {
      formData.vehicleId = found.id
      formData.fuelType = found.fuelType
    }
  } else {
    const def = vehicles.value.find((v) => v.isDefault)
    if (def) {
      formData.vehicleId = def.id
      formData.fuelType = def.fuelType
    } else {
      formData.vehicleId = 'select-an-option'
      formData.fuelType = 'select-an-option'
    }
  }

  if (route.query.serviceType) {
    formData.serviceType = route.query.serviceType as string
  } else {
    formData.serviceType = 'select-an-option'
  }

  if (route.query.odometer) {
    formData.mileage = String(route.query.odometer)
  }

  if (route.query.date) {
    formData.date = String(route.query.date)
  } else {
    formData.date = getTodayString()
  }
})

const vehiclePlateModel = computed({
  get: () => formData.vehiclePlate,
  set: (v: string) => {
    formData.vehiclePlate = v.toLocaleUpperCase()
  },
})

const vehicleVinModel = computed({
  get: () => formData.vehicleVin,
  set: (v: string) => {
    formData.vehicleVin = v.toLocaleUpperCase()
  },
})

function onLitersUpdate(val: string) {
  formData.liters = val
  const l = parseFloat(val)
  const p = parseFloat(formData.pricePerLiter)
  const t = parseFloat(formData.totalPrice)

  if (!isNaN(l) && l > 0) {
    if (!isNaN(p)) {
      formData.totalPrice = String(Math.round(l * p * 100) / 100)
    } else if (!isNaN(t)) {
      formData.pricePerLiter = String(Math.round((t / l) * 1000) / 1000)
    }
  }
}

function onPriceUpdate(val: string) {
  formData.pricePerLiter = val
  const l = parseFloat(formData.liters)
  const p = parseFloat(val)
  const t = parseFloat(formData.totalPrice)

  if (!isNaN(p) && p > 0) {
    if (!isNaN(l)) {
      formData.totalPrice = String(Math.round(l * p * 100) / 100)
    } else if (!isNaN(t)) {
      formData.liters = String(Math.round((t / p) * 100) / 100)
    }
  }
}

function onTotalUpdate(val: string) {
  formData.totalPrice = val
  const l = parseFloat(formData.liters)
  const p = parseFloat(formData.pricePerLiter)
  const t = parseFloat(val)

  if (!isNaN(t) && t > 0) {
    if (!isNaN(l) && l > 0) {
      formData.pricePerLiter = String(Math.round((t / l) * 1000) / 1000)
    } else if (!isNaN(p) && p > 0) {
      formData.liters = String(Math.round((t / p) * 100) / 100)
    }
  }
}

async function handleRefuel() {
  const body = {
    vehicleId: formData.vehicleId,
    fuelType: formData.fuelType,
    note: formData.note || null,
    liters: Number(formData.liters),
    pricePerLiter: Number(formData.pricePerLiter),
    totalPrice: Number(formData.totalPrice),
    mileage: Number(formData.mileage),
    date: new Date(formData.date).toISOString(),
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
    note: formData.note || null,
    photos: uploadedPhotos.value,
    date: new Date(formData.date).toISOString(),
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
    vin: formData.vehicleVin || null,
    note: formData.note || null,
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

#btn-refuel > :deep(.material-symbols-outlined) {
  color: green;
}

#btn-service > :deep(.material-symbols-outlined) {
  color: orange;
}

.form-wrapper {
  display: flex;
  align-items: center;
  flex-direction: column;
  width: 100%;
  padding: 0 var(--space-md);
  margin-left: auto;
  margin-right: auto;
  padding-top: var(--space-lg);
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
  gap: var(--space-sm);
  width: 100%;
  max-width: 32rem;
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-default);
  padding: var(--space-xl);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);

  @media (max-width: 767px) {
    background-color: transparent;
    border: none;
    padding: 0;
    box-shadow: none;
    width: 100%;
  }

  .icon-label-button {
    margin-top: var(--space-md);
  }
}

select {
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  background-color: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-default);
  outline: none;
  min-height: 2.5rem;
  cursor: pointer;
  transition: border-color 150ms ease;

  &:focus {
    border-color: var(--color-primary-light);
  }
}

.photo-upload-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  margin-bottom: var(--space-xs);
}

.photo-upload-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  border: 1px dashed var(--border-default);
  background-color: var(--bg-primary);
  cursor: pointer;
  font-weight: 600;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  transition: all 150ms ease;

  &:hover {
    border-color: var(--color-primary-light);
    color: var(--text-primary);
  }
}

.hidden-input {
  display: none;
}

.photo-previews {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: var(--space-sm);
  margin-top: var(--space-xs);
}

.photo-preview-item {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--border-default);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.remove-photo-btn {
  position: absolute;
  top: 2px;
  right: 2px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border-radius: var(--radius-round);
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  transition: background 150ms ease;

  &:hover {
    background: rgba(209, 36, 47, 0.8);
  }

  .material-symbols-outlined {
    font-size: 0.85rem;
    color: inherit;
  }
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
