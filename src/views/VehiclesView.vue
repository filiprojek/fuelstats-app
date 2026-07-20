<template>
  <!-- Notification Toast -->
  <Transition name="toast" appear>
    <AppDialog v-if="dialogOpen" :title="dialogTitle" :description="dialogDesc" :variant="dialogStyle" />
  </Transition>

  <div id="vehicles">
    <template v-if="vehicles.length > 0">
      <div v-for="vehicle in vehicles" :key="vehicle.id" class="vehicle" :class="{ favorite: vehicle.isDefault }">
        <div class="left-wrp">
          <div class="v-default">
            <IconLabelButton icon="star" @click="setVehicleDefault(vehicle.id, vehicle.isDefault)" />
          </div>
          <div class="v-info">
            <b>{{ vehicle.name }}</b>
            <p>
              {{ vehicle.registrationPlate.toUpperCase() }} • {{ getFuelLabel(vehicle.fuelType) }} •
              {{ vehicle.note || 'No notes' }}
            </p>
            <div
              v-if="vehicle.vin"
              class="vin-badge-container"
              @click="copyToClipboard(vehicle.vin)"
              title="Click to copy VIN to clipboard"
            >
              <span class="material-symbols-outlined vin-icon">content_copy</span>
              <span class="vin-text">VIN: {{ vehicle.vin }}</span>
            </div>
          </div>
        </div>
        <div class="v-actions">
          <IconLabelButton class="i-service" icon="build" @click="openServicePlans(vehicle)" aria-label="Service plans" />
          <IconLabelButton class="i-edit" icon="edit" @click="startEdit(vehicle)" aria-label="Edit vehicle" />
          <IconLabelButton class="i-delete" icon="delete" @click="deleteVehicle(vehicle)" aria-label="Delete vehicle" />
        </div>
      </div>
    </template>
    <div v-else class="empty-state">
      <span class="material-symbols-outlined">directions_car</span>
      <h3>No vehicles found</h3>
      <p>Please add a vehicle first to get started.</p>
      <RouterLink to="/add/vehicle" class="btn-primary">
        <span class="material-symbols-outlined">add</span>
        Add Vehicle
      </RouterLink>
    </div>
  </div>

  <!-- Edit Overlay Modal -->
  <Transition name="fade">
    <div class="modal-backdrop" v-if="isEditing" @click.self="closeEdit">
      <div class="edit-modal">
        <h3>Edit Vehicle</h3>
        <form @submit.prevent="saveVehicle">
          <TextInput v-model="editForm.name" id="edit_name" type="text" placeholder="Name" />

          <TextInput v-model="editPlateModel" id="edit_plate" type="text" placeholder="Registration plate" />

          <TextInput v-model="editVinModel" id="edit_vin" type="text" placeholder="VIN (optional)" />

          <label for="edit_fuel_type">Fuel Type</label>
          <select id="edit_fuel_type" v-model="editForm.fuelType">
            <option v-for="fuelType in FUEL_TYPES" :key="fuelType.value" :value="fuelType.value">
              {{ fuelType.label }}
            </option>
          </select>

          <TextInput v-model="editForm.note" id="edit_note" type="text" placeholder="Note (optional)" />

          <div class="modal-actions">
            <button type="button" class="btn-cancel" @click="closeEdit">Cancel</button>
            <IconLabelButton type="submit" icon="save" label="Save Changes" inline elevated />
          </div>
        </form>
      </div>
    </div>
  </Transition>

  <!-- Service Plans Modal -->
  <Transition name="fade">
    <div class="modal-backdrop" v-if="isServicePlansOpen" @click.self="closeServicePlans">
      <div class="edit-modal service-plans-modal">
        <h3>Service Plans: {{ selectedVehicleForPlans?.name }}</h3>
        
        <div v-if="isLoadingPlans" class="plans-loading">
          <span class="material-symbols-outlined spin">sync</span>
          <span>Loading service plans...</span>
        </div>
        
        <form v-else @submit.prevent="saveServicePlans">
          <div class="plans-list">
            <div v-for="task in serviceTasksList" :key="task._id || task.id" class="plan-row">
              <span class="task-name">{{ task.name }}</span>
              <div class="inputs-grp" v-if="vehicleIntervals[task._id || task.id]">
                <div class="input-wrp">
                  <input
                    type="number"
                    v-model="vehicleIntervals[task._id || task.id].intervalKm"
                    placeholder="None"
                    min="0"
                  />
                  <span class="unit">km</span>
                </div>
                <div class="input-wrp">
                  <input
                    type="number"
                    v-model="vehicleIntervals[task._id || task.id].intervalMonths"
                    placeholder="None"
                    min="0"
                  />
                  <span class="unit">mths</span>
                </div>
                <button
                  type="button"
                  class="btn-clear-row"
                  title="Clear interval"
                  @click="clearPlan(task._id || task.id)"
                >
                  <span class="material-symbols-outlined">clear</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Add Custom Service Item Section -->
          <div class="add-custom-task-section">
            <button
              v-if="!isAddingCustomTask"
              type="button"
              class="btn-add-custom-toggle"
              @click="isAddingCustomTask = true"
            >
              <span class="material-symbols-outlined">add_circle</span>
              Add Custom Service Item
            </button>

            <div v-else class="custom-task-form">
              <div class="custom-form-title">
                <span class="material-symbols-outlined">add_task</span>
                <span>Add Custom Service Item</span>
              </div>
              <input
                type="text"
                v-model="customTaskName"
                placeholder="Task name (e.g. Výměna svíček / Kontrola klimy)"
                class="custom-name-input"
                @keyup.enter="addCustomServiceTask"
              />
              <div class="custom-inputs-row">
                <div class="input-wrp">
                  <input type="number" v-model="customIntervalKm" placeholder="Threshold" min="0" />
                  <span class="unit">km</span>
                </div>
                <div class="input-wrp">
                  <input type="number" v-model="customIntervalMonths" placeholder="Threshold" min="0" />
                  <span class="unit">mths</span>
                </div>
              </div>
              <div class="custom-actions-row">
                <button type="button" class="btn-cancel-custom" @click="isAddingCustomTask = false">Cancel</button>
                <button type="button" class="btn-save-custom" @click="addCustomServiceTask" :disabled="!customTaskName.trim()">
                  <span class="material-symbols-outlined">add</span> Add Item
                </button>
              </div>
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn-cancel" @click="closeServicePlans">Cancel</button>
            <IconLabelButton type="submit" icon="save" label="Save Plans" inline elevated :disabled="isSavingPlans" />
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
import IconLabelButton from '@/components/IconLabelButton.vue'
import TextInput from '@/components/TextInput.vue'
import AppDialog from '@/components/AppDialog.vue'
import { FUEL_TYPES } from '@/lib/constants'

