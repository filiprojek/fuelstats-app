<template>
  <!-- Notification Toast -->
  <Transition name="toast" appear>
    <AppDialog v-if="dialogOpen" :title="dialogTitle" :description="dialogDesc" :variant="dialogStyle" />
  </Transition>

  <div class="history-container">
    <div class="filters">
      <!-- Tab Segment Switch -->
      <SegmentSwitch
        id="btn-history-type"
        v-model="activeTab"
        :options="tabOptions"
        aria-label="History type"
      />

      <!-- Vehicle Filter -->
      <div class="vehicle-select-wrp">
        <label for="history_vehicle">Filter by Vehicle</label>
        <select id="history_vehicle" v-model="selectedVehicleId">
          <option value="all">All Vehicles</option>
          <option v-for="vehicle in vehicles" :key="vehicle.id" :value="vehicle.id">
            {{ vehicle.name }} ({{ vehicle.registrationPlate.toUpperCase() }})
          </option>
        </select>
      </div>
    </div>

    <!-- History list -->
    <div v-if="isLoading" class="loading-state">
      <span class="material-symbols-outlined spin">sync</span>
      <p>Loading history records...</p>
    </div>

    <div v-else-if="filteredItems.length === 0" class="empty-state">
      <span class="material-symbols-outlined">history_toggle_off</span>
      <h3>No records found</h3>
      <p>Try changing your filters or add a new record.</p>
      <RouterLink to="/add" class="btn-primary">
        <span class="material-symbols-outlined">add</span>
        Add Record
      </RouterLink>
    </div>

    <div v-else class="history-list">
      <div
        v-for="item in filteredItems"
        :key="item.id"
        class="history-card"
        :class="item.type"
      >
        <div class="card-header">
          <div class="type-badge" :class="item.type">
            <span class="material-symbols-outlined">
              {{ item.type === 'refuel' ? 'local_gas_station' : 'build' }}
            </span>
            <span class="type-text">
              {{ item.type === 'refuel' ? 'Refuel' : getServiceLabel(item.serviceType || '') }}
            </span>
          </div>
          <span class="date">{{ formatDate(item.date) }}</span>
        </div>

        <div class="card-body">
          <div class="vehicle-info">
            <span class="material-symbols-outlined">directions_car</span>
            <b>{{ getVehicleName(item.vehicleId) }}</b>
          </div>

          <!-- Stats Grid -->
          <div class="stats-grid">
            <div v-if="item.type === 'refuel'" class="stat-box">
              <span class="label">Quantity</span>
              <span class="value">{{ item.liters }} L</span>
            </div>
            <div v-if="item.type === 'refuel'" class="stat-box">
              <span class="label">Price / Liter</span>
              <span class="value">{{ (item.pricePerLiter || 0).toFixed(2) }} ,-</span>
            </div>
            <div v-if="item.type === 'refuel'" class="stat-boxHighlight">
              <span class="label">Total Price</span>
              <span class="value">{{ (item.totalPrice || 0).toFixed(2) }} ,-</span>
            </div>

            <div v-if="item.type === 'service'" class="stat-boxHighlight">
              <span class="label">Cost</span>
              <span class="value">{{ (item.cost || 0).toFixed(2) }} ,-</span>
            </div>

            <div class="stat-box">
              <span class="label">Odometer</span>
              <span class="value">{{ formatMileage(item.mileage) }} km</span>
            </div>
          </div>

          <p v-if="item.note" class="note-box">
            <span class="material-symbols-outlined note-icon">sticky_note_2</span>
            <span>{{ item.note }}</span>
          </p>
        </div>

        <div class="card-actions">
          <button class="btn-edit" @click="startEdit(item)" aria-label="Edit record">
            <span class="material-symbols-outlined">edit</span>
            Edit
          </button>
          <button class="btn-delete" @click="confirmDelete(item)" aria-label="Delete record">
            <span class="material-symbols-outlined">delete</span>
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Edit Overlay Modal -->
  <Transition name="fade">
    <div class="modal-backdrop" v-if="isEditing" @click.self="closeEdit">
      <div class="edit-modal">
        <h3>Edit {{ editType === 'refuel' ? 'Refuel' : 'Service' }} Record</h3>

        <form @submit.prevent="saveRecord">
          <!-- Vehicle selection -->
          <label for="edit_hist_vehicle">Vehicle</label>
          <select id="edit_hist_vehicle" v-model="editForm.vehicleId">
            <option v-for="vehicle in vehicles" :key="vehicle.id" :value="vehicle.id">
              {{ vehicle.name }} ({{ vehicle.registrationPlate.toUpperCase() }})
            </option>
          </select>

          <!-- Refuel Fields -->
          <template v-if="editType === 'refuel'">
            <label for="edit_hist_fuel_type">Fuel Type</label>
            <select id="edit_hist_fuel_type" v-model="editForm.fuelType">
              <option v-for="fuelType in FUEL_TYPES" :key="fuelType.value" :value="fuelType.value">
                {{ fuelType.label }}
              </option>
            </select>

            <label for="edit_hist_liters">Liters</label>
            <TextInput v-model="editForm.liters" id="edit_hist_liters" type="number" placeholder="Liters" />

            <label for="edit_hist_price">Price per Liter</label>
            <TextInput v-model="editForm.pricePerLiter" id="edit_hist_price" type="number" placeholder="Price per liter" />

            <label for="edit_hist_total">Total Price</label>
            <TextInput v-model="editForm.totalPrice" id="edit_hist_total" type="number" placeholder="Total price" />
          </template>

          <!-- Service Fields -->
          <template v-else-if="editType === 'service'">
            <label for="edit_hist_service_type">Service Type</label>
            <select id="edit_hist_service_type" v-model="editForm.serviceType">
              <option v-for="serviceType in SERVICE_TYPES" :key="serviceType.value" :value="serviceType.value">
                {{ serviceType.label }}
              </option>
            </select>

            <label for="edit_hist_cost">Cost</label>
            <TextInput v-model="editForm.cost" id="edit_hist_cost" type="number" placeholder="Cost" />
          </template>

          <!-- Common Fields -->
          <label for="edit_hist_date">Date</label>
          <input id="edit_hist_date" type="datetime-local" class="custom-date-input" v-model="editForm.date" />

          <label for="edit_hist_mileage">Odometer (km)</label>
          <TextInput v-model="editForm.mileage" id="edit_hist_mileage" type="number" placeholder="Mileage" />

          <label for="edit_hist_note">Note (optional)</label>
          <TextInput v-model="editForm.note" id="edit_hist_note" type="text" placeholder="Note" />

          <div class="modal-actions">
            <button type="button" class="btn-cancel" @click="closeEdit">Cancel</button>
            <IconLabelButton type="submit" icon="save" label="Save Changes" inline elevated />
          </div>
        </form>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import axios from 'axios'
