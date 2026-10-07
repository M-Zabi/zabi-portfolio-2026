<script setup lang="ts">
import { cn } from '@/lib/utils'

/**
 * The assistant's identity in CSS: a lit, slowly turning sphere. Used wherever the WebGL orb
 * is too heavy (inline badges, the summary panel) and as its fallback without WebGL.
 */
const props = withDefaults(defineProps<{ state?: 'idle' | 'thinking' | 'speaking' | 'success' | 'error'; class?: string }>(), {
  state: 'idle',
  class: undefined,
})
</script>

<template>
  <span :class="cn('ai-orb relative inline-block aspect-square rounded-full', props.class)" :data-state="state" aria-hidden="true">
    <span class="orb-halo absolute -inset-[18%] rounded-full" />
    <span class="orb-body absolute inset-0 overflow-hidden rounded-full">
      <span class="orb-swirl absolute -inset-1/4" />
      <span class="orb-shine absolute inset-0 rounded-full" />
    </span>
  </span>
</template>

<style scoped>
.ai-orb {
  --speed: 9s;
  --pulse: 3.2s;
}

.ai-orb[data-state='thinking'] {
  --speed: 2.4s;
  --pulse: 1.1s;
}

.ai-orb[data-state='speaking'] {
  --speed: 4s;
  --pulse: 0.7s;
}

.orb-halo {
  background: radial-gradient(circle, color-mix(in oklch, var(--ember) 40%, transparent) 0%, transparent 65%);
  filter: blur(6px);
  animation: orb-pulse var(--pulse) var(--ease-in-out-quart) infinite;
}

.orb-body {
  background: radial-gradient(circle at 35% 30%, oklch(0.98 0.03 90) 0%, var(--volt) 18%, var(--ember) 46%, var(--cobalt) 82%);
  box-shadow:
    inset -6px -8px 16px rgb(0 0 0 / 0.35),
    inset 4px 4px 10px rgb(255 255 255 / 0.35);
  animation: orb-breathe var(--pulse) var(--ease-in-out-quart) infinite;
}

.orb-swirl {
  background: conic-gradient(from 0deg, transparent 0deg, color-mix(in oklch, var(--blush) 70%, transparent) 70deg, transparent 140deg, color-mix(in oklch, var(--cobalt) 80%, transparent) 220deg, transparent 300deg);
  mix-blend-mode: overlay;
  animation: orb-spin var(--speed) linear infinite;
}

.orb-shine {
  background: radial-gradient(circle at 32% 26%, rgb(255 255 255 / 0.85) 0%, transparent 22%);
}

.ai-orb[data-state='success'] .orb-body {
  background: radial-gradient(circle at 35% 30%, oklch(0.98 0.03 160) 0%, var(--mint) 30%, oklch(0.55 0.13 175) 90%);
}

.ai-orb[data-state='error'] .orb-body {
  background: radial-gradient(circle at 35% 30%, oklch(0.97 0.03 30) 0%, var(--destructive) 50%, oklch(0.35 0.1 25) 95%);
}

@keyframes orb-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes orb-breathe {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.045);
  }
}

@keyframes orb-pulse {
  0%,
  100% {
    opacity: 0.55;
    transform: scale(0.94);
  }
  50% {
    opacity: 1;
    transform: scale(1.06);
  }
}
</style>
