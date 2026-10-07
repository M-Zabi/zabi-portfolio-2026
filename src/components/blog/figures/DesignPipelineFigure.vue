<script setup lang="ts">
import { CodeIcon, MessageSquareTextIcon, PaletteIcon, ScanEyeIcon, ShieldCheckIcon, SparklesIcon } from '@lucide/vue'

import FigureFrame from './FigureFrame.vue'

defineProps<{ index: number; caption: string; alt: string }>()

const steps = [
  { icon: PaletteIcon, title: 'Brand system', body: 'Tokens, type, motion, DESIGN.md', tone: 'bg-blush text-blush-foreground' },
  { icon: MessageSquareTextIcon, title: 'Constrained prompt', body: 'Name tokens, rules, anti-references', tone: 'bg-card' },
  { icon: SparklesIcon, title: 'Generate wide', body: 'Many cheap directions, pick one', tone: 'bg-card' },
  { icon: ScanEyeIcon, title: 'Critique', body: 'Hierarchy, rhythm, contrast, states', tone: 'bg-card' },
  { icon: CodeIcon, title: 'Implement', body: 'Agent + same DESIGN.md + components', tone: 'bg-card' },
  { icon: ShieldCheckIcon, title: 'Verify', body: 'Devices, themes, a11y, reduced motion', tone: 'bg-ink text-paper' },
]

const swatches = ['bg-ember', 'bg-volt', 'bg-cobalt', 'bg-mint', 'bg-blush']
</script>

<template>
  <FigureFrame :index="index" :caption="caption" :alt="alt" surface="none">
    <ol class="grid gap-3 @md:grid-cols-2 @3xl:grid-cols-3">
      <li
        v-for="(step, i) in steps"
        :key="step.title"
        class="step relative flex min-h-36 flex-col rounded-2xl border border-border p-4"
        :class="step.tone"
        :style="{ '--i': i }"
      >
        <div class="flex items-center justify-between">
          <span class="grid size-8 place-items-center rounded-full bg-current/10"><component :is="step.icon" class="size-4" aria-hidden="true" /></span>
          <span class="text-label tabular opacity-60">0{{ i + 1 }}</span>
        </div>
        <p class="mt-auto pt-6 font-display text-lg font-semibold tracking-tight">{{ step.title }}</p>
        <p class="mt-1 text-xs leading-snug opacity-75">{{ step.body }}</p>
        <div v-if="i === 0" class="absolute top-4 right-12 flex -space-x-1.5" aria-hidden="true">
          <span v-for="swatch in swatches" :key="swatch" class="size-4 rounded-full ring-2 ring-blush" :class="swatch" />
        </div>
      </li>
    </ol>
  </FigureFrame>
</template>

<style scoped>
.step {
  animation: step-glow 6s var(--ease-in-out-quart) infinite;
  animation-delay: calc(var(--i) * 1s);
}

@keyframes step-glow {
  0%,
  12%,
  100% {
    box-shadow: 0 0 0 0 transparent;
  }
  6% {
    box-shadow: 0 0 0 3px color-mix(in oklch, var(--ring) 45%, transparent);
  }
}
</style>