import api from '@/lib/api'
import { useVehicles } from '@/composables/useVehicles'
import SegmentSwitch, { type SegmentOption } from '@/components/SegmentSwitch.vue'
import TextInput from '@/components/TextInput.vue'
import IconLabelButton from '@/components/IconLabelButton.vue'
import AppDialog from '@/components/AppDialog.vue'
import { SERVICE_TYPES, FUEL_TYPES } from '@/lib/constants'

// Types
type RefuelRecord = {
  id: string
  userId: string
  vehicleId: string
  fuelType: string
  note: string | null
  liters: number
  pricePerLiter: number
  totalPrice: number
  mileage: number
  date?: string
  createdAt: string
}

type ServiceRecord = {
  id: string
  userId: string
  vehicleId: string
  serviceType: string
  customType: string | null
  itemName: string | null
  cost: number
  mileage: number
  shop: string | null
  selfService: boolean
  note: string | null
  photos: string[]
  date: string
  createdAt: string
}

type HistoryType = 'all' | 'refuel' | 'service'

type HistoryItem = {
  id: string
  type: 'refuel' | 'service'
  date: string
  vehicleId: string
  note: string | null
  mileage: number
  liters?: number
  pricePerLiter?: number
  totalPrice?: number
  cost?: number
  serviceType?: string
  data: RefuelRecord | ServiceRecord
}

// Refs
const activeTab = ref<HistoryType>('all')
const selectedVehicleId = ref<string>('all')
const refuels = ref<RefuelRecord[]>([])
const services = ref<ServiceRecord[]>([])
const isLoading = ref(true)

