<script setup lang="ts">
import {
  motion,
  useAnimationFrame,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  wrap,
} from 'motion-v'
import { useTemplateRef } from 'vue'

import AppMark from '@/components/layout/AppMark.vue'

/**
 * Scroll-velocity marquee. Drifts on its own; scrolling down pushes it one way, scrolling up
 * flips it the other, faster the harder you scroll — and it leans into the motion.
 */
const props = withDefaults(defineProps<{ words: string[]; baseVelocity?: number }>(), { baseVelocity: -2.2 })

const root = useTemplateRef<HTMLElement>('root')
const inView = useInView(root)
const reducedMotion = useReducedMotion()

const baseX = useMotionValue(0)
const { scrollY } = useScroll()
const scrollVelocity = useVelocity(scrollY)
const smoothVelocity = useSpring(scrollVelocity, { damping: 50, stiffness: 400 })
const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 5], { clamp: false })
const skew = useTransform(smoothVelocity, [-2400, 0, 2400], [9, 0, -9])

// Four copies; one copy is a quarter of the track, so wrapping at -25% is seamless.
const x = useTransform(baseX, (value) => `${wrap(-25, 0, value)}%`)

let direction = 1
useAnimationFrame((_, delta) => {
  if (!inView.value || reducedMotion.value) return
  let moveBy = direction * props.baseVelocity * (delta / 1000)
  const factor = velocityFactor.get()
  if (factor < 0) direction = -1
  else if (factor > 0) direction = 1
  moveBy += direction * moveBy * factor
  baseX.set(baseX.get() + moveBy)
})
</script>

<template>
  <div ref="root" class="overflow-hidden py-2" role="marquee" :aria-label="words.join(' ')">
    <motion.div class="flex w-max will-change-transform" :style="{ x, skewX: reducedMotion ? 0 : skew }" aria-hidden="true">
      <div v-for="copy in 4" :key="copy" class="flex shrink-0 items-center">
        <template v-for="(word, index) in words" :key="`${copy}-${word}`">
          <span class="marquee-word" :class="index % 2 === 1 && 'marquee-word--outline'">{{ word }}</span>
          <AppMark class="mx-[0.35em] h-[0.42em] shrink-0 text-volt" />
        </template>
      </div>
    </motion.div>
  </div>
</template>

<style scoped>
.marquee-word {
  font-family: var(--font-display);
  font-size: clamp(3.5rem, 1.6rem + 8vw, 9rem);
  font-weight: 800;
  font-stretch: 118%;
  line-height: 0.95;
  letter-spacing: -0.04em;
  white-space: nowrap;
  color: var(--paper);
  transition:
    color 0.35s var(--ease-out-quint),
    -webkit-text-stroke-color 0.35s var(--ease-out-quint);
}

.marquee-word--outline {
  color: transparent;
  -webkit-text-stroke: 1.5px var(--paper);
}

@media (hover: hover) {
  .marquee-word:hover {
    color: var(--volt);
  }

  .marquee-word--outline:hover {
    color: var(--paper);
    -webkit-text-stroke-color: var(--paper);
  }
}
</style>
