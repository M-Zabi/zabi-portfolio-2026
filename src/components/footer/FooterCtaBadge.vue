<script setup lang="ts">
import { ArrowUpRightIcon } from '@lucide/vue'

import MagneticHover from '@/components/motion/MagneticHover.vue'

/** Round CTA: circular text orbits an arrow; hover flips the colours and turns the arrow. */
withDefaults(defineProps<{ label?: string; to?: string }>(), {
  label: 'Start a project',
  to: '/contact',
})
</script>

<template>
  <MagneticHover :strength="0.35">
    <RouterLink
      :to="to"
      class="cta-badge group/cta relative grid size-32 place-items-center rounded-full bg-volt text-volt-foreground transition-[background-color,color,scale] duration-500 ease-out-expo active:scale-95 sm:size-36"
      :aria-label="label"
    >
      <svg viewBox="0 0 160 160" class="badge-ring absolute inset-0 size-full" aria-hidden="true">
        <defs>
          <path id="cta-badge-circle" d="M80 80 m-58 0 a58 58 0 1 1 116 0 a58 58 0 1 1 -116 0" />
        </defs>
        <text class="fill-current font-mono text-[11.5px] font-semibold uppercase">
          <textPath href="#cta-badge-circle" textLength="364" lengthAdjust="spacing">
            {{ label }} · {{ label }} ·
          </textPath>
        </text>
      </svg>
      <span
        class="relative grid size-12 place-items-center rounded-full bg-volt-foreground text-volt transition-[rotate,scale,background-color,color] duration-500 ease-out-expo group-hover/cta:scale-110 group-hover/cta:rotate-45"
        aria-hidden="true"
      >
        <ArrowUpRightIcon class="size-5" />
      </span>
    </RouterLink>
  </MagneticHover>
</template>

<style scoped>
.badge-ring {
  animation: badge-spin 16s linear infinite;
}

/* Hover never changes the spin's duration (that would jump the rotation); it swaps colours
   and opens the lettering out a touch instead. */
.badge-ring text {
  transform-origin: center;
  transform-box: view-box;
  transition: scale 0.6s var(--ease-out-expo);
}

@media (hover: hover) {
  .cta-badge:hover {
    background-color: var(--paper);
    color: var(--ink);
  }

  .cta-badge:hover .badge-ring text {
    scale: 1.06;
  }
}

@keyframes badge-spin {
  to {
    rotate: 360deg;
  }
}

@media (prefers-reduced-motion: reduce) {
  .badge-ring {
    animation: none;
  }
}
</style>
