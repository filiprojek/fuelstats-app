<template>
  <div class="service-overview-card">
    <div class="overview-header">
      <span class="material-symbols-outlined header-icon">calendar_today</span>
      <h2>Service Schedule</h2>
    </div>

    <div v-if="isLoading" class="overview-loading">
      <span class="material-symbols-outlined spin">sync</span>
      <span>Loading schedule...</span>
    </div>

    <div v-else-if="services.length === 0" class="overview-empty">
      <span class="material-symbols-outlined empty-icon">build_circle</span>
      <p>No service intervals configured for this vehicle.</p>
      <router-link to="/vehicles" class="btn-setup">Configure Plans</router-link>
    </div>

    <div v-else class="services-list">
      <div
        v-for="item in sortedServices"
        :key="item.serviceTaskId"
        class="service-item"
        :class="item.status.toLowerCase()"
      >
        <div class="item-main">
          <div class="item-info">
            <h4 class="service-name">{{ item.serviceTaskName }}</h4>
            <p class="service-due">
              Target:
              <span class="due-val" v-if="item.intervalKm">{{ item.nextServiceOdometer.toLocaleString() }} km</span>
              <span v-if="item.intervalKm && item.intervalMonths"> or </span>
              <span class="due-val" v-if="item.intervalMonths">{{ formatDate(item.nextServiceDate) }}</span>
            </p>
          </div>
          
          <div class="item-badge-wrp">
            <span class="status-badge" :class="item.status.toLowerCase()">
              {{ formatStatusText(item) }}
            </span>
            <button class="btn-record" @click="recordService(item)" title="Record service log">
              <span class="material-symbols-outlined">add_task</span>
            </button>
          </div>
        </div>

        <!-- Progress Bar representing life elapsed -->
        <div class="progress-container">
          <div
            class="progress-bar"
            :class="item.status.toLowerCase()"
            :style="{ width: `${getProgressPercent(item)}%` }"
          ></div>
        </div>
        <div class="progress-labels">
          <span class="pct-label">{{ Math.round(getProgressPercent(item)) }}% elapsed</span>
          <span class="remaining-label">{{ formatCountdownText(item) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/lib/api'

const props = defineProps<{
  vehicleId: string
}>()

const router = useRouter()
const isLoading = ref(false)
const services = ref<any[]>([])
const currentOdometer = ref(0)

const sortedServices = computed(() => {
  return [...services.value].sort((a, b) => {
    const priorityMap: Record<string, number> = { OVERDUE: 1, WARNING: 2, OK: 3 }
    const priorityA = priorityMap[a.status] || 99
    const priorityB = priorityMap[b.status] || 99
    if (priorityA !== priorityB) {
      return priorityA - priorityB
    }

    const progressA = getProgressPercent(a)
    const progressB = getProgressPercent(b)
    return progressB - progressA // Sort by highest percentage of life used first
  })
})

async function fetchStatus() {
  if (!props.vehicleId || props.vehicleId === 'all') return
  isLoading.value = true
  try {
    const res = await api.get(`/vehicles/${props.vehicleId}/service-status`)
    services.value = res.data.status || []
    currentOdometer.value = res.data.currentOdometer || 0
  } catch (err) {
    console.error('Failed to fetch service status:', err)
  } finally {
    isLoading.value = false
  }
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function getProgressPercent(item: any): number {
  let percentKm = 0
  let percentTime = 0

  if (item.intervalKm !== null && item.lastServiceOdometer !== null) {
    const elapsed = currentOdometer.value - item.lastServiceOdometer
    percentKm = (elapsed / item.intervalKm) * 100
  }

  if (item.intervalMonths !== null && item.remainingDays !== null) {
    const totalDays = item.intervalMonths * 30.4375
    const elapsed = totalDays - item.remainingDays
    percentTime = (elapsed / totalDays) * 100
  }

  const finalPercent = Math.max(percentKm, percentTime)
  return Math.min(100, Math.max(0, finalPercent))
}

function formatStatusText(item: any) {
  if (item.status === 'OVERDUE') return 'Overdue'
  if (item.status === 'WARNING') return 'Due soon'
  return 'OK'
}

function formatCountdownText(item: any) {
  const parts: string[] = []

  if (item.intervalKm !== null && item.remainingKm !== null) {
    if (item.remainingKm < 0) {
      parts.push(`${Math.abs(item.remainingKm).toLocaleString()} km past due`)
    } else {
      parts.push(`${item.remainingKm.toLocaleString()} km left`)
    }
  }

  if (item.intervalMonths !== null && item.remainingDays !== null) {
    if (item.remainingDays < 0) {
      parts.push(`${Math.abs(item.remainingDays)} days past due`)
    } else {
      parts.push(`${item.remainingDays} days left`)
    }
  }

  if (parts.length === 2) {
    return item.remainingKm! < 0 || item.remainingDays! < 0
      ? `${parts[0]} / ${parts[1]}`
      : `${parts[0]} or ${parts[1]}`
  }
  return parts[0] || ''
}

function recordService(item: any) {
  const today = new Date().toISOString().split('T')[0]
  router.push({
    path: '/add/service',
    query: {
      vehicleId: props.vehicleId,
      serviceTaskId: item.serviceTaskId,
      serviceType: item.serviceTaskName,
      odometer: currentOdometer.value,
      date: today,
    },
  })
}

watch(() => props.vehicleId, fetchStatus)
onMounted(fetchStatus)
</script>

<style lang="scss" scoped>
.service-overview-card {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  margin-top: var(--space-xl);
  margin-bottom: var(--space-xl);
  box-shadow: var(--shadow-sm);
}

.overview-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
  border-bottom: 1px solid var(--border-muted);
  padding-bottom: var(--space-sm);

  .header-icon {
    font-size: 1.5rem;
    color: var(--color-primary-light);
  }

  h2 {
    font-size: 1.2rem;
    font-weight: 700;
    margin: 0;
    color: var(--text-primary);
  }
}

.overview-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  color: var(--text-muted);
  padding: var(--space-lg) 0;

  .spin {
    animation: spin 1.5s linear infinite;
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.overview-empty {
  text-align: center;
  padding: var(--space-lg) var(--space-md);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  color: var(--text-muted);

  .empty-icon {
    font-size: 3rem;
    color: var(--border-default);
  }

  p {
    margin: 0;
    font-size: 0.9rem;
  }

  .btn-setup {
    margin-top: var(--space-xs);
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-primary);
    background-color: var(--color-primary);
    padding: var(--space-xs) var(--space-md);
    border-radius: var(--radius-md);
    text-decoration: none;
    transition: background-color 150ms ease;

    &:hover {
      background-color: var(--color-primary-hover);
    }
  }
}

.services-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.service-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  padding: var(--space-sm) 0;
  border-bottom: 1px solid var(--border-muted);

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
}

.item-main {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-md);
}