// Edit State
const isEditing = ref(false)
const editType = ref<'refuel' | 'service'>('refuel')
const editId = ref('')
const editForm = reactive({
  vehicleId: '',
  fuelType: '',
  note: '',
  liters: '',
  pricePerLiter: '',
  totalPrice: '',
  mileage: '',
  serviceType: '',
  cost: '',
  date: '',
})

// Toast Dialog state
type DialogStyle = 'success' | 'danger' | 'warning' | 'info'
const dialogOpen = ref(false)
const dialogTitle = ref('')
const dialogDesc = ref('')
const dialogStyle = ref<DialogStyle>('info')
let hideTimer: number | undefined

// Tab Configuration
const tabOptions: SegmentOption<HistoryType>[] = [
  { value: 'all', label: 'All', icon: 'list', accent: 'primary-light' },
  { value: 'refuel', label: 'Refuels', icon: 'local_gas_station', accent: 'success' },
  { value: 'service', label: 'Services', icon: 'build', accent: 'warning' },
]

// Vehicles Composable
const { vehicles, fetchVehicles } = useVehicles()

// Functions
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

async function fetchRefuels() {
  try {
    const res = await api.get('/refuels')
    refuels.value = res.data
  } catch (err) {
    console.error('Failed to fetch refuels:', err)
  }
}

async function fetchServices() {
  try {
    const res = await api.get('/services')
    services.value = res.data
  } catch (err) {
    console.error('Failed to fetch services:', err)
  }
}

async function loadData() {
  isLoading.value = true
  await Promise.all([fetchVehicles(), fetchRefuels(), fetchServices()])
  
  // Preselect the default vehicle if one exists
  const def = vehicles.value.find((v) => v.isDefault)
  if (def) {
    selectedVehicleId.value = def.id
  } else {
    selectedVehicleId.value = 'all'
  }
  
  isLoading.value = false
}

onMounted(loadData)

