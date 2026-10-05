<script setup lang="ts">
import { PauseIcon, PlayIcon, SkipBackIcon, SkipForwardIcon } from '@lucide/vue'
import { useIntervalFn } from '@vueuse/core'
import { AnimatePresence, motion } from 'motion-v'
import { computed, ref } from 'vue'

import BentoTile from '@/components/home/bento/BentoTile.vue'
import { rotation } from '@/content/profile'
import { brandVar } from '@/lib/brand'
import { ease } from '@/lib/motion'

/**
 * Hero tile: what's on repeat. The disc spins, the meter bounces and the clock runs in real
 * time, rolling on to the next track. It's a display, not an audio player — the controls flip
 * through the list and pause the show.
 */
defineProps<{ delay?: number }>()

const index = ref(0)
const playing = ref(true)
const track = computed(() => rotation[index.value]!)
// Start mid-song, like you've walked in on it.
const elapsed = ref(Math.floor((rotation[0]?.duration ?? 0) * 0.34))

function skip(step: number) {
  index.value = (index.value + step + rotation.length) % rotation.length
  elapsed.value = 0
}

useIntervalFn(() => {
  if (!playing.value) return
  if (elapsed.value + 1 >= track.value.duration) skip(1)
  else elapsed.value += 1
}, 1000)

const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
</script>

<template>
  <BentoTile
    v-if="rotation.length"
    :delay="delay"
    content-class="justify-between gap-2.5 rounded-2xl p-3 sm:p-3 xl:p-4"
    :style="{ '--tone': brandVar(track.color) }"
    :data-playing="playing || undefined"
  >
    <div class="flex items-center gap-3">
      <span class="vinyl size-12 shrink-0 rounded-full" aria-hidden="true" />

      <div class="min-w-0 flex-1">
        <p class="text-label flex items-center gap-2 whitespace-nowrap text-muted-foreground">
          On rotation
          <span class="flex h-2.5 items-end gap-[2px]" aria-hidden="true">
            <span v-for="bar in 4" :key="bar" class="eq-bar w-[2px] rounded-full" />
          </span>
        </p>
        <AnimatePresence mode="wait" :initial="false">
          <motion.div
            :key="index"
            :initial="{ opacity: 0, y: 6 }"
            :animate="{ opacity: 1, y: 0 }"
            :exit="{ opacity: 0, y: -6 }"
            :transition="{ duration: 0.25, ease: ease.outQuint }"
          >
            <p class="mt-0.5 truncate text-sm font-semibold">{{ track.title }}</p>
            <p class="truncate text-xs text-muted-foreground">{{ track.artist }}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <button
        type="button"
        class="control size-9 shrink-0 bg-foreground text-background"
        :aria-label="playing ? 'Pause' : 'Play'"
        @click="playing = !playing"
      >
        <PauseIcon v-if="playing" class="size-4" aria-hidden="true" />
        <PlayIcon v-else class="size-4 translate-x-px" aria-hidden="true" />
      </button>
    </div>

    <div class="text-label flex items-center gap-2 text-muted-foreground tabular">
      <button type="button" class="control -ml-1 size-6 shrink-0" aria-label="Previous track" @click="skip(-1)">
        <SkipBackIcon class="size-3" aria-hidden="true" />
      </button>
      <span class="w-7">{{ clock(elapsed) }}</span>
      <span class="relative h-1 flex-1 overflow-hidden rounded-full bg-border" aria-hidden="true">
        <span
          :key="index"
          class="progress absolute inset-0 origin-left rounded-full"
          :style="{ transform: `scaleX(${elapsed / track.duration})` }"
        />
      </span>
      <span class="w-7 text-right">{{ clock(track.duration) }}</span>
      <button type="button" class="control -mr-1 size-6 shrink-0" aria-label="Next track" @click="skip(1)">
        <SkipForwardIcon class="size-3" aria-hidden="true" />
      </button>
    </div>
  </BentoTile>
</template>

<style scoped>
/*
 * The record: spindle hole, a label in the track's colour with one bright notch, a sheen
 * across the grooves (it turns with the disc, so the spin reads at a glance), then grooves.
 */
.vinyl {
  background:
    radial-gradient(circle at 50% 50%, oklch(0.98 0 0) 0 1.5px, transparent 2px),
    radial-gradient(circle at 50% 20%, rgb(255 255 255 / 0.6) 0 1.2px, transparent 1.7px),
    radial-gradient(circle, var(--tone) 0 30%, oklch(0.12 0 0) 31% 33%, transparent 34%),
    conic-gradient(
      from 20deg,
      transparent 0 8%,
      rgb(255 255 255 / 0.14) 13%,
      transparent 20% 58%,
      rgb(255 255 255 / 0.14) 63%,
      transparent 70%
    ),
    repeating-radial-gradient(circle, oklch(0.15 0 0) 0 1px, oklch(0.21 0 0) 1px 2px);
  box-shadow:
    0 6px 14px -6px rgb(0 0 0 / 0.5),
    inset 0 0 0 1px rgb(255 255 255 / 0.06);
  animation: spin 2.4s linear infinite;
  animation-play-state: paused;
}

[data-playing] .vinyl {
  animation-play-state: running;
}

.eq-bar {
  height: 100%;
  background: var(--tone);
  transform-origin: bottom;
  transform: scaleY(0.3);
  animation: eq 0.9s ease-in-out infinite alternate;
  animation-play-state: paused;
}

.eq-bar:nth-child(2) {
  animation-duration: 0.6s;
  animation-delay: -0.2s;
}

.eq-bar:nth-child(3) {
  animation-duration: 1.1s;
  animation-delay: -0.5s;
}

.eq-bar:nth-child(4) {
  animation-duration: 0.75s;
  animation-delay: -0.3s;
}

[data-playing] .eq-bar {
  animation-play-state: running;
}

.progress {
  background: var(--tone);
  transition: transform 1s linear;
}

/* Small controls, but with a full-size hit area. */
.control {
  position: relative;
  display: grid;
  place-items: center;
  border-radius: 9999px;
  transition:
    background-color 0.2s var(--ease-out-quint),
    transform 0.2s var(--ease-out-quint);
}

.control::before {
  content: '';
  position: absolute;
  inset: -0.375rem;
}

.control:active {
  transform: scale(0.92);
}

@media (hover: hover) {
  .control:not(.bg-foreground):hover {
    background-color: var(--accent);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes eq {
  from {
    transform: scaleY(0.25);
  }
  to {
    transform: scaleY(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .vinyl,
  .eq-bar {
    animation: none;
  }
}
</style>
