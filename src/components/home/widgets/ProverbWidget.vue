<script setup lang="ts">
import { AnimatePresence, motion, useReducedMotion } from 'motion-v'
import { computed, ref } from 'vue'

import BentoTile from '@/components/home/bento/BentoTile.vue'
import { proverbs } from '@/content/profile'
import { ease } from '@/lib/motion'

/**
 * Hero tile: a proverb that turns over every few seconds. The hairline timer along the bottom
 * *is* the clock — when its animation ends the next proverb comes in — so hovering or focusing
 * the tile (which pauses the timer) holds the current one. Clicking moves on. Under reduced
 * motion there's no timer, so it only changes when asked.
 */
defineProps<{ delay?: number }>()

const INTERVAL = 6500

const index = ref(0)
const held = ref(false)
const reducedMotion = useReducedMotion()
const proverb = computed(() => proverbs[index.value]!)

const next = () => (index.value = (index.value + 1) % proverbs.length)
</script>

<template>
  <BentoTile v-if="proverbs.length" :delay="delay" content-class="rounded-2xl p-0 sm:p-0">
    <button
      type="button"
      class="flex size-full flex-col p-3 text-left xl:p-4"
      :data-held="held || undefined"
      @click="next"
      @pointerenter="held = true"
      @pointerleave="held = false"
      @focus="held = true"
      @blur="held = false"
    >
      <AnimatePresence mode="wait" :initial="false">
        <motion.span
          :key="index"
          class="flex flex-1 flex-col gap-2"
          :initial="reducedMotion ? { opacity: 0 } : { opacity: 0, y: 10, filter: 'blur(4px)' }"
          :animate="{ opacity: 1, y: 0, filter: 'blur(0px)' }"
          :exit="reducedMotion ? { opacity: 0 } : { opacity: 0, y: -8, filter: 'blur(4px)' }"
          :transition="{ duration: 0.4, ease: ease.outQuint }"
        >
          <span class="text-label truncate text-muted-foreground">({{ proverb.origin }} proverb)</span>
          <q class="font-display text-[0.82rem] leading-snug font-semibold tracking-tight text-balance xl:text-[0.92rem]">
            {{ proverb.text }}
          </q>
        </motion.span>
      </AnimatePresence>
      <span class="sr-only">Show the next proverb.</span>

      <span
        v-if="!reducedMotion"
        :key="index"
        class="timer absolute inset-x-0 bottom-0 h-0.5 origin-left bg-ember"
        :style="{ animationDuration: `${INTERVAL}ms` }"
        aria-hidden="true"
        @animationend="next"
      />
    </button>
  </BentoTile>
</template>

<style scoped>
.timer {
  animation-name: countdown;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}

[data-held] .timer {
  animation-play-state: paused;
}

@keyframes countdown {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}
</style>
