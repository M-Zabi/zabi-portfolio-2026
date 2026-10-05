<script setup lang="ts">
import { computed } from 'vue'

import type { Sky } from '@/lib/weather'

/**
 * An animated weather icon built from a few parts — sun or moon, cloud, rain, snow, fog and
 * lightning — combined per sky type. Everything loops gently; reduced motion holds a still frame.
 */
const props = defineProps<{ sky: Sky; day: boolean }>()

const parts = computed(() => {
  const { sky } = props
  const wet = sky === 'rain' || sky === 'showers' || sky === 'storm'
  return {
    celestial: sky === 'clear' ? 'large' : sky === 'partly' || sky === 'showers' ? 'small' : null,
    cloud: sky !== 'clear',
    backCloud: sky === 'cloudy' || sky === 'storm',
    drops: wet ? 3 : sky === 'drizzle' ? 2 : 0,
    snow: sky === 'snow',
    fog: sky === 'fog',
    bolt: sky === 'storm',
  }
})

const rays = Array.from({ length: 8 }, (_, index) => (index * Math.PI) / 4)
const dropX = [19, 26, 33]
</script>

<template>
  <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
    <!-- Sun / moon: full size on clear days, peeking from behind the cloud otherwise. -->
    <g
      v-if="parts.celestial"
      :transform="parts.celestial === 'large' ? 'translate(24 24)' : 'translate(17 16) scale(0.62)'"
    >
      <g v-if="day">
        <g class="rays">
          <line
            v-for="angle in rays"
            :key="angle"
            :x1="Math.cos(angle) * 11"
            :y1="Math.sin(angle) * 11"
            :x2="Math.cos(angle) * 15.5"
            :y2="Math.sin(angle) * 15.5"
            stroke="var(--ember)"
            stroke-width="2.2"
            stroke-linecap="round"
          />
        </g>
        <circle class="core" r="7.5" fill="var(--ember)" />
      </g>
      <g v-else class="moon">
        <path
          d="M4.5 -9.5 A10 10 0 1 0 9.5 5.5 A8 8 0 0 1 4.5 -9.5 Z"
          fill="oklch(0.9 0.1 95)"
          stroke="currentColor"
          stroke-width="1.4"
          stroke-linejoin="round"
        />
        <circle class="twinkle" cx="11" cy="-10" r="1.1" fill="currentColor" />
        <circle class="twinkle twinkle--late" cx="14" cy="-3" r="0.8" fill="currentColor" />
      </g>
    </g>

    <g v-if="parts.backCloud" class="drift drift--slow" transform="translate(-9 -6) scale(0.8)" opacity="0.55">
      <path
        d="M14 32 H36 A8 8 0 0 0 36 16 A10 10 0 0 0 17 19 A7 7 0 0 0 14 32 Z"
        fill="var(--card)"
        stroke="currentColor"
        stroke-width="1.6"
        stroke-linejoin="round"
      />
    </g>

    <g v-if="parts.cloud" class="drift" transform="translate(-4 1)">
      <path
        d="M14 32 H36 A8 8 0 0 0 36 16 A10 10 0 0 0 17 19 A7 7 0 0 0 14 32 Z"
        :fill="parts.bolt ? 'color-mix(in oklch, currentColor 22%, var(--card))' : 'var(--card)'"
        stroke="currentColor"
        stroke-width="1.6"
        stroke-linejoin="round"
      />
    </g>

    <g v-if="parts.drops">
      <line
        v-for="index in parts.drops"
        :key="index"
        class="drop"
        :style="{ animationDelay: `${index * -0.37}s` }"
        :x1="dropX[index - 1]"
        y1="37"
        :x2="dropX[index - 1]! - 1.5"
        y2="41"
        stroke="var(--cobalt)"
        :stroke-width="parts.drops === 2 ? 1.6 : 2"
        stroke-linecap="round"
      />
    </g>

    <g v-if="parts.snow">
      <circle
        v-for="(x, index) in dropX"
        :key="x"
        class="flake"
        :style="{ animationDelay: `${index * -0.8}s` }"
        :cx="x"
        cy="38"
        r="1.6"
        fill="currentColor"
      />
    </g>

    <g v-if="parts.fog" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
      <line class="mist" x1="12" y1="38" x2="32" y2="38" />
      <line class="mist mist--reverse" x1="18" y1="42.5" x2="38" y2="42.5" />
    </g>

    <path
      v-if="parts.bolt"
      class="bolt"
      d="M26 30 L21 38 H25.5 L22.5 45 L31 35 H26.5 L29 30 Z"
      fill="var(--volt)"
      stroke="currentColor"
      stroke-width="1.2"
      stroke-linejoin="round"
    />
  </svg>
</template>

<style scoped>
.rays,
.core,
.moon,
.flake {
  transform-box: fill-box;
  transform-origin: center;
}

.rays {
  animation: turn 14s linear infinite;
}

.core {
  animation: pulse 3s ease-in-out infinite alternate;
}

.moon {
  animation: rock 6s ease-in-out infinite alternate;
}

.twinkle {
  animation: twinkle 2.4s ease-in-out infinite alternate;
}

.twinkle--late {
  animation-delay: -1.2s;
}

.drift {
  animation: drift 5s ease-in-out infinite alternate;
}

.drift--slow {
  animation-duration: 7s;
  animation-direction: alternate-reverse;
}

.drop {
  animation: fall 1.1s linear infinite;
}

.flake {
  animation: snow 2.6s linear infinite;
}

.mist {
  animation: mist 4s ease-in-out infinite alternate;
}

.mist--reverse {
  animation-direction: alternate-reverse;
}

.bolt {
  animation: flash 3.6s linear infinite;
}

@keyframes turn {
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  to {
    transform: scale(1.1);
  }
}

@keyframes rock {
  from {
    transform: rotate(-7deg);
  }
  to {
    transform: rotate(7deg);
  }
}

@keyframes twinkle {
  from {
    opacity: 0.15;
  }
  to {
    opacity: 1;
  }
}

@keyframes drift {
  from {
    translate: -1.5px 0;
  }
  to {
    translate: 1.5px 0;
  }
}

@keyframes fall {
  0% {
    opacity: 0;
    translate: 1px -4px;
  }
  25% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    translate: -1.5px 6px;
  }
}

@keyframes snow {
  0% {
    opacity: 0;
    translate: 0 -4px;
  }
  20% {
    opacity: 1;
  }
  50% {
    translate: 1.5px 1px;
  }
  100% {
    opacity: 0;
    translate: -1px 7px;
  }
}

@keyframes mist {
  from {
    translate: -3px 0;
  }
  to {
    translate: 3px 0;
  }
}

@keyframes flash {
  0%,
  58%,
  74%,
  100% {
    opacity: 0;
  }
  60%,
  64%,
  68% {
    opacity: 1;
  }
  62%,
  66% {
    opacity: 0.25;
  }
}

/* A still frame: everything visible, nothing moving. */
@media (prefers-reduced-motion: reduce) {
  .rays,
  .core,
  .moon,
  .twinkle,
  .drift,
  .drop,
  .flake,
  .mist,
  .bolt {
    animation: none;
  }
}
</style>
