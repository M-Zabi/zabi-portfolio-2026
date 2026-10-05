<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core'
import { motion, useMotionValue, useReducedMotion, useSpring } from 'motion-v'
import { useTemplateRef } from 'vue'

import { spring } from '@/lib/motion'

/** Pulls its content toward the cursor. Fine pointers only; inert under reduced motion. */
const props = withDefaults(defineProps<{ strength?: number }>(), { strength: 0.3 })

const el = useTemplateRef<HTMLElement>('el')
const x = useMotionValue(0)
const y = useMotionValue(0)
const springX = useSpring(x, spring.soft)
const springY = useSpring(y, spring.soft)

const finePointer = useMediaQuery('(hover: hover) and (pointer: fine)')
const reducedMotion = useReducedMotion()

function onMove(event: PointerEvent) {
  if (!finePointer.value || reducedMotion.value || !el.value) return
  const rect = el.value.getBoundingClientRect()
  x.set((event.clientX - (rect.left + rect.width / 2)) * props.strength)
  y.set((event.clientY - (rect.top + rect.height / 2)) * props.strength)
}

function onLeave() {
  x.set(0)
  y.set(0)
}
</script>

<template>
  <div ref="el" class="inline-block" @pointermove="onMove" @pointerleave="onLeave">
    <motion.div class="inline-block" :style="{ x: springX, y: springY }">
      <slot />
    </motion.div>
  </div>
</template>
