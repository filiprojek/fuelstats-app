<template>
  <div v-if="isLoading" class="alerts-loading">
    <span class="material-symbols-outlined spin">sync</span>
    <span>Checking maintenance plans...</span>
  </div>

  <div v-else-if="activeAlerts.length > 0" class="service-alerts-container">
    <div
      v-for="alert in activeAlerts"
      :key="alert.serviceTaskId"
      class="alert-card"
      :class="alert.status.toLowerCase()"
    >
      <div class="alert-icon-wrp">
        <span class="material-symbols-outlined alert-icon">
          {{ alert.status === 'OVERDUE' ? 'error' : 'warning' }}
        </span>
      </div>
      <div class="alert-content">
        <h4 class="alert-title">
          {{ alert.status === 'OVERDUE' ? 'Overdue' : 'Due soon' }}: {{ alert.serviceTaskName }}
        </h4>
        <p class="alert-details">
          {{ formatRemainingText(alert) }}
        </p>
      </div>
      <button class="btn-action" @click="recordService(alert)">
        <span class="material-symbols-outlined">build</span>
        <span>Record service</span>
      </button>
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
const alerts = ref<any[]>([])
const currentOdometer = ref(0)

const activeAlerts = computed(() => {
  return alerts.value.filter((a) => a.status === 'WARNING' || a.status === 'OVERDUE')
})

async function fetchStatus() {
  if (!props.vehicleId || props.vehicleId === 'all') return
  isLoading.value = true
  try {
    const res = await api.get(`/vehicles/${props.vehicleId}/service-status`)
    alerts.value = res.data.status || []
    currentOdometer.value = res.data.currentOdometer || 0
  } catch (err) {
    console.error('Failed to fetch service status:', err)
  } finally {
    isLoading.value = false
  }
}

function formatRemainingText(alert: any) {
  const parts: string[] = []
  
  if (alert.intervalKm !== null && alert.remainingKm !== null) {
    if (alert.remainingKm < 0) {
      parts.push(`overdue by ${Math.abs(alert.remainingKm).toLocaleString()} km`)
    } else {
      parts.push(`${alert.remainingKm.toLocaleString()} km remaining`)
    }
  }

  if (alert.intervalMonths !== null && alert.remainingDays !== null) {
    if (alert.remainingDays < 0) {
      parts.push(`overdue by ${Math.abs(alert.remainingDays)} days`)
    } else {
      parts.push(`${alert.remainingDays} days remaining`)
    }
  }

  if (parts.length === 2) {
    return `${parts[0]} or ${parts[1]}`
  }
  return parts[0] || ''
}

function recordService(alert: any) {
  const today = new Date().toISOString().split('T')[0]
  router.push({
    path: '/add/service',
    query: {
      vehicleId: props.vehicleId,
      serviceTaskId: alert.serviceTaskId,
      serviceType: alert.serviceTaskName,
      odometer: currentOdometer.value,
      date: today,
    },
  })
}

// Re-fetch when vehicle ID changes
watch(() => props.vehicleId, fetchStatus)

onMounted(fetchStatus)
</script>

<style lang="scss" scoped>
.alerts-loading {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  color: var(--text-muted);
  font-size: 0.9rem;
  padding: var(--space-md);
  background-color: var(--bg-secondary);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-default);
  margin-top: var(--space-md);
  margin-bottom: var(--space-md);

  .spin {
    animation: spin 1.5s linear infinite;
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.service-alerts-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  margin-top: var(--space-md);
  margin-bottom: var(--space-md);
}

.alert-card {
  display: flex;
  align-items: center;
  padding: 0.85rem 1.25rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-default);
  transition: transform 150ms ease, box-shadow 150ms ease, border-color 150ms ease;
  background-color: var(--bg-secondary);
  gap: var(--space-md);

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  &.overdue {
    border-left: 4px solid #f85149;
    border-color: rgba(248, 81, 73, 0.2) rgba(248, 81, 73, 0.2) rgba(248, 81, 73, 0.2) #f85149;
    background-color: rgba(248, 81, 73, 0.03);

    .alert-icon {
      color: #f85149;
    }
    
    .alert-title {
      color: #ff7b72;
    }
  }

  &.warning {
    border-left: 4px solid #d29922;
    border-color: rgba(210, 153, 34, 0.2) rgba(210, 153, 34, 0.2) rgba(210, 153, 34, 0.2) #d29922;
    background-color: rgba(210, 153, 34, 0.03);

    .alert-icon {
      color: #d29922;
    }

    .alert-title {
      color: #d29922;
    }
  }

  .alert-icon-wrp {
    display: flex;
    align-items: center;
    justify-content: center;

    .alert-icon {
      font-size: 1.6rem;
      font-variation-settings: 'FILL' 1;
    }
  }

  .alert-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;

    .alert-title {
      margin: 0;
      font-weight: 600;
      font-size: 0.95rem;
      text-align: left;
    }

    .alert-details {
      margin: 0;
      font-size: 0.825rem;
      color: var(--text-secondary);
      text-align: left;
    }
  }

  .btn-action {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    background-color: var(--bg-primary);
    color: var(--text-primary);
    border: 1px solid var(--border-default);
    padding: 0.4rem 0.85rem;
    border-radius: var(--radius-md);
    font-size: 0.825rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 150ms, border-color 150ms;

    &:hover {
      background-color: var(--border-default);
      border-color: var(--text-muted);
    }

    .material-symbols-outlined {
      font-size: 1rem;
    }
  }

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-md);

    .alert-icon-wrp {
      margin-right: 0;
    }

    .btn-action {
      width: 100%;
      justify-content: center;
    }
  }
}
</style>