// Vehicle Interface
type Vehicle = {
  id: string
  name: string
  registrationPlate: string
  fuelType: string
  vin?: string | null
  isDefault: boolean
  note?: string | null
  createdAt: string
  userId: string
}

// Composables
const { vehicles, fetchVehicles, setVehicleDefault } = useVehicles()

onMounted(fetchVehicles)

// Edit State
const isEditing = ref(false)
const editForm = reactive({
  id: '',
  name: '',
  registrationPlate: '',
  fuelType: '',
  vin: '',
  note: '',
  isDefault: false,
})

// Toast Dialog state
type DialogStyle = 'success' | 'danger' | 'warning' | 'info'
const dialogOpen = ref(false)
const dialogTitle = ref('')
const dialogDesc = ref('')
const dialogStyle = ref<DialogStyle>('info')
let hideTimer: number | undefined

// Toast function
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

function getFuelLabel(val: string): string {
  const found = FUEL_TYPES.find((f) => f.value === val)
  return found ? found.label : val
}

const editPlateModel = computed({
  get: () => editForm.registrationPlate,
  set: (v: string) => {
    editForm.registrationPlate = v.toUpperCase()
  },
})

const editVinModel = computed({
  get: () => editForm.vin,
  set: (v: string) => {
    editForm.vin = v.toUpperCase()
  },
})

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    showDialog('success', 'VIN copied to clipboard', text, 1500)
  } catch (err) {
    showDialog('danger', 'Failed to copy VIN', String(err))
  }
}

