<script setup lang="ts">
import { useDocumentVisibility, useIntervalFn } from '@vueuse/core'
import { useReducedMotion } from 'motion-v'
import { computed, onBeforeUnmount, ref, watch } from 'vue'

/**
 * Cycles through lines that decode into place: on each change every character churns through
 * random glyphs, then locks in left to right; spaces hold their spot so the words keep their
 * shape. The first line decodes in once `active` turns on. Pauses when the tab is hidden, when
 * `active` is false and under reduced motion (the first line simply appears and stays).
 */
const props = withDefaults(
  defineProps<{
    words: string[]
    interval?: number
    /** How long one line takes to decode, in ms. */
    duration?: number
    active?: boolean
  }>(),
  { interval: 3800, duration: 750, active: true },
)

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=/<>_'
/** Glyphs churn at this rate rather than every frame, so the flicker stays readable. */
const CHURN_MS = 45

const index = ref(0)
const started = ref(false)
const shown = ref('')
const reducedMotion = useReducedMotion()
const visibility = useDocumentVisibility()

watch(
  () => props.active,
  (active) => active && (started.value = true),
  { immediate: true },
)

const running = computed(
  () =>
    started.value && props.active && !reducedMotion.value && visibility.value === 'visible' && props.words.length > 1,
)

const { pause, resume } = useIntervalFn(
  () => (index.value = (index.value + 1) % props.words.length),
  () => props.interval,
  { immediate: false },
)
watch(running, (value) => (value ? resume() : pause()), { immediate: true })

const target = computed(() => (started.value ? (props.words[index.value] ?? '') : ''))

let frame = 0
const glyph = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)]!

function decode(from: string, to: string) {
  cancelAnimationFrame(frame)
  if (reducedMotion.value) {
    shown.value = to
    return
  }
  const length = Math.max(from.length, to.length)
  // Each character settles a little after the one before it, after a short churn for all.
  const settleAt = (i: number) => props.duration * (0.25 + (0.75 * i) / Math.max(length, 1))
  const start = performance.now()
  let lastChurn = -Infinity

  const tick = (now: number) => {
    const elapsed = now - start
    const finished = elapsed >= props.duration
    if (!finished && now - lastChurn < CHURN_MS) {
      frame = requestAnimationFrame(tick)
      return
    }
    lastChurn = now
    let next = ''
    for (let i = 0; i < length; i++) {
      const char = to[i] ?? ''
      next += elapsed >= settleAt(i) || char === ' ' ? char : glyph()
    }
    shown.value = next
    if (!finished) frame = requestAnimationFrame(tick)
  }
  frame = requestAnimationFrame(tick)
}

watch(target, (to) => decode(shown.value, to), { immediate: true })
onBeforeUnmount(() => cancelAnimationFrame(frame))
</script>

<template>
  <span class="relative inline-block whitespace-nowrap">
    <span class="sr-only">{{ words[index] }}</span>
    <span aria-hidden="true">{{ shown }}</span>
  </span>
</template>
