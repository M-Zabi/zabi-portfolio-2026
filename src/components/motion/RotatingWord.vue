<script setup lang="ts">
import { useDocumentVisibility, useIntervalFn } from '@vueuse/core'
import { AnimatePresence, motion, useReducedMotion } from 'motion-v'
import { computed, ref, watch } from 'vue'

import { ease } from '@/lib/motion'

/**
 * Cycles through words with a blur-and-rise crossfade. Pauses when the tab is hidden,
 * when `active` is false and under reduced motion (the first word stays put).
 */
const props = withDefaults(
  defineProps<{
    words: string[]
    interval?: number
    active?: boolean
  }>(),
  { interval: 2600, active: true },
)

const index = ref(0)
const reducedMotion = useReducedMotion()
const visibility = useDocumentVisibility()

const running = computed(
  () => props.active && !reducedMotion.value && visibility.value === 'visible' && props.words.length > 1,
)

const { pause, resume } = useIntervalFn(
  () => (index.value = (index.value + 1) % props.words.length),
  () => props.interval,
  { immediate: false },
)

watch(running, (value) => (value ? resume() : pause()), { immediate: true })

const current = computed(() => props.words[index.value] ?? '')
</script>

<template>
  <span class="relative inline-grid align-top">
    <span class="sr-only">{{ words[0] }}</span>
    <AnimatePresence :initial="false">
      <motion.span
        :key="current"
        aria-hidden="true"
        class="col-start-1 row-start-1 inline-block whitespace-nowrap"
        :initial="{ opacity: 0, y: '42%', filter: 'blur(14px)' }"
        :animate="{ opacity: 1, y: '0%', filter: 'blur(0px)' }"
        :exit="{ opacity: 0, y: '-42%', filter: 'blur(14px)' }"
        :transition="{ duration: 0.8, ease: ease.outQuint }"
      >
        {{ current }}
      </motion.span>
    </AnimatePresence>
  </span>
</template>
