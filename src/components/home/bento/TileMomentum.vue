<script setup lang="ts">
import { motion } from 'motion-v'
import { useTemplateRef } from 'vue'

import BentoTile from './BentoTile.vue'

const area = useTemplateRef<HTMLElement>('area')

const chips = [
  { label: 'Vue', left: '7%', top: '14%', rotate: -8 },
  { label: 'React Native', left: '40%', top: '8%', rotate: 5 },
  { label: 'Tauri', left: '66%', top: '46%', rotate: -5 },
  { label: 'Electron', left: '12%', top: '56%', rotate: 9 },
  { label: 'Node.js', left: '42%', top: '70%', rotate: -4 },
]
</script>

<template>
  <BentoTile tone="ember">
    <div class="flex items-start justify-between gap-4">
      <p class="text-label opacity-70">(A) Momentum</p>
      <p class="text-label opacity-70">Drag the chips</p>
    </div>

    <p class="sr-only">An interactive demo: technology chips that can be dragged and spring back into place.</p>
    <div
      ref="area"
      class="relative mt-6 min-h-[15rem] flex-1 rounded-2xl border border-dashed border-ember-foreground/25"
      aria-hidden="true"
    >
      <motion.div
        v-for="chip in chips"
        :key="chip.label"
        drag
        :drag-constraints="area ?? undefined"
        :drag-elastic="0.2"
        :drag-transition="{ bounceStiffness: 420, bounceDamping: 24 }"
        :while-hover="{ scale: 1.04 }"
        :while-drag="{ scale: 1.1, rotate: 0 }"
        :while-press="{ scale: 0.97 }"
        class="absolute cursor-grab touch-none rounded-full bg-ember-foreground px-5 py-3 font-display text-base font-semibold whitespace-nowrap text-ember shadow-[0_18px_40px_-16px_rgb(0_0_0/0.55)] select-none active:cursor-grabbing sm:text-lg"
        :style="{ left: chip.left, top: chip.top, rotate: chip.rotate }"
      >
        {{ chip.label }}
      </motion.div>
    </div>

    <div class="mt-8 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
      <h3 class="max-w-[13ch] font-display text-display-sm">Interfaces with momentum.</h3>
      <p class="max-w-[34ch] opacity-80">
        Physical, interruptible, never janky — every surface I build responds like these chips.
      </p>
    </div>
  </BentoTile>
</template>
