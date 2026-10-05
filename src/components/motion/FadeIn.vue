<script setup lang="ts">
import { animate, useInView, useReducedMotion } from 'motion-v'
import { computed, useTemplateRef, watch } from 'vue'

import { usePageReady } from '@/composables/usePageReady'
import { ease } from '@/lib/motion'

/** Fades and lifts its content into place once it scrolls into view. */
const props = withDefaults(defineProps<{ as?: string; delay?: number; y?: number }>(), {
  as: 'div',
  delay: 0,
  y: 28,
})

const el = useTemplateRef<HTMLElement>('el')
const inView = useInView(el, { once: true, margin: '0px 0px -8% 0px' })
const pageReady = usePageReady()
const reducedMotion = useReducedMotion()

const visible = computed(() => pageReady.value && inView.value)

watch(
  visible,
  (value) => {
    if (!value || !el.value) return
    const keyframes = reducedMotion.value
      ? { opacity: [0, 1] }
      : { opacity: [0, 1], transform: [`translateY(${props.y}px)`, 'translateY(0px)'] }
    animate(el.value, keyframes, { duration: 0.9, delay: props.delay, ease: ease.outQuint })
  },
  { flush: 'post', immediate: true },
)
</script>

<template>
  <component
    :is="as"
    ref="el"
    class="fade-in"
    :data-reduced="reducedMotion || undefined"
    :style="{ '--fade-y': `${y}px` }"
  >
    <slot />
  </component>
</template>

<style scoped>
.fade-in {
  opacity: 0;
  transform: translateY(var(--fade-y));
}

.fade-in[data-reduced] {
  transform: none;
}
</style>
