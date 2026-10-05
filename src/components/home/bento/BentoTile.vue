<script setup lang="ts">
import FadeIn from '@/components/motion/FadeIn.vue'
import { blockClass } from '@/lib/brand'
import { cn } from '@/lib/utils'
import type { BrandColor } from '@/types/content'

/**
 * Bento cell. Grid placement classes go on the component (`class`), surface styling is
 * chosen with `tone`: a full brand block, or a hairline `surface` on the canvas.
 */
withDefaults(defineProps<{ tone?: BrandColor | 'surface'; delay?: number; contentClass?: string }>(), {
  tone: 'surface',
  delay: 0,
  contentClass: undefined,
})
</script>

<template>
  <FadeIn :delay="delay" class="h-full">
    <article
      :class="
        cn(
          'grain relative isolate flex h-full flex-col overflow-hidden rounded-3xl p-6 sm:p-8',
          tone === 'surface' ? 'border border-border bg-card/85 backdrop-blur-sm' : blockClass[tone],
          contentClass,
        )
      "
    >
      <slot />
    </article>
  </FadeIn>
</template>
