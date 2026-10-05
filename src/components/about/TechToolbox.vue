<script setup lang="ts">
import { animate, stagger, useInView, useReducedMotion } from 'motion-v'
import { useTemplateRef, watch } from 'vue'

import { usePageReady } from '@/composables/usePageReady'
import { toolbox, toolboxExtras } from '@/content/profile'
import { ease } from '@/lib/motion'
import { techColor, techIcons } from '@/lib/tech-icons'

/**
 * The toolbox as brand-mark chips. Once on screen they rise in one after another, each logo
 * popping in just behind its chip; hovering a chip washes it in the brand's colour.
 */
const tools = toolbox.map((name) => {
  const icon = techIcons[name]
  return { name, path: icon.path, color: techColor(icon) }
})

const list = useTemplateRef<HTMLElement>('list')
const inView = useInView(list, { once: true, margin: '0px 0px -8% 0px' })
const pageReady = usePageReady()
const reducedMotion = useReducedMotion()

// Overshoots slightly, so each logo lands with a small pop.
const popOut = [0.34, 1.56, 0.64, 1] as const

watch(
  () => pageReady.value && inView.value,
  (visible) => {
    if (!visible || !list.value) return
    const chips = list.value.querySelectorAll('[data-chip]')
    if (reducedMotion.value) {
      animate(chips, { opacity: [0, 1] }, { duration: 0.4 })
      return
    }
    animate(
      chips,
      { opacity: [0, 1], transform: ['translateY(14px) scale(0.94)', 'translateY(0px) scale(1)'] },
      { duration: 0.7, delay: stagger(0.035), ease: ease.outQuint },
    )
    animate(
      list.value.querySelectorAll('[data-chip-icon]'),
      { transform: ['scale(0.3) rotate(-35deg)', 'scale(1) rotate(0deg)'] },
      { duration: 0.6, delay: stagger(0.035, { startDelay: 0.1 }), ease: [...popOut] },
    )
  },
  { flush: 'post', immediate: true },
)
</script>

<template>
  <div>
    <ul ref="list" class="flex flex-wrap gap-2" :data-reduced="reducedMotion || undefined">
      <li
        v-for="tool in tools"
        :key="tool.name"
        data-chip
        class="tool-chip inline-flex items-center gap-2 rounded-full border border-border bg-card/60 py-1.5 pr-3.5 pl-2.5 text-sm font-medium"
        :style="{ '--brand': tool.color }"
      >
        <span data-chip-icon class="tool-icon inline-flex">
          <svg viewBox="0 0 24 24" class="size-4" :fill="tool.color" aria-hidden="true">
            <path :d="tool.path" />
          </svg>
        </span>
        {{ tool.name }}
      </li>
    </ul>
    <p class="mt-4 text-sm leading-relaxed text-muted-foreground">Also: {{ toolboxExtras.join(', ') }}.</p>
  </div>
</template>

<style scoped>
/* Hidden until the entrance runs (it fills in the end state). */
.tool-chip {
  opacity: 0;
  transition:
    background-color 0.3s var(--ease-out-quint),
    border-color 0.3s var(--ease-out-quint);
}

.tool-icon {
  transform: scale(0.3) rotate(-35deg);
}

[data-reduced] .tool-icon {
  transform: none;
}

.tool-icon svg {
  transition: transform 0.45s var(--ease-out-expo);
}

@media (hover: hover) {
  .tool-chip:hover {
    background-color: color-mix(in oklch, var(--brand) 12%, transparent);
    border-color: color-mix(in oklch, var(--brand) 45%, var(--border));
  }

  .tool-chip:hover .tool-icon svg {
    transform: scale(1.18) rotate(-8deg);
  }
}
</style>