// Combined history items
const filteredItems = computed(() => {
  const list: HistoryItem[] = [
    ...refuels.value.map((r) => ({
      id: r.id,
      type: 'refuel' as const,
      date: r.date || r.createdAt || '',
      vehicleId: r.vehicleId,
      note: r.note,
      mileage: r.mileage,
      liters: r.liters,
      pricePerLiter: r.pricePerLiter,
      totalPrice: r.totalPrice,
      data: r,
    })),
    ...services.value.map((s) => ({
      id: s.id,
      type: 'service' as const,
      date: s.date || s.createdAt || '',
      vehicleId: s.vehicleId,
      note: s.note,
      mileage: s.mileage,
      cost: s.cost,
      serviceType: s.serviceType,
      data: s,
    })),
  ]

  return list
    .filter((item) => {
      // Ensure the associated vehicle still exists
      const vehicleExists = vehicles.value.some((v) => v.id === item.vehicleId)
      if (!vehicleExists) return false

      // Type Filter
      if (activeTab.value !== 'all' && item.type !== activeTab.value) return false
      // Vehicle Filter
      if (selectedVehicleId.value !== 'all' && item.vehicleId !== selectedVehicleId.value) return false
      return true
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
})

// UI Helpers
function getVehicleName(id: string): string {
  const found = vehicles.value.find((v) => v.id === id)
  return found ? found.name : 'Unknown Vehicle'
}

function getServiceLabel(val: string): string {
  const found = SERVICE_TYPES.find((s) => s.value === val)
  return found ? found.label : val
}

function formatDate(dateStr: string): string {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatMileage(mileage: number): string {
  if (mileage === undefined || mileage === null) return '0'
  return mileage.toLocaleString()
}

// Convert Date ISO string to YYYY-MM-DDTHH:MM for datetime-local
function formatToDatetimeLocal(dateStr: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const offset = date.getTimezoneOffset()
  const localDate = new Date(date.getTime() - offset * 60 * 1000)
  return localDate.toISOString().slice(0, 16)
}

function startEdit(item: HistoryItem) {
  editId.value = item.id
  editType.value = item.type
  editForm.vehicleId = item.vehicleId
  editForm.note = item.note || ''
  editForm.mileage = String(item.mileage)
  editForm.date = formatToDatetimeLocal(item.date)

  if (item.type === 'refuel') {
    const r = item.data as RefuelRecord
    editForm.fuelType = r.fuelType || ''
    editForm.liters = String(r.liters || '')
    editForm.pricePerLiter = String(r.pricePerLiter || '')
    editForm.totalPrice = String(r.totalPrice || '')
  } else {
    const s = item.data as ServiceRecord
    editForm.serviceType = s.serviceType || ''
    editForm.cost = String(s.cost || '')
  }

  isEditing.value = true
}

function closeEdit() {
  isEditing.value = false
}

async function saveRecord() {
  try {
    if (editType.value === 'refuel') {
      await api.put(`/refuels/${editId.value}`, {
        vehicleId: editForm.vehicleId,
        fuelType: editForm.fuelType,
        note: editForm.note || null,
        liters: Number(editForm.liters),
        pricePerLiter: Number(editForm.pricePerLiter),
        totalPrice: Number(editForm.totalPrice),
        mileage: Number(editForm.mileage),
        date: new Date(editForm.date).toISOString(),
      })
      showDialog('success', 'Refuel record updated successfully', '', 1500)
      await fetchRefuels()
    } else {
      await api.put(`/services/${editId.value}`, {
        vehicleId: editForm.vehicleId,
        serviceType: editForm.serviceType,
        cost: Number(editForm.cost),
        mileage: Number(editForm.mileage),
        note: editForm.note || null,
        date: new Date(editForm.date).toISOString(),
      })
      showDialog('success', 'Service record updated successfully', '', 1500)
      await fetchServices()
    }
    isEditing.value = false
  } catch (err) {
    showDialog('danger', 'Error updating record', getErrorMessage(err))
  }
}

async function confirmDelete(item: HistoryItem) {
  const typeLabel = item.type === 'refuel' ? 'refuel record' : 'service record'
  const isConfirmed = window.confirm(`Are you sure you want to delete this ${typeLabel}?`)
  if (!isConfirmed) return

  try {
    if (item.type === 'refuel') {
      await api.delete(`/refuels/${item.id}`)
    } else {
      await api.delete(`/services/${item.id}`)
    }
    showDialog('success', 'Record deleted successfully', '', 1500)
    // Refresh lists
    if (item.type === 'refuel') {
      await fetchRefuels()
    } else {
      await fetchServices()
    }
  } catch (err) {
    showDialog('danger', 'Error deleting record', getErrorMessage(err))
  }
}
</script>

<style lang="scss" scoped>
.history-container {
  margin: 0 var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.filters {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  margin-top: var(--space-sm);

  #btn-history-type {
    width: 100%;
    max-width: 30rem;
    align-self: center;
  }
}

.vehicle-select-wrp {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  width: 100%;
  max-width: 30rem;
  align-self: center;

  label {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    font-weight: 550;
  }

  select {
    padding: var(--space-sm) var(--space-md);
    border-radius: var(--radius-md);
    background-color: var(--bg-secondary);
    color: var(--text-primary);
    border: 1px solid var(--border-default);
    outline: none;
    cursor: pointer;
    font-weight: 550;
    transition: border-color 150ms ease;

    &:focus {
      border-color: var(--color-primary-light);
    }
  }
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-xxl) var(--space-md);
  text-align: center;
  background-color: var(--bg-secondary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-default);
  margin-top: var(--space-md);

  span {
    font-size: 3rem;
    color: var(--text-secondary);
    margin-bottom: var(--space-md);
  }

  h3 {
    margin-bottom: var(--space-xs);
    font-size: var(--font-size-lg);
  }

  p {
    color: var(--text-secondary);
    margin-bottom: var(--space-lg);
  }
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  100% {
    transform: rotate(-360deg);
  }
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  background-color: var(--color-primary);
  color: var(--text-primary);
  padding: var(--space-sm) var(--space-lg);
  border-radius: var(--radius-round);
  text-decoration: none;
  font-weight: 600;
  transition: background-color 150ms ease;

  span {
    font-size: 1.25rem;
    margin: 0;
    color: inherit;
  }

  &:hover {
    background-color: var(--color-primary-hover);
  }
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.history-card {
  display: flex;
  flex-direction: column;
  background-color: var(--bg-secondary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-default);
  overflow: hidden;

  &.refuel {
    border-left: 4px solid var(--accent-success);
  }

  &.service {
    border-left: 4px solid var(--accent-warning);
  }
}

.card-header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-md);
  border-bottom: 1px solid var(--border-muted);
}

.type-badge {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-weight: 600;

  span.material-symbols-outlined {
    font-size: 1.25rem;
  }

  &.refuel {
    color: var(--accent-success);
  }

  &.service {
    color: var(--accent-warning);
  }
}

.date {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.card-body {
  padding: var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.vehicle-info {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  color: var(--text-secondary);
  font-size: var(--font-size-sm);

  span {
    font-size: 1.15rem;
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: var(--space-sm);
}

.stat-box,
.stat-boxHighlight {
  display: flex;
  flex-direction: column;
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  background-color: var(--bg-elevated);
  border: 1px solid var(--border-muted);

  .label {
    font-size: 0.75rem;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 2px;
  }

  .value {
    font-size: var(--font-size-base);
    font-weight: 700;
  }
}

.stat-boxHighlight {
  background-color: var(--bg-hover);
  border-color: var(--border-default);

  .value {
    color: var(--text-primary);
  }
}

.note-box {
  display: flex;
  align-items: flex-start;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  background-color: var(--bg-hover);
  border: 1px dashed var(--border-default);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);

  .note-icon {
    font-size: 1.1rem;
    color: var(--text-secondary);
    margin-top: 2px;
  }
}

.card-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  border-top: 1px solid var(--border-muted);
  background-color: var(--bg-primary);

  .btn-edit,
  .btn-delete {
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
    font-weight: 600;
    padding: var(--space-xs) var(--space-sm);
    border-radius: var(--radius-sm);
    transition: color 150ms ease, background-color 150ms ease;

    span {
      font-size: 1.15rem;
    }
  }

  .btn-edit:hover {
    color: var(--color-primary-light);
    background-color: var(--bg-hover);
  }

  .btn-delete:hover {
    color: var(--color-danger);
    background-color: rgba(209, 36, 47, 0.12);
  }
}

/* Modal Styling */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
  padding: var(--space-md);
}

.edit-modal {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  width: 100%;
  max-width: 28rem;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  box-shadow: var(--shadow-md);
  max-height: 90vh;
  overflow-y: auto;

  h3 {
    font-size: var(--font-size-xl);
    font-weight: 700;
    margin-bottom: var(--space-xs);
  }

  form {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);

    label {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
      font-weight: 600;
      margin-top: var(--space-xs);
    }

    select {
      padding: var(--space-sm) var(--space-md);
      border-radius: var(--radius-md);
      background-color: var(--bg-primary);
      color: var(--text-primary);
      border: 1px solid var(--border-default);
      outline: none;
      font-weight: 550;
      cursor: pointer;
      min-height: 2.5rem;
    }

    .custom-date-input {
      width: 100%;
      height: 2.5rem;
      padding: var(--space-sm) var(--space-md);
      border-radius: var(--radius-md);
      background-color: var(--bg-primary);
      color: var(--text-primary);
      border: 1px solid var(--border-default);
      outline: none;
      font-weight: 550;
      font-family: inherit;
      transition: border-color 150ms ease;

      &:focus {
        border-color: var(--color-primary-light);
      }
    }
  }
}

.modal-actions {
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  gap: var(--space-md);
  margin-top: var(--space-md);

  .btn-cancel {
    background: transparent;
    color: var(--text-secondary);
    font-weight: 600;
    padding: var(--space-sm) var(--space-md);
    border-radius: var(--radius-md);
    transition: color 150ms ease;

    &:hover {
      color: var(--text-primary);
    }
  }

  :deep(.icon-label-button) {
    background-color: var(--color-primary);
    color: var(--text-primary);
    font-weight: 600;
    padding: var(--space-sm) var(--space-md);
    border-radius: var(--radius-md);
    transition: background-color 150ms ease;

    &:hover {
      background-color: var(--color-primary-hover);
    }
  }
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 200ms ease;
  .edit-modal {
    transition: transform 200ms ease;
  }
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  .edit-modal {
    transform: scale(0.95) translateY(10px);
  }
}
</style>

<!-- Transition classes for Toast -->
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
