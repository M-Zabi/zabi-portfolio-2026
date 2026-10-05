<script setup lang="ts">
import { motion, useInView, useReducedMotion, useScroll, useTransform } from 'motion-v'
import { computed, useTemplateRef, watch } from 'vue'

import { useTheme } from '@/composables/useTheme'
import { canopyRidge, canopyTree, fern, grass, groundBand, palm, scatter, vines } from '@/lib/forest'

import JaguarWalker from './JaguarWalker.vue'

/**
 * Layered rainforest silhouette (far → mid → near → grass) in a fixed 1600 × 420 scene,
 * anchored to the bottom and cropped (`slice`) so it never distorts. Layers rise into place
 * with parallax as the footer is revealed; a jaguar prowls between the mid-ground and the
 * foreground plants. Everything pauses while off-screen.
 */
const W = 1600
const H = 420
/**
 * The jaguar's path. Everything below it is a strip of dark ground that carries the credits.
 * Nothing in the scene rises above y ≈ 150: the container is never shorter than 17vw (see
 * AppFooter), so on the widest crops that band is still visible sky — no tree is ever cut flat.
 */
const GROUND = 340
const JAGUAR_SCALE = 0.85
/** Paws (local y ≈ 126.6) land on the ground line. */
const JAGUAR_Y = GROUND - 126.6 * JAGUAR_SCALE
/**
 * Seconds to cross the scene, derived from the stride (≈54 local units/s of stance-foot
 * travel × scale) so the paws plant instead of skating.
 */
const PROWL = Math.round(2240 / (54 * JAGUAR_SCALE))

const FAR = [
  canopyRidge({ width: W, floor: H, base: 252, amplitude: 38, step: 80, seed: 11 }),
  canopyTree({ x: 250, ground: 268, height: 98, spread: 140, seed: 3 }),
  canopyTree({ x: 1210, ground: 266, height: 108, spread: 160, seed: 5 }),
  palm({ x: 720, ground: 256, height: 74, lean: 10, seed: 7, size: 0.7 }),
].join(' ')

const MID = [
  canopyRidge({ width: W, floor: H, base: 296, amplitude: 26, step: 58, seed: 23 }),
  palm({ x: 130, ground: 318, height: 136, lean: 26, seed: 31, size: 0.9 }),
  palm({ x: 520, ground: 320, height: 112, lean: -18, seed: 37, size: 0.85 }),
  canopyTree({ x: 800, ground: 314, height: 140, spread: 180, seed: 41 }),
  palm({ x: 1030, ground: 318, height: 146, lean: 22, seed: 43, size: 0.9 }),
  palm({ x: 1430, ground: 318, height: 124, lean: -24, seed: 47, size: 0.85 }),
].join(' ')

const VINES = vines({ anchors: [734, 758, 796, 846, 872], y: 186, seed: 19 })

const NEAR = [
  groundBand({ width: W, y: GROUND, floor: H, seed: 53 }),
  palm({ x: 40, ground: 346, height: 188, lean: 36, seed: 59, size: 1.2, fronds: 10 }),
  palm({ x: 1562, ground: 346, height: 196, lean: -40, seed: 61, size: 1.25, fronds: 10 }),
  fern({ x: 150, ground: 344, size: 76, seed: 67 }),
  fern({ x: 310, ground: 344, size: 46, seed: 71, blades: 7 }),
  fern({ x: 1290, ground: 344, size: 54, seed: 73 }),
  fern({ x: 1455, ground: 344, size: 84, seed: 79 }),
].join(' ')

const GRASS = grass({ width: W, ground: 349, seed: 83, spacing: 7, minHeight: 6, maxHeight: 22, groups: 3 })
const FIREFLIES = scatter({ count: 16, x: [120, 1480], y: [200, 334], seed: 89 })

const root = useTemplateRef<HTMLElement>('root')
const svg = useTemplateRef<SVGSVGElement>('svg')
const { isDark } = useTheme()
const reducedMotion = useReducedMotion()
const inView = useInView(root, { margin: '10% 0px 10% 0px' })

const animate = computed(() => !reducedMotion.value)
const paused = computed(() => !inView.value)

// SMIL (the jaguar) has its own clock: pause it alongside the CSS animations.
watch(
  [paused, svg],
  ([isPaused, element]) => {
    if (!element) return
    if (isPaused) element.pauseAnimations()
    else element.unpauseAnimations()
  },
  { immediate: true },
)

