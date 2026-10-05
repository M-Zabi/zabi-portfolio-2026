<script setup lang="ts">
import { useInView } from 'motion-v'
import { useTemplateRef } from 'vue'

import type { ServiceIconKind } from '@/types/content'

/** Hairline line-art that draws itself in when scrolled into view. */
defineProps<{ kind: ServiceIconKind }>()

const svg = useTemplateRef<SVGSVGElement>('svg')
const inView = useInView(svg, { once: true, margin: '0px 0px -10% 0px' })
</script>

<template>
  <svg
    ref="svg"
    viewBox="0 0 100 100"
    fill="none"
    stroke="currentColor"
    stroke-width="1.1"
    stroke-linecap="round"
    stroke-linejoin="round"
    :data-drawn="inView"
    aria-hidden="true"
  >
    <template v-if="kind === 'web'">
      <circle class="draw" style="--i: 0" cx="44" cy="46" r="28" pathLength="1" />
      <circle class="draw" style="--i: 1" cx="44" cy="46" r="18" pathLength="1" />
      <circle class="draw" style="--i: 2" cx="44" cy="46" r="8" pathLength="1" />
      <path class="draw" style="--i: 3" d="M60 62 L84 71 L73 74 L70 85 Z" pathLength="1" />
    </template>

    <template v-else-if="kind === 'mobile'">
      <path class="draw" style="--i: 0" d="M50 10 L84 29 L84 71 L50 90 L16 71 L16 29 Z" pathLength="1" />
      <path class="draw" style="--i: 1" d="M16 29 L50 48 L84 29 M50 48 L50 90" pathLength="1" />
      <path class="draw" style="--i: 2" d="M50 30 L67 39.5 L67 60.5 L50 70 L33 60.5 L33 39.5 Z" pathLength="1" />
      <path class="draw" style="--i: 3" d="M33 39.5 L50 49 L67 39.5 M50 49 L50 70" pathLength="1" />
    </template>

    <template v-else-if="kind === 'desktop'">
      <rect class="draw" style="--i: 0" x="12" y="20" width="44" height="18" pathLength="1" />
      <rect class="draw" style="--i: 1" x="60" y="20" width="28" height="18" pathLength="1" />
      <rect class="draw" style="--i: 2" x="12" y="42" width="24" height="18" pathLength="1" />
      <rect class="draw" style="--i: 3" x="40" y="42" width="48" height="18" pathLength="1" />
      <rect class="draw" style="--i: 4" x="12" y="64" width="44" height="18" pathLength="1" />
      <rect class="draw" style="--i: 5" x="60" y="64" width="28" height="18" pathLength="1" />
    </template>

    <template v-else>
      <path class="draw" style="--i: 0" d="M14 40 L40 25 L58 35 L32 50 Z" pathLength="1" />
      <path class="draw" style="--i: 1" d="M14 40 L14 48 L32 58 L32 50 M32 58 L58 43 L58 35" pathLength="1" />
      <path class="draw" style="--i: 2" d="M58 35 L84 20 L84 28 L58 43" pathLength="1" />
      <path class="draw" style="--i: 3" d="M32 58 L32 78 L50 88 L76 73 L76 53 L58 43" pathLength="1" />
      <path class="draw" style="--i: 4" d="M50 68 L50 88 M50 68 L76 53 M32 58 L50 68" pathLength="1" />
    </template>
  </svg>
</template>

<style scoped>
.draw {
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  transition: stroke-dashoffset 1.6s var(--ease-out-quint);
  transition-delay: calc(var(--i) * 120ms + 150ms);
}

[data-drawn='true'] .draw {
  stroke-dashoffset: 0;
}
</style>