function startEdit(vehicle: Vehicle) {
  editForm.id = vehicle.id
  editForm.name = vehicle.name
  editForm.registrationPlate = vehicle.registrationPlate
  editForm.fuelType = vehicle.fuelType
  editForm.vin = vehicle.vin || ''
  editForm.note = vehicle.note || ''
  editForm.isDefault = vehicle.isDefault
  isEditing.value = true
}

function closeEdit() {
  isEditing.value = false
}

// Service Plans State
const isServicePlansOpen = ref(false)
const isLoadingPlans = ref(false)
const isSavingPlans = ref(false)
const selectedVehicleForPlans = ref<Vehicle | null>(null)
const serviceTasksList = ref<any[]>([])
const vehicleIntervals = ref<any>({})

const isAddingCustomTask = ref(false)
const customTaskName = ref('')
const customIntervalKm = ref('')
const customIntervalMonths = ref('')

async function addCustomServiceTask() {
  const name = customTaskName.value.trim()
  if (!name) return

  try {
    const res = await api.post('/vehicles/service-tasks', { name })
    const task = res.data
    const taskId = task._id || task.id

    if (!serviceTasksList.value.some((t) => (t._id || t.id) === taskId)) {
      serviceTasksList.value.push(task)
    }

    if (!vehicleIntervals.value[taskId]) {
      vehicleIntervals.value[taskId] = { intervalKm: '', intervalMonths: '' }
    }
    vehicleIntervals.value[taskId].intervalKm = customIntervalKm.value ? String(customIntervalKm.value) : ''
    vehicleIntervals.value[taskId].intervalMonths = customIntervalMonths.value ? String(customIntervalMonths.value) : ''

    customTaskName.value = ''
    customIntervalKm.value = ''
    customIntervalMonths.value = ''
    isAddingCustomTask.value = false

    showDialog('success', 'Custom service item added', name, 1500)
  } catch (err) {
    showDialog('danger', 'Error adding custom service item', getErrorMessage(err))
  }
}

function clearPlan(taskId: string) {
  if (vehicleIntervals.value[taskId]) {
    vehicleIntervals.value[taskId].intervalKm = ''
    vehicleIntervals.value[taskId].intervalMonths = ''
  }
}

async function openServicePlans(vehicle: Vehicle) {
  selectedVehicleForPlans.value = vehicle
  isServicePlansOpen.value = true
  isLoadingPlans.value = true
  try {
    const [tasksRes, intervalsRes] = await Promise.all([
      api.get('/vehicles/service-tasks'),
      api.get(`/vehicles/${vehicle.id}/service-intervals`),
    ])
    serviceTasksList.value = tasksRes.data

    // Initialize intervals state
    const intervalsMap: Record<string, { intervalKm: string; intervalMonths: string }> = {}
    for (const task of tasksRes.data) {
      const taskId = task._id || task.id
      intervalsMap[taskId] = { intervalKm: '', intervalMonths: '' }
    }

    // Populate with existing interval settings
    for (const val of intervalsRes.data) {
      const currentMap = intervalsMap[val.serviceTaskId]
      if (currentMap) {
        currentMap.intervalKm = val.intervalKm !== null && val.intervalKm !== undefined ? String(val.intervalKm) : ''
        currentMap.intervalMonths = val.intervalMonths !== null && val.intervalMonths !== undefined ? String(val.intervalMonths) : ''
      }
    }

    vehicleIntervals.value = intervalsMap
  } catch (err) {
    showDialog('danger', 'Error loading service plans', getErrorMessage(err))
    closeServicePlans()
  } finally {
    isLoadingPlans.value = false
  }
}

function closeServicePlans() {
  isServicePlansOpen.value = false
  selectedVehicleForPlans.value = null
  serviceTasksList.value = []
  vehicleIntervals.value = {}
  isAddingCustomTask.value = false
  customTaskName.value = ''
  customIntervalKm.value = ''
  customIntervalMonths.value = ''
}