.item-info {
  text-align: left;

  .service-name {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .service-due {
    margin: 2px 0 0 0;
    font-size: 0.8rem;
    color: var(--text-secondary);

    .due-val {
      color: var(--text-primary);
      font-weight: 600;
    }
  }
}

.item-badge-wrp {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.status-badge {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  text-transform: uppercase;
  letter-spacing: 0.5px;

  &.ok {
    background-color: rgba(63, 185, 80, 0.1);
    color: #58a6ff;
  }

  &.warning {
    background-color: rgba(210, 153, 34, 0.1);
    color: #d29922;
  }

  &.overdue {
    background-color: rgba(248, 81, 73, 0.1);
    color: #ff7b72;
  }
}

.btn-record {
  background: transparent;
  border: 1px solid var(--border-default);
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  cursor: pointer;
  transition: all 150ms ease;

  &:hover {
    color: var(--text-primary);
    border-color: var(--color-primary-light);
    background-color: rgba(255, 255, 255, 0.05);
  }

  .material-symbols-outlined {
    font-size: 1.1rem;
  }
}

.progress-container {
  height: 6px;
  background-color: var(--bg-primary);
  border-radius: var(--radius-sm);
  overflow: hidden;
  margin-top: 4px;
  border: 1px solid var(--border-muted);
}

.progress-bar {
  height: 100%;
  border-radius: var(--radius-sm);
  transition: width 0.3s ease;

  &.ok {
    background-color: var(--color-primary-light);
  }

  &.warning {
    background-color: #d29922;
  }

  &.overdue {
    background-color: #f85149;
  }
}

.progress-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 2px;
}
</style>
