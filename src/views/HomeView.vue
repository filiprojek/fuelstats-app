<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import api from '@/lib/api'
import { useVehicles } from '@/composables/useVehicles'
import StatCard from '@/components/StatCard.vue'
import LineChart from '@/components/LineChart.vue'

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

// Refs
const refuels = ref<RefuelRecord[]>([])
const isLoading = ref(true)

// Composables
const { vehicles, fetchVehicles } = useVehicles()

// Fetch refuels
async function fetchRefuels() {
  try {
    const res = await api.get('/refuels')
    refuels.value = res.data
  } catch (err) {
    console.error('Failed to fetch refuels for dashboard:', err)
  }
}

// Load all data
onMounted(async () => {
  isLoading.value = true
  await Promise.all([fetchVehicles(), fetchRefuels()])
  isLoading.value = false
})

// Calculations
const defaultVehicle = computed(() => {
  return vehicles.value.find((v) => v.isDefault) || vehicles.value[0] || null
})

const activeVehicleRefuels = computed(() => {
  if (!defaultVehicle.value) return []
  return refuels.value
    .filter((r) => r.vehicleId === defaultVehicle.value!.id)
    .sort((a, b) => new Date(a.date || a.createdAt).getTime() - new Date(b.date || b.createdAt).getTime())
})

const avgConsumptionAllTime = computed(() => {
  const list = activeVehicleRefuels.value
  if (list.length < 2) return 'N/A'

  const totalLiters = list.slice(1).reduce((sum, r) => sum + r.liters, 0)
  const totalDistance = list[list.length - 1]!.mileage - list[0]!.mileage
  if (totalDistance <= 0) return 'N/A'

  return `${(100 * totalLiters / totalDistance).toFixed(2)} L/100`
})

const consumptionSinceLastRefuel = computed(() => {
  const list = activeVehicleRefuels.value
  if (list.length < 2) return 'N/A'

  const last = list[list.length - 1]!
  const prev = list[list.length - 2]!
  const distance = last.mileage - prev.mileage
  if (distance <= 0) return 'N/A'

  return `${(100 * last.liters / distance).toFixed(2)} L/100`
})

const distanceSinceLastRefuel = computed(() => {
  const list = activeVehicleRefuels.value
  if (list.length < 2) return 'N/A'
  const last = list[list.length - 1]!
  const prev = list[list.length - 2]!
  const dist = last.mileage - prev.mileage
  return dist >= 0 ? `${dist.toLocaleString()} km` : 'N/A'
})

function getDistanceForDays(days: number | null): string {
  const list = activeVehicleRefuels.value
  if (list.length < 2) return 'N/A'

  let filtered = list
  if (days !== null) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    filtered = list.filter((r) => new Date(r.date || r.createdAt).getTime() >= cutoffDate.getTime())
  }

  if (filtered.length === 0) return '0 km'

  const latestInPeriod = filtered[filtered.length - 1]!
  const earliestInPeriod = filtered[0]!

  // Find the refuel record right before earliestInPeriod
  const earliestIndex = list.findIndex((r) => r.id === earliestInPeriod.id)
  let startMileage = earliestInPeriod.mileage
  if (earliestIndex > 0) {
    startMileage = list[earliestIndex - 1]!.mileage
  }

  const dist = latestInPeriod.mileage - startMileage
  return dist >= 0 ? `${dist.toLocaleString()} km` : 'N/A'
}

