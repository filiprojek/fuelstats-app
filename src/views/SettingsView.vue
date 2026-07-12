<template>
  <!-- Notification Toast -->
  <Transition name="toast" appear>
    <AppDialog v-if="dialogOpen" :title="dialogTitle" :description="dialogDesc" :variant="dialogStyle" />
  </Transition>

  <div class="settings-container">
    <div class="settings-sidebar">
      <!-- User Profile Header -->
      <section class="profile-card">
        <div class="avatar">
          <span class="material-symbols-outlined">person</span>
        </div>
        <h2>{{ auth.user?.username ?? 'User Profile' }}</h2>
        <p class="email">{{ auth.user?.email ?? '' }}</p>
      </section>

      <!-- Sign Out Button -->
      <section class="logout-section">
        <IconLabelButton @click="logout" id="btn-signout" label="Sign Out" icon="logout" inline elevated />
      </section>
    </div>

    <!-- Data Management Section -->
    <section class="settings-section">
      <div class="section-title">
        <span class="material-symbols-outlined">database</span>
        <h2>Data Import & Export</h2>
      </div>

      <div class="data-actions-card">
        <!-- Refuel Data Group -->
        <div class="data-group">
          <div class="group-info">
            <span class="material-symbols-outlined icon-success">local_gas_station</span>
            <div>
              <h3>Refuel Logs</h3>
              <p>Import or export your vehicle fueling history</p>
            </div>
          </div>
          <div class="buttons-row">
            <IconLabelButton
              icon="download"
              label="Export CSV"
              class="btn-action"
              @click="exportRefuels"
              inline
              elevated
            />
            <IconLabelButton
              icon="upload"
              label="Import CSV"
              class="btn-action btn-import-success"
              @click="triggerRefuelsInput"
              inline
              elevated
            />
            <input
              type="file"
              ref="refuelsInput"
              accept=".csv"
              style="display: none"
              @change="importRefuels"
            />
          </div>
        </div>

        <div class="divider"></div>

        <!-- Service Data Group -->
        <div class="data-group">
          <div class="group-info">
            <span class="material-symbols-outlined icon-warning">build</span>
            <div>
              <h3>Service Records</h3>
              <p>Import or export your vehicle repair and maintenance logs</p>
            </div>
          </div>
          <div class="buttons-row">
            <IconLabelButton
              icon="download"
              label="Export CSV"
              class="btn-action"
              @click="exportServices"
              inline
              elevated
            />
            <IconLabelButton
              icon="upload"
              label="Import CSV"
              class="btn-action btn-import-warning"
              @click="triggerServicesInput"
              inline
              elevated
            />
            <input
              type="file"
              ref="servicesInput"
              accept=".csv"
              style="display: none"
              @change="importServices"
            />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import { useVehicles } from '@/composables/useVehicles'
import IconLabelButton from '@/components/IconLabelButton.vue'
import AppDialog from '@/components/AppDialog.vue'

// Auth Store
const auth = useAuthStore()

// Vehicles Composable (for fallback vehicle IDs on import)
const { vehicles, fetchVehicles } = useVehicles()

onMounted(fetchVehicles)

const defaultVehicle = computed(() => {
  return vehicles.value.find((v) => v.isDefault) || vehicles.value[0] || null
})

// File inputs refs
const refuelsInput = ref<HTMLInputElement | null>(null)
const servicesInput = ref<HTMLInputElement | null>(null)

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

// Log Out
async function logout() {
  try {
    localStorage.removeItem('token')
    await api.post('/auth/signout')
    window.location.href = '/'
  } catch (err) {
    console.error(err)
    localStorage.removeItem('token')
    window.location.href = '/'
  }
}

// Trigger file dialogs
function triggerRefuelsInput() {
  refuelsInput.value?.click()
}

function triggerServicesInput() {
  servicesInput.value?.click()
}

