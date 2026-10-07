<script setup lang="ts">
import { AnimatePresence, motion, useReducedMotion } from 'motion-v'
import { computed, ref } from 'vue'

import { ease, spring } from '@/lib/motion'
import { cn } from '@/lib/utils'

/**
 * Heart toggle with a burst: the outline fills on a spring, a ring pulses out and confetti
 * hearts scatter. The count rolls to its new value instead of jumping.
 */
const props = withDefaults(
  defineProps<{ hearted: boolean; count: number; layout?: 'stack' | 'inline'; class?: string }>(),
  { layout: 'stack', class: undefined },
)
const emit = defineEmits<{ toggle: [hearted: boolean] }>()

const reducedMotion = useReducedMotion()
const bursts = ref<number[]>([])
let burstId = 0
const previous = ref(props.count)
const direction = computed(() => (props.count >= previous.value ? 1 : -1))

const particles = Array.from({ length: 9 }, (_, index) => {
  const angle = (index / 9) * Math.PI * 2 - Math.PI / 2
  const distance = 26 + (index % 3) * 7
  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance,
    rotate: (index % 2 ? 1 : -1) * (20 + index * 6),
    color: ['var(--ember)', 'var(--blush)', 'var(--volt)'][index % 3],
    size: 6 + (index % 3) * 2,
  }
})

function onClick() {
  const next = !props.hearted
  previous.value = props.count
  if (next && !reducedMotion.value) {
    const id = ++burstId
    bursts.value.push(id)
    setTimeout(() => (bursts.value = bursts.value.filter((value) => value !== id)), 900)
  }
  emit('toggle', next)
}
</script>

<template>
  <button
    type="button"
    :class="
      cn(
        'heart-button group/heart relative inline-flex items-center justify-center rounded-full transition-colors duration-200',
        layout === 'stack' ? 'flex-col gap-1' : 'h-11 gap-2 px-3',
        props.class,
      )
    "
    :aria-pressed="hearted"
    :aria-label="hearted ? `Remove your heart (${count} total)` : `Heart this article (${count} total)`"
    @click="onClick"
  >
    <span class="relative grid size-11 place-items-center rounded-full transition-colors duration-200 group-hover/heart:bg-blush/25">
      <!-- Ring pulse -->
      <AnimatePresence>
        <motion.span
          v-for="id in bursts"
          :key="`ring-${id}`"
          class="absolute inset-1 rounded-full border-2 border-ember"
          :initial="{ scale: 0.4, opacity: 0.9 }"
          :animate="{ scale: 1.5, opacity: 0 }"
          :transition="{ duration: 0.6, ease: ease.outQuint }"
        />
      </AnimatePresence>
      <!-- Confetti -->
      <template v-for="id in bursts" :key="`burst-${id}`">
        <motion.span
          v-for="(particle, index) in particles"
          :key="index"
          class="pointer-events-none absolute top-1/2 left-1/2"
          :initial="{ x: '-50%', y: '-50%', scale: 0, opacity: 1 }"
          :animate="{ x: `calc(-50% + ${particle.x}px)`, y: `calc(-50% + ${particle.y}px)`, scale: [0, 1, 0.6], opacity: [1, 1, 0], rotate: particle.rotate }"
          :transition="{ duration: 0.75, ease: ease.outQuint, delay: index * 0.012 }"
        >
          <svg :width="particle.size" :height="particle.size" viewBox="0 0 24 24" aria-hidden="true">
            <path :fill="particle.color" d="M12 21s-7.5-4.6-9.6-9.2C.9 8.6 3 4.5 6.9 4.5c2.1 0 3.6 1.1 5.1 2.9 1.5-1.8 3-2.9 5.1-2.9 3.9 0 6 4.1 4.5 7.3C19.5 16.4 12 21 12 21z" />
          </svg>
        </motion.span>
      </template>

      <motion.svg
        viewBox="0 0 24 24"
        class="relative size-[1.375rem]"
        :animate="hearted ? { scale: [1, 1.32, 0.94, 1] } : { scale: 1 }"
        :transition="hearted ? { duration: 0.5, ease: ease.outQuint } : spring.snappy"
        aria-hidden="true"
      >
        <path
          d="M12 21s-7.5-4.6-9.6-9.2C.9 8.6 3 4.5 6.9 4.5c2.1 0 3.6 1.1 5.1 2.9 1.5-1.8 3-2.9 5.1-2.9 3.9 0 6 4.1 4.5 7.3C19.5 16.4 12 21 12 21z"
          class="transition-[fill,stroke] duration-300"
          :class="hearted ? 'fill-ember stroke-ember' : 'fill-transparent stroke-current'"
          stroke-width="1.8"
          stroke-linejoin="round"
        />
      </motion.svg>
    </span>

    <span class="relative h-4 overflow-hidden text-xs font-medium tabular" :class="layout === 'inline' && 'pr-1'" aria-hidden="true">
      <AnimatePresence mode="popLayout" :initial="false">
        <motion.span
          :key="count"
          class="block"
          :initial="{ y: direction * 14, opacity: 0 }"
          :animate="{ y: 0, opacity: 1 }"
          :exit="{ y: direction * -14, opacity: 0 }"
          :transition="spring.snappy"
        >
          {{ count }}
        </motion.span>
      </AnimatePresence>
    </span>
  </button>
</template>
