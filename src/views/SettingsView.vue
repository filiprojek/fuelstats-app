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
            <input type="file" ref="refuelsInput" accept=".csv" style="display: none" @change="importRefuels" />
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
              @click="openImportModal"
              inline
              elevated
            />
          </div>
        </div>
      </div>
    </section>

    <!-- App & Server Version Section -->
    <section class="settings-section">
      <div class="section-title">
        <span class="material-symbols-outlined">info</span>
        <h2>App & Server Information</h2>
      </div>

      <div class="version-card">
        <div class="version-grid">
          <div class="version-item">
            <span class="version-label">Web Client App</span>
            <div class="version-badge-group">
              <span class="version-number">v{{ appVersion }}</span>
              <span class="tag-badge">Vue 3 PWA</span>
            </div>
          </div>

          <div class="version-item">
            <span class="version-label">Backend API Server</span>
            <div class="version-badge-group">
              <span class="version-number" v-if="serverVersion">v{{ serverVersion }}</span>
              <span class="version-number text-muted" v-else>Fetching...</span>
              <span class="status-indicator" :class="{ online: !!serverVersion }">
                <span class="dot"></span>
                <span>{{ serverVersion ? 'Online' : 'Connecting' }}</span>
              </span>
            </div>
          </div>
        </div>

        <div class="version-actions">
          <IconLabelButton
            icon="history"
            label="View Release Notes / Changelog"
            class="btn-changelog"
            @click="openChangelogModal"
            inline
            elevated
          />
        </div>
      </div>
    </section>
  </div>

  <!-- Service Import Modal (Wizard) -->
  <Transition name="fade">
    <div class="modal-backdrop" v-if="isImportModalOpen" @click.self="closeImportModal">
      <div class="edit-modal import-modal">
        <h3>Import Service Records</h3>
        <p class="modal-sub">Import records from a CSV file into a selected vehicle.</p>
        
        <form @submit.prevent="handleImportSubmit">
          <label for="import_vehicle">1. Select Target Vehicle</label>
          <select id="import_vehicle" v-model="importVehicleId">
            <option v-for="vehicle in vehicles" :key="vehicle.id" :value="vehicle.id">
              {{ vehicle.name }} ({{ vehicle.registrationPlate.toUpperCase() }})
            </option>
          </select>
          
          <label>2. Choose CSV File</label>
          <div class="file-drop-area" :class="{ 'has-file': !!importFile }">
            <span class="material-symbols-outlined file-icon">
              {{ importFile ? 'draft' : 'upload_file' }}
            </span>
            <div class="file-info" v-if="importFile">
              <span class="file-name">{{ importFile.name }}</span>
              <span class="file-size">{{ formatFileSize(importFile.size) }}</span>
            </div>
            <div class="file-prompt" v-else>
              <span>Click to select CSV file</span>
            </div>
            <input type="file" accept=".csv" @change="onImportFileChange" class="file-input-field" />
          </div>

          <div class="modal-actions">
            <button type="button" class="btn-cancel" @click="closeImportModal" :disabled="isImporting">Cancel</button>
            <IconLabelButton
              type="submit"
              icon="upload"
              label="Start Import"
              inline
              elevated
              :disabled="!importVehicleId || !importFile || isImporting"
            />
          </div>
        </form>
      </div>
    </div>
  </Transition>

  <!-- Changelog Modal -->
  <Transition name="fade">
    <div class="modal-backdrop" v-if="isChangelogModalOpen" @click.self="closeChangelogModal">
      <div class="edit-modal changelog-modal">
        <div class="modal-header-row">
          <h3>Release Notes & Version History</h3>
          <button class="btn-close-icon" @click="closeChangelogModal">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div class="changelog-list">
          <div v-for="release in CHANGELOG_DATA" :key="release.version" class="release-block">
            <div class="release-header">
              <div class="release-title-group">
                <span class="release-ver">v{{ release.version }}</span>
                <span class="release-date">{{ release.date }}</span>
              </div>
              <h4 class="release-name">{{ release.title }}</h4>
            </div>

            <p class="release-highlight" v-if="release.highlight">
              {{ release.highlight }}
            </p>

            <ul class="changes-list">
              <li v-for="(change, idx) in release.changes" :key="idx" class="change-item">
                <span class="type-tag" :class="change.type">{{ change.type }}</span>
                <span class="change-text">{{ change.text }}</span>
                <code v-if="change.commit" class="commit-badge">{{ change.commit }}</code>
              </li>
            </ul>
          </div>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn-cancel" @click="closeChangelogModal">Close</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import { useVehicles } from '@/composables/useVehicles'
import { CHANGELOG_DATA } from '@/data/changelog'
import IconLabelButton from '@/components/IconLabelButton.vue'
import AppDialog from '@/components/AppDialog.vue'

// Auth Store
const auth = useAuthStore()

// Vehicles Composable (for fallback vehicle IDs on import)
const { vehicles, fetchVehicles } = useVehicles()

// Versions & Server Info state
const appVersion = ref(__APP_VERSION__)
const serverVersion = ref<string | null>(null)
const isChangelogModalOpen = ref(false)

async function fetchServerVersion() {
  try {
    const res = await api.get('/version')
    serverVersion.value = res.data.version || '1.0.0'
  } catch (err) {
    console.warn('Could not fetch server version:', err)
  }
}

function openChangelogModal() {
  isChangelogModalOpen.value = true
}

function closeChangelogModal() {
  isChangelogModalOpen.value = false
}

onMounted(() => {
  fetchVehicles()
  fetchServerVersion()
})

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

