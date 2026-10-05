<script setup lang="ts">
import { useReducedMotion } from 'motion-v'
import { computed, useTemplateRef } from 'vue'

import StatusDot from '@/components/common/StatusDot.vue'
import { useFrameRate } from '@/composables/useFrameRate'
import { rig } from '@/content/profile'
import { FRAME_HISTORY } from '@/lib/frame-meter'

/**
 * The gaming rig as an in-game HUD: a live FPS readout and frame-time graph (this page, on the
 * visitor's machine — the same overlay a PC gamer keeps in the corner) above the spec sheet.
 */

// Graph space: frame time runs from 0 ms (bottom) to CEILING ms (top); newest frame on the right.
const WIDTH = 240
const HEIGHT = 56
const CEILING = 40
const toY = (ms: number) => HEIGHT - (Math.min(ms, CEILING) / CEILING) * HEIGHT
const guideY = toY(1000 / 60)

const panel = useTemplateRef<HTMLElement>('panel')
const line = useTemplateRef<SVGPolylineElement>('line')
const reducedMotion = useReducedMotion()

/** Runs every frame, so it writes the attribute directly instead of going through a render. */
function draw(frameTimes: readonly number[]) {
  if (reducedMotion.value || !line.value) return
  const step = WIDTH / (FRAME_HISTORY - 1)
  const offset = FRAME_HISTORY - frameTimes.length
  let points = ''
  frameTimes.forEach((ms, index) => {
    points += `${((offset + index) * step).toFixed(1)},${toY(ms).toFixed(1)} `
  })
  line.value.setAttribute('points', points)
}

const { fps } = useFrameRate(panel, draw)
const frameTime = computed(() => (fps.value ? (1000 / fps.value).toFixed(1) : '--'))
const corners = ['top-3 left-3 border-t border-l', 'top-3 right-3 border-t border-r', 'bottom-3 left-3 border-b border-l', 'bottom-3 right-3 border-b border-r']
</script>

<template>
  <article ref="panel" class="rig group/rig relative isolate h-full overflow-hidden rounded-3xl bg-ink p-7 text-paper sm:p-9">
    <span
      v-for="corner in corners"
      :key="corner"
      class="rig-corner absolute size-3.5 border-volt/70"
      :class="corner"
      aria-hidden="true"
    />

    <header class="flex items-center justify-between gap-4">
      <p class="text-label opacity-60">(The rig)</p>
      <p class="text-label flex items-center gap-2 opacity-80">
        <StatusDot />
        Live
      </p>
    </header>

    <div class="mt-10 flex items-end justify-between gap-6">
      <p class="flex items-baseline gap-3">
        <span class="font-display text-[clamp(4.5rem,3rem+5vw,7.5rem)] leading-[0.8] tracking-[-0.05em] text-volt tabular">
          {{ fps ?? '--' }}
        </span>
        <span class="text-label text-volt">FPS</span>
      </p>
      <p class="text-label text-right tabular opacity-60">
        {{ frameTime }} ms<br />
        per frame
      </p>
    </div>
    <p class="mt-4 text-sm opacity-60">Your browser, rendering this page right now.</p>

    <div v-if="!reducedMotion" class="mt-7" aria-hidden="true">
      <p class="text-label opacity-40">Frame time</p>
      <div class="mt-3 flex h-14 gap-3">
        <svg :viewBox="`0 0 ${WIDTH} ${HEIGHT}`" preserveAspectRatio="none" class="h-full min-w-0 flex-1 overflow-visible">
          <line
            x1="0"
            :x2="WIDTH"
            :y1="guideY"
            :y2="guideY"
            stroke="currentColor"
            stroke-opacity="0.25"
            stroke-dasharray="3 4"
            vector-effect="non-scaling-stroke"
          />
          <polyline
            ref="line"
            fill="none"
            stroke="var(--volt)"
            stroke-width="1.5"
            stroke-linejoin="round"
            vector-effect="non-scaling-stroke"
          />
        </svg>
        <span class="relative w-12 shrink-0">
          <span class="text-label absolute left-0 -translate-y-1/2 whitespace-nowrap opacity-40" :style="{ top: `${(guideY / HEIGHT) * 100}%` }">
            60 fps
          </span>
        </span>
      </div>
    </div>

    <dl class="mt-9 border-t border-paper/15">
      <div v-for="part in rig" :key="part.label" class="grid grid-cols-[5.5rem_1fr] gap-4 border-b border-paper/15 py-3.5">
        <dt class="text-label pt-1 opacity-55">{{ part.label }}</dt>
        <dd class="font-medium">{{ part.value }}</dd>
      </div>
    </dl>
  </article>
</template>

<style scoped>
/* A faint glow in the corner and CRT scanlines — a HUD, not a card. */
.rig {
  background-image:
    radial-gradient(55% 45% at 100% 0%, color-mix(in oklch, var(--volt) 14%, transparent), transparent 70%),
    repeating-linear-gradient(180deg, rgb(255 255 255 / 0.025) 0 1px, transparent 1px 3px);
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.09);
}

/* Target lock: the corner brackets close in on hover. */
.rig-corner {
  transition: transform 0.5s var(--ease-out-expo);
}

@media (hover: hover) {
  .group\/rig:hover .rig-corner.top-3.left-3 {
    transform: translate(4px, 4px);
  }
  .group\/rig:hover .rig-corner.top-3.right-3 {
    transform: translate(-4px, 4px);
  }
  .group\/rig:hover .rig-corner.bottom-3.left-3 {
    transform: translate(4px, -4px);
  }
  .group\/rig:hover .rig-corner.bottom-3.right-3 {
    transform: translate(-4px, -4px);
  }
}
</style>