// Refuels Export
async function exportRefuels() {
  try {
    const fallbackQuery = defaultVehicle.value ? `?vehicleId=${defaultVehicle.value.id}` : ''
    const res = await api.get(`/refuels/export${fallbackQuery}`, { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'fuelstats_refuels.csv')
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
    showDialog('success', 'Refuel logs exported successfully', '')
  } catch (err) {
    showDialog('danger', 'Export failed', getErrorMessage(err))
  }
}

// Refuels Import
async function importRefuels(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = async (e) => {
    const csvText = e.target?.result as string
    try {
      const fallbackQuery = defaultVehicle.value ? `?vehicleId=${defaultVehicle.value.id}` : ''
      await api.post(`/refuels/import${fallbackQuery}`, csvText, {
        headers: { 'Content-Type': 'text/csv' },
      })
      showDialog('success', 'Refuel logs imported successfully', '')
      target.value = ''
    } catch (err) {
      showDialog('danger', 'Import failed', getErrorMessage(err))
      target.value = ''
    }
  }
  reader.readAsText(file)
}

// Services Export
async function exportServices() {
  try {
    const fallbackQuery = defaultVehicle.value ? `?vehicleId=${defaultVehicle.value.id}` : ''
    const res = await api.get(`/services/export${fallbackQuery}`, { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'fuelstats_services.csv')
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
    showDialog('success', 'Service records exported successfully', '')
  } catch (err) {
    showDialog('danger', 'Export failed', getErrorMessage(err))
  }
}

// Services Import
async function importServices(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = async (e) => {
    const csvText = e.target?.result as string
    try {
      const fallbackQuery = defaultVehicle.value ? `?vehicleId=${defaultVehicle.value.id}` : ''
      await api.post(`/services/import${fallbackQuery}`, csvText, {
        headers: { 'Content-Type': 'text/csv' },
      })
      showDialog('success', 'Service records imported successfully', '')
      target.value = ''
    } catch (err) {
      showDialog('danger', 'Import failed', getErrorMessage(err))
      target.value = ''
    }
  }
  reader.readAsText(file)
}
</script>

<style lang="scss" scoped>
.settings-container {
  margin: 0 var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
  padding-top: var(--space-md);

  @media (min-width: 992px) {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: var(--space-xl);
    align-items: start;
  }
}

.settings-sidebar {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.profile-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-lg);
  background-color: var(--bg-secondary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-default);
  text-align: center;
  gap: var(--space-xs);

  .avatar {
    width: 4rem;
    height: 4rem;
    border-radius: var(--radius-round);
    background-color: var(--bg-elevated);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--border-default);
    margin-bottom: var(--space-sm);

    span {
      font-size: 2.25rem;
      color: var(--text-secondary);
    }
  }

  h2 {
    font-size: var(--font-size-xl);
    font-weight: 700;
  }

  .email {
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
  }
}

.settings-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);

  .section-title {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    color: var(--text-secondary);
    padding-left: var(--space-xs);

    span {
      font-size: 1.25rem;
    }

    h2 {
      font-size: var(--font-size-sm);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin: 0;
    }
  }
}

.data-actions-card {
  background-color: var(--bg-secondary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-default);
  padding: var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.data-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  padding: var(--space-xs) 0;

  @media (min-width: 600px) {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}

.group-info {
  display: flex;
  align-items: center;
  gap: var(--space-md);

  span {
    font-size: 2rem;
    padding: var(--space-sm);
    border-radius: var(--radius-md);
    background-color: var(--bg-elevated);
    border: 1px solid var(--border-muted);
  }

  .icon-success {
    color: var(--accent-success);
  }

  .icon-warning {
    color: var(--accent-warning);
  }

  h3 {
    font-size: var(--font-size-base);
    font-weight: 650;
    margin-bottom: 2px;
  }

  p {
    font-size: 0.8rem;
    color: var(--text-secondary);
  }
}

.buttons-row {
  display: flex;
  flex-direction: row;
  gap: var(--space-sm);
  align-items: center;
  justify-content: flex-start;

  .btn-action {
    width: 7.5rem;
    font-size: 0.8rem;
    background-color: var(--bg-elevated);
    border: 1px solid var(--border-default);
    transition: background-color 150ms ease, border-color 150ms ease;

    &:hover {
      background-color: var(--bg-hover);
    }
  }

  .btn-import-success:hover {
    border-color: var(--accent-success);
  }

  .btn-import-warning:hover {
    border-color: var(--accent-warning);
  }
}

.divider {
  height: 1px;
  background-color: var(--border-muted);
  width: 100%;
}

.logout-section {
  display: flex;
  justify-content: center;
  margin-top: var(--space-md);
  margin-bottom: var(--space-xl);

  @media (min-width: 992px) {
    margin-bottom: 0;
  }
}

#btn-signout {
  width: 9rem;
  background-color: var(--color-danger);
  color: var(--text-primary);
  font-weight: 600;
  transition: background-color 150ms ease;

  &:hover {
    background-color: var(--color-danger-hover);
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
