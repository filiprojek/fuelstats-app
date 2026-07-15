<script setup lang="ts">
import { computed } from 'vue'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js'
import { Line } from 'vue-chartjs'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

const props = withDefaults(
  defineProps<{
    labels: string[]
    data: number[]
    label: string
    borderColor?: string
    backgroundColor?: string
  }>(),
  {
    borderColor: '#4a4458',
    backgroundColor: '#4a445833',
  },
)

const chartData = computed(() => ({
  labels: props.labels,
  datasets: [
    {
      label: props.label,
      data: props.data,
      borderColor: props.borderColor,
      backgroundColor: props.backgroundColor,
      tension: 0.3,
      fill: false,
    },
  ],
}))

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
