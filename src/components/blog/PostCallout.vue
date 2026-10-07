<script setup lang="ts">
import { InfoIcon, LightbulbIcon, TriangleAlertIcon } from '@lucide/vue'
import { computed } from 'vue'

import InlineText from './InlineText.vue'

const props = defineProps<{ tone: 'note' | 'tip' | 'warning'; title: string; text: string }>()

const tones = {
  note: { icon: InfoIcon, label: 'Note', accent: 'var(--cobalt)' },
  tip: { icon: LightbulbIcon, label: 'Tip', accent: 'var(--mint)' },
  warning: { icon: TriangleAlertIcon, label: 'Warning', accent: 'var(--ember)' },
} as const

const tone = computed(() => tones[props.tone])
</script>

<template>
  <aside
    class="callout relative overflow-hidden rounded-2xl border border-border p-5 pl-6 sm:p-6 sm:pl-7"
    :style="{ '--accent': tone.accent }"
    :aria-label="`${tone.label}: ${title}`"
  >
    <span class="absolute inset-y-0 left-0 w-1.5 bg-(--accent)" aria-hidden="true" />
    <p class="flex items-center gap-2.5 font-display text-lg font-semibold tracking-tight">
      <span class="grid size-8 shrink-0 place-items-center rounded-full bg-(--accent) text-ink" aria-hidden="true">
        <component :is="tone.icon" class="size-4" />
      </span>
      {{ title }}
    </p>
    <p class="mt-3 leading-relaxed text-muted-foreground"><InlineText :text="text" /></p>
  </aside>
</template>

<style scoped>
.callout {
  background: color-mix(in oklch, var(--accent) 7%, var(--card));
}
</style>