// Chart Data
const gasPriceChartData = computed(() => {
  const list = activeVehicleRefuels.value.slice(-14)
  return {
    labels: list.map((r) =>
      new Date(r.date || r.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    ),
    data: list.map((r) => r.pricePerLiter),
  }
})

const consumptionTrendChartData = computed(() => {
  const list = activeVehicleRefuels.value
  const trendData: number[] = []
  const trendLabels: string[] = []

  for (let i = 1; i < list.length; i++) {
    const distance = list[i]!.mileage - list[i - 1]!.mileage
    if (distance > 0) {
      trendData.push((100 * list[i]!.liters) / distance)
      trendLabels.push(
        new Date(list[i]!.date || list[i]!.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      );
    }
  }

  return {
    labels: trendLabels.slice(-14),
    data: trendData.slice(-14),
  }
})
</script>

<template>
  <div v-if="isLoading" class="loading-state">
    <span class="material-symbols-outlined spin">sync</span>
    <p>Loading dashboard statistics...</p>
  </div>

  <div v-else-if="!defaultVehicle" class="empty-state">
    <span class="material-symbols-outlined">directions_car</span>
    <h3>No vehicles found</h3>
    <p>Add a vehicle to start tracking your fuel consumption and stats.</p>
    <RouterLink to="/add" class="btn-primary">
      <span class="material-symbols-outlined">add</span>
      Add Vehicle
    </RouterLink>
  </div>

  <div v-else class="dashboard-content">
    <section id="default-car">
      <div id="default-car-card">
        <div class="left-wrp">
          <span class="material-symbols-outlined material-fill icon-car">directions_car</span>
          <div>
            <b>{{ defaultVehicle.name }}</b>
            <p>{{ defaultVehicle.registrationPlate.toUpperCase() }}</p>
          </div>
        </div>
        <span class="material-symbols-outlined material-fill" id="icon-favorite">star</span>
      </div>
    </section>

    <!-- Stats Section -->
    <section id="refuel-stats">
      <h2>Refuel stats</h2>
      <div class="card-grid">
        <StatCard label="Avg consumption" :value="avgConsumptionAllTime" />
        <StatCard label="Since last refuel" :value="consumptionSinceLastRefuel" />
      </div>
    </section>

    <!-- Distance Driven -->
    <section id="kilometers-driven">
      <h2>Kilometers driven</h2>
      <div class="card-grid">
        <StatCard label="Since last refuel" :value="distanceSinceLastRefuel" />
        <StatCard label="Past month" :value="getDistanceForDays(30)" />
        <StatCard label="Past 6 months" :value="getDistanceForDays(180)" />
        <StatCard label="Past year" :value="getDistanceForDays(365)" />
        <StatCard label="All time" :value="getDistanceForDays(null)" />
      </div>
    </section>

    <!-- Refuel Data warning if not enough data for charts -->
    <section id="refuels-status-card" v-if="activeVehicleRefuels.length < 2">
      <div class="info-card">
        <span class="material-symbols-outlined">analytics</span>
        <h3>Not enough data for charts</h3>
        <p>Log at least 2 refuels for this vehicle to generate charts and trends.</p>
        <RouterLink to="/add" class="btn-primary mini">
          <span class="material-symbols-outlined">add</span>
          Add Refuel
        </RouterLink>
      </div>
    </section>

    <template v-else>
      <div class="charts-grid">
        <!-- Gas Price Chart -->
        <section id="gas-price">
          <h2>Gas price (last 14 refuels)</h2>
          <LineChart
            :labels="gasPriceChartData.labels"
            :data="gasPriceChartData.data"
            label="Price/L"
            borderColor="#3fb950"
            backgroundColor="#3fb95033"
          />
        </section>

        <!-- Consumption Trend Chart -->
        <section id="consumption-trend">
          <h2>Consumption trend</h2>
          <LineChart
            :labels="consumptionTrendChartData.labels"
            :data="consumptionTrendChartData.data"
            label="L/100km"
            borderColor="#a29bb2"
            backgroundColor="#a29bb233"
          />
        </section>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
h2,
.card-grid,
#default-car-card,
.linechart,
.info-card {
  margin: 0 var(--space-md);
}

h1,
h2 {
  margin-top: var(--space-md);
  margin-bottom: var(--space-sm);
}

#default-car-card {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  background-color: var(--color-primary);
  border-radius: var(--radius-md);
  padding: var(--space-md);

  .left-wrp {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: var(--space-md);
  }

  .icon-car {
    font-size: 2.25rem;
  }
}

#icon-favorite {
  color: var(--color-favorite);
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(155px, 1fr));
  align-items: stretch;
  gap: var(--space-md);
}

.card-grid>* {
  width: 100%;
  min-width: 0;
}

/* Loading & Empty States */
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
  margin: var(--space-xl) var(--space-md);

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

  &.mini {
    padding: var(--space-xs) var(--space-md);
    font-size: var(--font-size-sm);
    span {
      font-size: 1.1rem;
    }
  }
}

#refuels-status-card {
  margin-top: var(--space-xl);
}

.info-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-lg);
  background-color: var(--bg-secondary);
  border-radius: var(--radius-lg);
  border: 1px dashed var(--border-default);
  text-align: center;
  gap: var(--space-xs);

  span {
    font-size: 2rem;
    color: var(--text-secondary);
  }

  h3 {
    font-size: var(--font-size-base);
    font-weight: 600;
  }

  p {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    margin-bottom: var(--space-sm);
  }
}

.charts-grid {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);

  @media (min-width: 768px) {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-lg);
    margin: 0 var(--space-md);

    section {
      margin: 0;

      h2,
      .linechart {
        margin-left: 0;
        margin-right: 0;
      }
    }
  }
}
</style>