async function saveServicePlans() {
  if (!selectedVehicleForPlans.value) return
  isSavingPlans.value = true
  try {
    const payload = Object.entries(vehicleIntervals.value as Record<string, any>).map(([taskId, val]) => ({
      serviceTaskId: taskId,
      intervalKm: val.intervalKm ? Number(val.intervalKm) : null,
      intervalMonths: val.intervalMonths ? Number(val.intervalMonths) : null,
    }))
    
    await api.post(`/vehicles/${selectedVehicleForPlans.value.id}/service-intervals`, { intervals: payload })
    showDialog('success', 'Service plans updated successfully', '', 1500)
    closeServicePlans()
  } catch (err) {
    showDialog('danger', 'Error saving service plans', getErrorMessage(err))
  } finally {
    isSavingPlans.value = false
  }
}

async function saveVehicle() {
  try {
    await api.put(`/vehicles/${editForm.id}`, {
      name: editForm.name,
      registrationPlate: editForm.registrationPlate,
      fuelType: editForm.fuelType,
      vin: editForm.vin || null,
      note: editForm.note,
      isDefault: editForm.isDefault,
    })
    showDialog('success', 'Vehicle updated successfully', '', 1500)
    isEditing.value = false
    await fetchVehicles()
  } catch (err) {
    showDialog('danger', 'Error updating vehicle', getErrorMessage(err))
  }
}

async function deleteVehicle(vehicle: Vehicle) {
  const isConfirmed = window.confirm(`Are you sure you want to delete vehicle "${vehicle.name}"?`)
  if (!isConfirmed) return

  try {
    await api.delete(`/vehicles/${vehicle.id}`)
    showDialog('success', 'Vehicle deleted successfully', '', 1500)
    await fetchVehicles()

    // Set a remaining vehicle as default if the deleted one was default
    if (vehicle.isDefault && vehicles.value.length > 0) {
      await setVehicleDefault(vehicles.value[0]!.id, false)
    }
  } catch (err) {
    showDialog('danger', 'Error deleting vehicle', getErrorMessage(err))
  }
}
</script>

<style lang="scss" scoped>
#vehicles {
  display: flex;
  flex-direction: column;
  margin: 0 var(--space-md);
  gap: var(--space-md);

  @media (min-width: 768px) {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  }

  .vehicle {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    border-color: var(--border-default);
    border-style: solid;
    border-width: 1px;
    padding: var(--space-md);
    border-radius: var(--radius-md);
    background-color: var(--bg-secondary);
    transition:
      transform 150ms ease,
      border-color 150ms ease;
    width: 100%;

    &:hover {
      border-color: var(--color-primary-light);
    }
  }
}

.vehicle.favorite {
  border-left: 4px solid var(--color-favorite);
}

.vehicle.favorite .v-default :deep(.material-symbols-outlined) {
  color: var(--color-favorite);
}

.vehicle .v-actions .i-edit :deep(.material-symbols-outlined) {
  color: var(--color-primary-light);
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

/* Modal Styles */
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
  width: 100%;

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

.v-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.vin-badge-container {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  margin-top: var(--space-xs);
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
  background-color: var(--bg-primary);
  border: 1px solid var(--border-default);
  color: var(--text-secondary);
  font-size: var(--font-size-xs);
  font-family: monospace;
  cursor: pointer;
  width: fit-content;
  transition: all 150ms ease;

  &:hover {
    border-color: var(--color-primary-light);
    color: var(--text-primary);
    background-color: rgba(162, 155, 178, 0.1);
  }

  .vin-icon {
    font-size: 0.9rem;
  }
}

.vehicle .v-actions .i-service :deep(.material-symbols-outlined) {
  color: var(--color-warning);
}

/* Service Plans Modal styles */
.service-plans-modal {
  max-width: 32rem !important;
}

.plans-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  color: var(--text-secondary);
  padding: var(--space-xl);
  
  .spin {
    animation: spin 1.5s linear infinite;
  }
}

.plans-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  max-height: 24rem;
  overflow-y: auto;
  padding-right: var(--space-xs);
  margin-bottom: var(--space-md);
}

