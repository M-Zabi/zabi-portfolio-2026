<script setup lang="ts">
import { computed } from 'vue'

import { TASK, taskCosts, usd } from './chart-data'
import FigureFrame from './FigureFrame.vue'
import StackedBarChart from './StackedBarChart.vue'

defineProps<{ index: number; caption: string; alt: string }>()

const costs = taskCosts()
const series = [
  { label: 'Cache reads', color: 'var(--chart-1)' },
  { label: 'Fresh input / cache writes', color: 'var(--chart-2)' },
  { label: 'Output + reasoning', color: 'var(--chart-3)' },
]

const rows = computed(() =>
  costs.map((cost) => ({ label: cost.model, sublabel: cost.provider, values: [cost.cached, cost.fresh, cost.output] })),
)

const table = {
  head: ['Model', 'Cache reads', 'Fresh input', 'Output', 'Total'],
  rows: costs.map((cost) => [cost.model, usd(cost.cached), usd(cost.fresh), usd(cost.output), usd(cost.total)]),
  numeric: [1, 2, 3, 4],
}
</script>

<template>
  <FigureFrame :index="index" :caption="caption" :alt="alt" :table="table">
    <p class="mb-4 max-w-[60ch] text-sm text-muted-foreground">
      One task = {{ TASK.turns }} turns × ({{ TASK.cachedPerTurn / 1000 }}k cached + {{ TASK.freshPerTurn / 1000 }}k fresh input,
      {{ (TASK.outputPerTurn / 1000).toFixed(1) }}k output). US dollars per task.
    </p>
    <StackedBarChart
      :series="series"
      :rows="rows"
      :max="4.5"
      :ticks="[0, 1, 2, 3, 4]"
      :format="usd"
      :tick-format="(value: number) => `$${value}`"
      emphasis="Claude Opus 5.5"
    />
  </FigureFrame>
</template>
