<script setup lang="ts">
import StatCard from '@/components/StatCard.vue'
import LineChart from '@/components/LineChart.vue'
</script>

<template>
  <section id="default-car">
    <div id="default-car-card">
      <span class="material-symbols-outlined material-fill">directions_car</span>
      <div>
        <b>Octavia</b>
        <p>9U47159</p>
      </div>
      <span class="material-symbols-outlined material-fill" id="icon-favorite">star</span>
    </div>
  </section>

  <section id="refuel-stats">
    <h2>Refuel stats</h2>
    <div class="card-grid">
      <StatCard label="Avg consumption (all time)" value="6.47 L/100km" />
      <StatCard label="Since last refuel" value="6.36 L/100km" />
    </div>
  </section>

  <section id="kilometers-driven">
    <h2>Kilometers driven</h2>
    <div class="card-grid">
      <StatCard label="Since last refuel" value="865 km" />
      <StatCard label="Past month" value="1711 km" />
      <StatCard label="Past 6 months" value="10699 km" />
      <StatCard label="Past year" value="18091 km" />
      <StatCard label="All time" value="18091 km" />
    </div>
  </section>

  <section id="gas-price">
    <h2>Gas price (last 14 refuels)</h2>
    <LineChart />
  </section>

  <section id="consumption-trend">
    <h2>Consumption trend</h2>
    <LineChart />
  </section>
</template>

<style lang="scss" scoped>
h2,
.card-grid,
#default-car-card,
.linechart {
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

  .label {
    text-align: center;
  }
}

#icon-favorite {
  color: var(--color-favorite);
}

section>* {
  display: flex;
  //flex-direction: column;
  gap: var(--space-md);
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  align-items: stretch;
  gap: var(--space-md);
}

.card-grid>* {
  width: 100%;
  min-width: 0;
}
</style>
