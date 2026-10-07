<script setup lang="ts">
import { BrainIcon, LayersIcon, PlayIcon, ScanEyeIcon, ShieldCheckIcon } from '@lucide/vue'

import FigureFrame from './FigureFrame.vue'

defineProps<{ index: number; caption: string; alt: string }>()

/** Positions around the ring, as angles from 12 o'clock. */
const steps = [
  { icon: LayersIcon, title: 'Assemble context', body: 'Instructions, retrieved code, history', angle: 0 },
  { icon: BrainIcon, title: 'Model proposes', body: 'A tool call — never an action', angle: 72 },
  { icon: ShieldCheckIcon, title: 'Permission check', body: 'Allow · ask · deny, hooks', angle: 144 },
  { icon: PlayIcon, title: 'Host executes', body: 'Read, edit, run a command', angle: 216 },
  { icon: ScanEyeIcon, title: 'Observe', body: 'Diff, test output, errors', angle: 288 },
]

const position = (angle: number) => {
  const radians = ((angle - 90) * Math.PI) / 180
  return { left: `${50 + Math.cos(radians) * 38}%`, top: `${50 + Math.sin(radians) * 40}%` }
}
</script>

<template>
  <FigureFrame :index="index" :caption="caption" :alt="alt" surface="none">
    <!-- Ring layout when the column is wide enough -->
    <div class="relative mx-auto hidden aspect-[1.35] max-w-2xl @xl:block">
      <svg viewBox="0 0 100 74" class="absolute inset-0 size-full overflow-visible" aria-hidden="true">
        <ellipse cx="50" cy="37" rx="38" ry="29.6" class="fill-none stroke-border" stroke-width="0.35" />
        <ellipse cx="50" cy="37" rx="38" ry="29.6" class="loop-dash fill-none stroke-primary" stroke-width="0.5" stroke-dasharray="2 4" />
        <circle r="1.4" class="fill-primary">
          <animateMotion dur="7s" repeatCount="indefinite" path="M50 7.4 A38 29.6 0 1 1 49.99 7.4" />
        </circle>
      </svg>
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
        <p class="text-label text-muted-foreground">Loop until</p>
        <p class="mt-1 font-display text-xl font-semibold tracking-tight">checks pass</p>
      </div>
      <div
        v-for="(step, i) in steps"
        :key="step.title"
        class="absolute w-40 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-3.5 shadow-sm"
        :style="position(step.angle)"
      >
        <p class="flex items-center gap-2 text-sm font-semibold">
          <span class="grid size-7 place-items-center rounded-full bg-muted text-foreground"><component :is="step.icon" class="size-3.5" /></span>
          <span><span class="tabular text-muted-foreground">{{ i + 1 }}.</span> {{ step.title }}</span>
        </p>
        <p class="mt-1.5 text-xs leading-snug text-muted-foreground">{{ step.body }}</p>
      </div>
    </div>

    <!-- Stacked layout on phones -->
    <ol class="space-y-2 @xl:hidden">
      <li v-for="(step, i) in steps" :key="step.title" class="relative rounded-2xl border border-border bg-card p-3.5">
        <p class="flex items-center gap-2 text-sm font-semibold">
          <span class="grid size-7 place-items-center rounded-full bg-muted"><component :is="step.icon" class="size-3.5" /></span>
          <span><span class="tabular text-muted-foreground">{{ i + 1 }}.</span> {{ step.title }}</span>
        </p>
        <p class="mt-1.5 pl-9 text-xs text-muted-foreground">{{ step.body }}</p>
      </li>
      <li class="text-label pt-1 text-center text-muted-foreground">↺ Back to 1 until checks pass</li>
    </ol>
  </FigureFrame>
</template>

<style scoped>
.loop-dash {
  animation: loop-dash 3s linear infinite;
}

@keyframes loop-dash {
  to {
    stroke-dashoffset: -24;
  }
}
</style>
