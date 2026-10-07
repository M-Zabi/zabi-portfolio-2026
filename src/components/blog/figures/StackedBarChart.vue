<script setup lang="ts">
import { useInView, useReducedMotion } from 'motion-v'
import { computed, ref, useTemplateRef } from 'vue'

/**
 * Horizontal stacked bars, drawn in HTML so labels stay crisp and legible at any width.
 *
 * Mark spec (dataviz skill): bars ≤ 24px, square at the baseline with a 4px rounded data end,
 * a 2px surface gap between segments, solid hairline gridlines, text in text tokens only,
 * a legend for ≥ 2 series, totals as direct labels at the tip, and a hover tooltip per row.
 */
export interface ChartSeries {
  label: string
  /** CSS colour — one of the --chart-* slots, in order. */
  color: string
}

export interface ChartRow {
  label: string
  sublabel?: string
  values: number[]
}

const props = defineProps<{
  series: ChartSeries[]
  rows: ChartRow[]
  max: number
  ticks: number[]
  format: (value: number) => string
  tickFormat?: (value: number) => string
  /** Capacity lines, e.g. GPU memory sizes. Drawn dashed because they are thresholds, not grid. */
  thresholds?: { value: number; label: string }[]
  /** Highlights one row (the article's subject); the rest stay full colour. */
  emphasis?: string
}>()

const root = useTemplateRef<HTMLElement>('root')
const inView = useInView(root, { once: true, margin: '0px 0px -15% 0px' })
const reducedMotion = useReducedMotion()
const shown = computed(() => inView.value || reducedMotion.value)

const active = ref<number | null>(null)

const totals = computed(() => props.rows.map((row) => row.values.reduce((sum, value) => sum + value, 0)))
const percent = (value: number) => `${Math.min(100, (value / props.max) * 100)}%`
const tick = (value: number) => (props.tickFormat ?? props.format)(value)

/** Gridlines step aside where a threshold line already marks the value. */
const gridTicks = computed(() => props.ticks.filter((value) => !props.thresholds?.some((line) => line.value === value)))

/** Below the hovered row in the top half, above it in the bottom half, so it never clips. */
const tooltipStyle = computed(() => {
  if (active.value === null) return {}
  const offset = props.thresholds?.length ? 1.5 : 0
  const below = active.value < props.rows.length / 2
  return {
    left: tooltipLeft.value,
    top: `${offset + active.value * 2.5 + (below ? 2.4 : 0.1)}rem`,
    transform: `translate(-50%, ${below ? '0' : '-100%'})`,
  }
})

const tooltipLeft = computed(() => {
  if (active.value === null) return '0%'
  const end = (totals.value[active.value]! / props.max) * 100
  return `${Math.min(Math.max(end, 18), 62)}%`
})
</script>

<template>
  <div ref="root" class="stacked-chart" @pointerleave="active = null">
    <ul class="mb-5 flex flex-wrap gap-x-5 gap-y-2" aria-hidden="true">
      <li v-for="item in series" :key="item.label" class="flex items-center gap-2 text-xs text-muted-foreground">
        <span class="size-2.5 rounded-[3px]" :style="{ background: item.color }" />
        {{ item.label }}
      </li>
    </ul>

    <div class="grid grid-cols-[minmax(6.5rem,auto)_minmax(0,1fr)_auto] gap-x-3 sm:gap-x-4">
      <!-- Row labels -->
      <div :class="{ 'pt-6': thresholds?.length }">
        <div
          v-for="(row, index) in rows"
          :key="row.label"
          class="flex h-10 flex-col justify-center leading-tight transition-opacity duration-200"
          :class="active !== null && active !== index && 'opacity-45'"
        >
          <span class="text-[0.8125rem] font-medium" :class="emphasis === row.label && 'text-foreground'">{{ row.label }}</span>
          <span v-if="row.sublabel" class="text-label hidden text-[0.625rem] text-muted-foreground sm:block">{{ row.sublabel }}</span>
        </div>
      </div>

      <!-- Plot -->
      <div class="relative" :class="{ 'pt-6': thresholds?.length }">
        <span
          v-for="value in gridTicks"
          :key="`grid-${value}`"
          class="absolute top-0 bottom-0 w-px bg-border"
          :style="{ left: percent(value) }"
          aria-hidden="true"
        />
        <template v-for="line in thresholds" :key="`th-${line.value}`">
          <span class="threshold absolute top-5 bottom-0 w-0 border-l border-dashed border-foreground/35" :style="{ left: percent(line.value) }" aria-hidden="true" />
          <span
            class="text-label absolute top-0 -translate-x-1/2 text-[0.5625rem] whitespace-nowrap text-muted-foreground"
            :style="{ left: percent(line.value) }"
            aria-hidden="true"
          >{{ line.label }}</span>
        </template>

        <div
          v-for="(row, index) in rows"
          :key="row.label"
          class="relative flex h-10 items-center"
          @pointerenter="active = index"
        >
          <div
            class="bar flex h-5 gap-[2px] transition-[opacity,transform] duration-[900ms] ease-out-expo"
            :class="[active !== null && active !== index && 'opacity-45', shown ? 'scale-x-100' : 'scale-x-0']"
            :style="{ width: percent(totals[index]!), transitionDelay: shown && !reducedMotion ? `${index * 45}ms` : '0ms' }"
          >
            <span
              v-for="(value, segment) in row.values"
              :key="segment"
              class="h-full min-w-[2px] first:rounded-l-none last:rounded-r-[4px]"
              :style="{ flexGrow: value, flexBasis: 0, background: series[segment]?.color }"
            />
          </div>
        </div>

        <!-- Tooltip -->
        <div
          v-if="active !== null"
          class="pointer-events-none absolute z-10 w-56 rounded-xl border border-border bg-popover p-3 text-xs shadow-xl"
          :style="tooltipStyle"
          aria-hidden="true"
        >
          <p class="font-medium text-foreground">{{ rows[active]!.label }}</p>
          <ul class="mt-2 space-y-1.5">
            <li v-for="(item, segment) in series" :key="item.label" class="flex items-center justify-between gap-3 text-muted-foreground">
              <span class="flex items-center gap-2">
                <span class="size-2 rounded-[2px]" :style="{ background: item.color }" />
                {{ item.label }}
              </span>
              <span class="tabular text-foreground">{{ format(rows[active]!.values[segment] ?? 0) }}</span>
            </li>
          </ul>
          <p class="mt-2 flex justify-between border-t border-border pt-2 font-medium">
            <span>Total</span>
            <span class="tabular">{{ format(totals[active]!) }}</span>
          </p>
        </div>

        <!-- Axis -->
        <div class="relative mt-2 h-4" aria-hidden="true">
          <span
            v-for="value in ticks"
            :key="`tick-${value}`"
            class="tabular absolute -translate-x-1/2 text-[0.6875rem] text-muted-foreground first:translate-x-0"
            :style="{ left: percent(value) }"
          >{{ tick(value) }}</span>
        </div>
      </div>

      <!-- Totals: direct labels at the tip -->
      <div :class="{ 'pt-6': thresholds?.length }">
        <div
          v-for="(row, index) in rows"
          :key="row.label"
          class="tabular flex h-10 items-center justify-end text-[0.8125rem] font-medium transition-opacity duration-200"
          :class="active !== null && active !== index && 'opacity-45'"
        >
          {{ format(totals[index]!) }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bar {
  transform-origin: left center;
}
</style>