const { scrollYProgress } = useScroll({ target: root, offset: ['start end', 'end end'] })
const farY = useTransform(scrollYProgress, [0, 1], [46, 0])
const midY = useTransform(scrollYProgress, [0, 1], [80, 0])
const nearY = useTransform(scrollYProgress, [0, 1], [110, 0])
</script>

<template>
  <div ref="root" class="forest relative" :data-paused="paused || undefined">
    <svg
      ref="svg"
      class="absolute inset-0 size-full"
      :viewBox="`0 0 ${W} ${H}`"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
    >
      <motion.g :style="reducedMotion ? undefined : { y: farY }">
        <path :d="FAR" fill="var(--forest-far)" />
      </motion.g>

      <motion.g :style="reducedMotion ? undefined : { y: midY }">
        <path :d="MID" fill="var(--forest-mid)" />
        <path
          v-for="(vine, index) in VINES"
          :key="index"
          class="vine"
          :d="vine.d"
          fill="none"
          stroke="var(--forest-mid)"
          stroke-width="2.4"
          stroke-linecap="round"
          :style="{ animationDelay: `${-index * 1.7}s` }"
        />
      </motion.g>

      <motion.g :style="reducedMotion ? undefined : { y: nearY }">
        <!-- The prowl: a slow walk across, behind the foreground plants. -->
        <g>
          <animateTransform
            v-if="animate"
            attributeName="transform"
            type="translate"
            from="-320 0"
            to="1920 0"
            :dur="`${PROWL}s`"
            begin="-14s"
            repeatCount="indefinite"
          />
          <g :transform="`translate(${animate ? 0 : 1000} ${JAGUAR_Y}) scale(${JAGUAR_SCALE})`">
            <JaguarWalker :animate="animate" />
          </g>
        </g>

        <path :d="NEAR" fill="var(--forest-near)" />
        <path
          v-for="(blades, index) in GRASS"
          :key="index"
          class="grass"
          :d="blades"
          fill="var(--forest-front)"
          :style="{ animationDelay: `${-index * 1.4}s`, animationDuration: `${4.6 + index * 0.9}s` }"
        />

        <g v-if="isDark">
          <circle
            v-for="fly in FIREFLIES"
            :key="fly.id"
            class="firefly"
            :cx="fly.x"
            :cy="fly.y"
            :r="1.6 + fly.size * 1.4"
            :style="{
              '--dx': `${(fly.size - 0.5) * 36}px`,
              '--dy': `${-12 - fly.delay * 22}px`,
              animationDelay: `${-fly.delay * 9}s, ${-fly.size * 3}s`,
              animationDuration: `${7 + fly.size * 6}s, ${2.2 + fly.delay * 2}s`,
            }"
          />
        </g>
      </motion.g>
    </svg>
  </div>
</template>

<style scoped>
.grass {
  transform-box: fill-box;
  transform-origin: 50% 100%;
  animation: grass-sway 5s var(--ease-in-out-quart) infinite alternate;
}

.vine {
  transform-box: fill-box;
  transform-origin: 50% 0%;
  animation: vine-sway 6.5s ease-in-out infinite alternate;
}

.firefly {
  fill: var(--volt);
  filter: drop-shadow(0 0 4px var(--volt)) drop-shadow(0 0 10px var(--volt));
  animation-name: firefly-drift, firefly-blink;
  animation-timing-function: ease-in-out, ease-in-out;
  animation-iteration-count: infinite, infinite;
  animation-direction: alternate, alternate;
}

.forest[data-paused] :is(.grass, .vine, .firefly) {
  animation-play-state: paused;
}

@keyframes grass-sway {
  from {
    transform: skewX(-4deg);
  }
  to {
    transform: skewX(5deg);
  }
}

@keyframes vine-sway {
  from {
    transform: rotate(-3.5deg);
  }
  to {
    transform: rotate(3.5deg);
  }
}

@keyframes firefly-drift {
  from {
    transform: translate(0, 0);
  }
  to {
    transform: translate(var(--dx), var(--dy));
  }
}

@keyframes firefly-blink {
  0%,
  35% {
    opacity: 0.15;
  }
  60%,
  100% {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .grass,
  .vine,
  .firefly {
    animation: none;
  }
}
</style>