/* Shared Pill Input Wrapper */
.input-wrp {
  display: flex;
  flex-direction: row;
  align-items: center;
  background-color: var(--bg-primary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: 0.3rem 0.6rem;
  box-sizing: border-box;
  transition: border-color 150ms ease, box-shadow 150ms ease;

  &:focus-within {
    border-color: var(--color-primary-light);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary-light) 25%, transparent);
  }

  input {
    background: transparent !important;
    border: none !important;
    outline: none !important;
    color: var(--text-primary) !important;
    width: 100% !important;
    font-size: 0.875rem !important;
    font-weight: 600 !important;
    text-align: right !important;
    padding: 0 !important;
    min-height: auto !important;
    box-shadow: none !important;

    &::placeholder {
      color: var(--text-muted);
      opacity: 0.5;
    }

    /* Remove spinner arrows */
    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
    -moz-appearance: textfield;
  }

  .unit {
    font-size: 0.75rem;
    color: var(--text-secondary);
    margin-left: 0.35rem;
    font-weight: 600;
    white-space: nowrap;
    user-select: none;
  }
}

.plan-row {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-xs) 0;
  border-bottom: 1px solid var(--border-default);
  gap: var(--space-md);

  &:last-child {
    border-bottom: none;
  }

  .task-name {
    font-weight: 550;
    font-size: 0.95rem;
    flex: 1;
    text-align: left;
  }

  .inputs-grp {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: var(--space-sm);
    
    .input-wrp {
      width: 7rem;
    }

    .btn-clear-row {
      background: transparent;
      border: none;
      color: var(--text-secondary);
      cursor: pointer;
      padding: 0 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-sm);
      transition: color 150ms ease;

      &:hover {
        color: var(--color-danger);
      }

      .material-symbols-outlined {
        font-size: 16px;
      }
    }
  }
}

.add-custom-task-section {
  margin-top: var(--space-sm);
  margin-bottom: var(--space-md);
  border-top: 1px dashed var(--border-default);
  padding-top: var(--space-sm);
}

.btn-add-custom-toggle {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  background: transparent;
  border: 1px dashed var(--color-primary-light);
  color: var(--color-primary-light);
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  width: 100%;
  justify-content: center;
  transition: all 150ms ease;

  &:hover {
    background: color-mix(in srgb, var(--color-primary-light) 10%, transparent);
  }

  .material-symbols-outlined {
    font-size: 18px;
  }
}

.custom-task-form {
  background: color-mix(in srgb, var(--bg-secondary) 80%, black 20%);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  text-align: left;
  box-shadow: var(--shadow-sm);

  .custom-form-title {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    font-size: 0.875rem;
    font-weight: 650;
    color: var(--color-primary-light);

    .material-symbols-outlined {
      font-size: 18px;
    }
  }

  .custom-name-input {
    width: 100%;
    box-sizing: border-box;
    padding: var(--space-xs) var(--space-sm);
    border-radius: var(--radius-md);
    background-color: var(--bg-primary);
    color: var(--text-primary);
    border: 1px solid var(--border-default);
    outline: none;
    font-size: 0.875rem;
    font-family: inherit;

    &::placeholder {
      color: var(--text-muted);
      opacity: 0.6;
    }

    &:focus {
      border-color: var(--color-primary-light);
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary-light) 25%, transparent);
    }
  }

  .custom-inputs-row {
    display: flex;
    flex-direction: row;
    gap: var(--space-sm);
    
    .input-wrp {
      flex: 1;
    }
  }

  .custom-actions-row {
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    align-items: center;
    gap: var(--space-sm);
    margin-top: var(--space-xs);

    .btn-cancel-custom {
      background: transparent;
      border: none;
      color: var(--text-secondary);
      font-size: 0.825rem;
      font-weight: 550;
      cursor: pointer;
      padding: 0.3rem 0.6rem;

      &:hover {
        color: var(--text-primary);
      }
    }

    .btn-save-custom {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: var(--color-primary-light);
      color: #000;
      border: none;
      border-radius: var(--radius-md);
      padding: 0.35rem 0.75rem;
      font-size: 0.825rem;
      font-weight: 650;
      cursor: pointer;

      .material-symbols-outlined {
        font-size: 16px;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
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
