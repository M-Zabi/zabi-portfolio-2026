<script setup lang="ts">
import { useInView, useReducedMotion } from 'motion-v'
import { computed, ref, useTemplateRef } from 'vue'

import { CONTEXT_WINDOW, contextSegments, kTokens } from './chart-data'
import FigureFrame from './FigureFrame.vue'

defineProps<{ index: number; caption: string; alt: string }>()

const colors = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)']
const used = contextSegments.reduce((sum, segment) => sum + segment.tokens, 0)
const free = CONTEXT_WINDOW - used

const root = useTemplateRef<HTMLElement>('root')
const inView = useInView(root, { once: true, margin: '0px 0px -15% 0px' })
const reducedMotion = useReducedMotion()
const shown = computed(() => inView.value || reducedMotion.value)
const active = ref<number | null>(null)

const share = (tokens: number) => `${Math.round((tokens / CONTEXT_WINDOW) * 100)}%`

const table = {
  head: ['Segment', 'Tokens', 'Share of window'],
  rows: [
    ...contextSegments.map((segment) => [segment.label, segment.tokens.toLocaleString('en-US'), share(segment.tokens)]),
    ['Unused', free.toLocaleString('en-US'), share(free)],
  ],
  numeric: [1, 2],
}
</script>

<template>
  <FigureFrame :index="index" :caption="caption" :alt="alt" :table="table">
    <div ref="root" @pointerleave="active = null">
      <div class="flex items-baseline justify-between gap-4">
        <p class="text-sm text-muted-foreground">One request, 40 minutes into a refactor</p>
        <p class="tabular text-sm font-medium">{{ kTokens(used) }} / {{ kTokens(CONTEXT_WINDOW) }} tokens</p>
      </div>

      <div class="relative mt-4">
        <div class="flex h-6 w-full gap-[2px] overflow-hidden rounded-r-[4px] bg-muted">
          <span
            v-for="(segment, i) in contextSegments"
            :key="segment.key"
            class="segment h-full transition-[opacity,transform] duration-[900ms] ease-out-expo"
            :class="[active !== null && active !== i && 'opacity-40', shown ? 'scale-x-100' : 'scale-x-0']"
            :style="{
              flexBasis: share(segment.tokens),
              background: colors[i],
              transitionDelay: shown && !reducedMotion ? `${i * 90}ms` : '0ms',
            }"
            @pointerenter="active = i"
          />
        </div>
        <div class="relative mt-2 h-4 text-[0.6875rem] text-muted-foreground" aria-hidden="true">
          <span v-for="value in [0, 50_000, 100_000, 150_000, 200_000]" :key="value" class="tabular absolute -translate-x-1/2 first:translate-x-0 last:-translate-x-full" :style="{ left: `${(value / CONTEXT_WINDOW) * 100}%` }">
            {{ kTokens(value) }}
          </span>
        </div>
      </div>

      <ul class="mt-6 grid gap-x-6 gap-y-3 sm:grid-cols-2">
        <li
          v-for="(segment, i) in contextSegments"
          :key="segment.key"
          class="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 transition-colors"
          :class="active === i && 'bg-muted'"
          @pointerenter="active = i"
        >
          <span class="flex items-center gap-2.5 text-sm">
            <span class="size-3 rounded-[3px]" :style="{ background: colors[i] }" />
            {{ segment.label }}
          </span>
          <span class="tabular text-sm"><span class="font-medium">{{ kTokens(segment.tokens) }}</span> <span class="text-muted-foreground">· {{ share(segment.tokens) }}</span></span>
        </li>
        <li class="flex items-center justify-between gap-3 px-2 py-1.5">
          <span class="flex items-center gap-2.5 text-sm text-muted-foreground">
            <span class="size-3 rounded-[3px] bg-muted ring-1 ring-border" />
            Unused
          </span>
          <span class="tabular text-sm text-muted-foreground">{{ kTokens(free) }} · {{ share(free) }}</span>
        </li>
      </ul>
    </div>
  </FigureFrame>
</template>

<style scoped>
.segment {
  transform-origin: left center;
}
</style>
