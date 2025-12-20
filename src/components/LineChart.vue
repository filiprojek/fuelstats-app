<script setup lang="ts">
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line } from 'vue-chartjs'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

const chartData = {
  labels: ['2025-01-01', '2025-01-02', '2025-01-03', '2025-01-04', '2025-01-05'],
  datasets: [
    {
      label: 'Consumption (L/100km)',
      data: [6.4, 6.3, 6.5, 6.2, 6.1],
      borderColor: '#4a4458',
      backgroundColor: '#4a445833',
      tension: 0.3,
      fill: false,
    },
  ],
}

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: false,
    },
  },
}
</script>

<template>
  <div class="linechart" style="height: 300px">
    <Line :data="chartData" :options="chartOptions" />
  </div>
</template>
