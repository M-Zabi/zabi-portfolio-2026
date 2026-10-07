<script setup lang="ts">
import { motion, useSpring } from 'motion-v'
import { watch } from 'vue'

import { brandVar } from '@/lib/brand'
import type { BrandColor } from '@/types/content'

/** A hairline across the top of the viewport that fills as the article is read. */
const props = defineProps<{ progress: number; color: BrandColor }>()

const scaleX = useSpring(0, { stiffness: 220, damping: 34, restDelta: 0.0005 })
watch(
  () => props.progress,
  (value) => scaleX.set(value),
  { immediate: true },
)
</script>

<template>
  <div class="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px]" aria-hidden="true">
    <motion.div class="h-full origin-left" :style="{ scaleX, background: brandVar(color) }" />
  </div>
</template>
