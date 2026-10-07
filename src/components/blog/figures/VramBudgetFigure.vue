<script setup lang="ts">
import { gb, vramRows } from './chart-data'
import FigureFrame from './FigureFrame.vue'
import StackedBarChart from './StackedBarChart.vue'

defineProps<{ index: number; caption: string; alt: string }>()

const data = vramRows()
const series = [
  { label: 'Weights (Q4_K_M)', color: 'var(--chart-1)' },
  { label: 'KV cache', color: 'var(--chart-2)' },
  { label: 'Runtime overhead', color: 'var(--chart-3)' },
]
const rows = data.map((row) => ({ label: row.label, values: [row.weights, row.kv, row.overhead] }))
const thresholds = [8, 12, 16, 24].map((value) => ({ value, label: `${value} GB` }))

const table = {
  head: ['Configuration', 'Weights', 'KV cache', 'Overhead', 'Total'],
  rows: data.map((row) => [row.label, gb(row.weights), gb(row.kv), gb(row.overhead), gb(row.total)]),
  numeric: [1, 2, 3, 4],
}
</script>

<template>
  <FigureFrame :index="index" :caption="caption" :alt="alt" :table="table">
    <p class="mb-4 text-sm text-muted-foreground">Llama-3.1-8B, one sequence. Dashed lines mark common GPU memory sizes.</p>
    <StackedBarChart
      :series="series"
      :rows="rows"
      :max="25"
      :ticks="[0, 4, 8, 12, 16, 20, 24]"
      :thresholds="thresholds"
      :format="gb"
      :tick-format="(value: number) => `${value}`"
    />
  </FigureFrame>
</template>