// Services Import Wizard State
const isImportModalOpen = ref(false)
const importVehicleId = ref('')
const importFile = ref<File | null>(null)
const isImporting = ref(false)

function openImportModal() {
  isImportModalOpen.value = true
  importVehicleId.value = defaultVehicle.value?.id || vehicles.value[0]?.id || ''
  importFile.value = null
}

function closeImportModal() {
  if (isImporting.value) return
  isImportModalOpen.value = false
  importFile.value = null
}

function onImportFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    importFile.value = file
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

async function handleImportSubmit() {
  if (!importFile.value || !importVehicleId.value) return
  isImporting.value = true
  
  const reader = new FileReader()
  reader.onload = async (e) => {
    const csvText = e.target?.result as string
    try {
      await api.post(`/services/import?vehicleId=${importVehicleId.value}`, csvText, {
        headers: { 'Content-Type': 'text/csv' },
      })
      showDialog('success', 'Service records imported successfully', '')
      closeImportModal()
    } catch (err) {
      showDialog('danger', 'Import failed', getErrorMessage(err))
    } finally {
      isImporting.value = false
    }
  }
  reader.readAsText(importFile.value)
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
    transition:
      background-color 150ms ease,
      border-color 150ms ease;

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

/* Import Modal Styles */
.modal-sub {
  color: var(--text-secondary);
  font-size: 0.875rem;
  margin-top: -0.25rem;
  margin-bottom: var(--space-xs);
  text-align: left;
}

.file-drop-area {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2px dashed var(--border-default);
  border-radius: var(--radius-md);
  padding: var(--space-xl) var(--space-md);
  text-align: center;
  cursor: pointer;
  background-color: var(--bg-primary);
  transition: border-color 150ms ease, background-color 150ms ease;
  margin-top: var(--space-xs);

  &:hover {
    border-color: var(--color-primary-light);
    background-color: rgba(162, 155, 178, 0.05);
  }

  &.has-file {
    border-color: var(--color-success);
    border-style: solid;
    background-color: rgba(31, 136, 61, 0.02);
  }

  .file-icon {
    font-size: 2.5rem;
    color: var(--text-secondary);
    margin-bottom: var(--space-sm);
  }

  .file-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    
    .file-name {
      font-weight: 600;
      color: var(--text-primary);
      font-size: 0.9rem;
      word-break: break-all;
    }
    
    .file-size {
      font-size: 0.75rem;
      color: var(--text-secondary);
    }
  }

  .file-prompt {
    font-size: 0.875rem;
    color: var(--text-secondary);
    font-weight: 550;
  }

  .file-input-field {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
  }
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
    text-align: left;
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
      text-align: left;
      display: block;
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
      width: 100%;
      text-align: left;
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
    border: none;
    cursor: pointer;

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

/* Version Info Section */
.version-card {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);

  .version-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--space-md);

    @media (min-width: 640px) {
      grid-template-columns: 1fr 1fr;
    }
  }

  .version-item {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    text-align: left;
  }

  .version-label {
    font-size: var(--font-size-xs);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--text-secondary);
    font-weight: 700;
  }

  .version-badge-group {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }

  .version-number {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  .tag-badge {
    font-size: 0.75rem;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: var(--radius-sm);
    background-color: rgba(162, 155, 178, 0.15);
    color: var(--color-primary-light);
  }

  .status-indicator {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-secondary);

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: var(--border-default);
    }

    &.online {
      color: #3fb950;

      .dot {
        background-color: #3fb950;
        box-shadow: 0 0 6px rgba(63, 185, 80, 0.4);
      }
    }
  }

  .version-actions {
    display: flex;
    justify-content: flex-start;
    padding-top: var(--space-xs);
    border-top: 1px solid var(--border-muted);
  }
}

/* Changelog Modal Styles */
.changelog-modal {
  max-width: 38rem !important;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
}

.modal-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-xs);

  h3 {
    margin: 0;
  }

  .btn-close-icon {
    background: transparent;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    display: flex;
    align-items: center;

    &:hover {
      color: var(--text-primary);
    }
  }
}

.changelog-list {
  overflow-y: auto;
  padding-right: var(--space-xs);
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  margin: var(--space-sm) 0;
  text-align: left;
}

.release-block {
  border-bottom: 1px solid var(--border-muted);
  padding-bottom: var(--space-md);

  &:last-child {
    border-bottom: none;
  }
}

.release-header {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: var(--space-xs);
}

.release-title-group {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.release-ver {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-primary-light);
}

.release-date {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.release-name {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
}

.release-highlight {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin: var(--space-xs) 0;
  font-style: italic;
}

.changes-list {
  list-style: none;
  padding: 0;
  margin: var(--space-xs) 0 0 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.change-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: 0.825rem;
  color: var(--text-primary);
}

.type-tag {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  padding: 1px 6px;
  border-radius: var(--radius-sm);

  &.feat {
    background-color: rgba(63, 185, 80, 0.15);
    color: #58a6ff;
  }
  &.fix {
    background-color: rgba(248, 81, 73, 0.15);
    color: #ff7b72;
  }
  &.style {
    background-color: rgba(210, 153, 34, 0.15);
    color: #d29922;
  }
}

.change-text {
  flex: 1;
}

.commit-badge {
  font-family: monospace;
  font-size: 0.75rem;
  color: var(--text-muted);
  background-color: var(--bg-primary);
  padding: 1px 4px;
  border-radius: 4px;
  border: 1px solid var(--border-muted);
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
