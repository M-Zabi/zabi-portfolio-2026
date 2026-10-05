<script setup lang="ts">
import { AnimatePresence, motion } from 'motion-v'

import { useTheme } from '@/composables/useTheme'
import { ease } from '@/lib/motion'

/**
 * The footer's sun (light theme) or moon (dark theme). It is also a theme toggle: the new
 * theme opens as a circle from the celestial body itself.
 */
const { isDark, toggle } = useTheme()

function onClick(event: MouseEvent) {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  void toggle({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
}

const rays = Array.from({ length: 12 }, (_, index) => index * 30)
const craters = [
  { cx: -15, cy: -11, r: 9 },
  { cx: 13, cy: 14, r: 6.5 },
  { cx: 17, cy: -17, r: 4 },
  { cx: -6, cy: 21, r: 5 },
  { cx: -24, cy: 9, r: 3.2 },
  { cx: 26, cy: 2, r: 2.6 },
]
</script>

<template>
  <button
    type="button"
    class="celestial group/celestial relative grid size-24 place-items-center rounded-full sm:size-32 lg:size-36"
    :aria-label="isDark ? 'Switch to the day theme' : 'Switch to the night theme'"
    @click="onClick"
  >
    <AnimatePresence mode="wait" :initial="false">
      <motion.svg
        v-if="isDark"
        key="moon"
        viewBox="-100 -100 200 200"
        class="size-full overflow-visible"
        :initial="{ y: -40, opacity: 0, rotate: -25 }"
        :animate="{ y: 0, opacity: 1, rotate: 0 }"
        :exit="{ y: 50, opacity: 0, rotate: 20 }"
        :transition="{ duration: 0.7, ease: ease.outQuint }"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="moon-halo">
            <stop offset="0.45" :style="{ stopColor: 'var(--paper)', stopOpacity: 0.28 }" />
            <stop offset="1" :style="{ stopColor: 'var(--paper)', stopOpacity: 0 }" />
          </radialGradient>
          <radialGradient id="moon-shade" cx="0.32" cy="0.3" r="0.85">
            <stop offset="0.55" stop-color="#000" stop-opacity="0" />
            <stop offset="1" stop-color="#000" stop-opacity="0.32" />
          </radialGradient>
        </defs>
        <circle class="halo" r="96" fill="url(#moon-halo)" />
        <g class="body">
          <circle r="46" fill="oklch(0.94 0.02 90)" />
          <circle v-for="(crater, index) in craters" :key="index" v-bind="crater" fill="oklch(0.84 0.025 85)" />
          <circle r="46" fill="url(#moon-shade)" />
        </g>
      </motion.svg>

      <motion.svg
        v-else
        key="sun"
        viewBox="-100 -100 200 200"
        class="size-full overflow-visible"
        :initial="{ y: 40, opacity: 0, rotate: 25 }"
        :animate="{ y: 0, opacity: 1, rotate: 0 }"
        :exit="{ y: 50, opacity: 0, rotate: -20 }"
        :transition="{ duration: 0.7, ease: ease.outQuint }"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="sun-halo">
            <stop offset="0.35" :style="{ stopColor: 'var(--volt)', stopOpacity: 0.5 }" />
            <stop offset="1" :style="{ stopColor: 'var(--volt)', stopOpacity: 0 }" />
          </radialGradient>
          <radialGradient id="sun-core" cx="0.38" cy="0.35" r="0.75">
            <stop offset="0" stop-color="oklch(0.98 0.08 105)" />
            <stop offset="0.6" :style="{ stopColor: 'var(--volt)' }" />
            <stop offset="1" :style="{ stopColor: 'var(--ember)' }" />
          </radialGradient>
        </defs>
        <circle class="halo" r="98" fill="url(#sun-halo)" />
        <g class="rays-twist">
          <g class="rays">
            <rect
              v-for="angle in rays"
              :key="angle"
              x="-3.5"
              y="-82"
              width="7"
              height="20"
              rx="3.5"
              :transform="`rotate(${angle})`"
              fill="var(--volt)"
            />
          </g>
        </g>
        <circle class="body" r="46" fill="url(#sun-core)" />
      </motion.svg>
    </AnimatePresence>

    <span
      class="text-label pointer-events-none absolute top-full mt-1 translate-y-1 whitespace-nowrap opacity-0 transition duration-300 ease-out-quint group-hover/celestial:translate-y-0 group-hover/celestial:opacity-80 group-focus-visible/celestial:translate-y-0 group-focus-visible/celestial:opacity-80"
      aria-hidden="true"
    >
      {{ isDark ? 'Let the sun up' : 'Call the night' }}
    </span>
  </button>
</template>

<style scoped>
.halo {
  transform-origin: center;
  transform-box: fill-box;
  animation: breathe 5s var(--ease-in-out-quart) infinite alternate;
}

/*
 * view-box's reference box starts at the user-space origin, not at the viewBox corner, so
 * `center` would be (100,100). The sun sits at (0,0): pivot there explicitly.
 */
.rays {
  transform-origin: 0 0;
  transform-box: view-box;
  animation: spin 40s linear infinite;
}

/* Hover adds an extra twist and a flare on top of the idle spin. */
.rays-twist {
  transform-origin: 0 0;
  transform-box: view-box;
  transition:
    rotate 1.4s var(--ease-out-expo),
    scale 0.6s var(--ease-out-expo);
}

.body {
  transform-origin: center;
  transform-box: fill-box;
  transition: scale 0.6s var(--ease-out-expo);
}

@media (hover: hover) {
  .celestial:hover .rays-twist {
    rotate: 60deg;
    scale: 1.12;
  }

  .celestial:hover .body {
    scale: 1.06;
  }
}

@keyframes spin {
  to {
    rotate: 360deg;
  }
}

@keyframes breathe {
  from {
    scale: 0.9;
    opacity: 0.75;
  }
  to {
    scale: 1.08;
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .halo,
  .rays {
    animation: none;
  }
}
</style>
