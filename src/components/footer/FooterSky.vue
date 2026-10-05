<script setup lang="ts">
import { useInView } from 'motion-v'
import { useTemplateRef } from 'vue'

import { useTheme } from '@/composables/useTheme'
import { scatter } from '@/lib/forest'

/** Sky life behind the footer: stars and shooting stars at night, clouds and birds by day. */
const { isDark } = useTheme()
const root = useTemplateRef<HTMLElement>('root')
const inView = useInView(root)

const STARS = scatter({ count: 90, x: [0, 1600], y: [0, 620], seed: 97 })

/** A soft cumulus: overlapping ellipses on a flat base. */
function cloud(x: number, y: number, w: number) {
  const lobes = [
    [0.18, 0.62, 0.2, 0.32],
    [0.42, 0.42, 0.26, 0.5],
    [0.68, 0.52, 0.22, 0.4],
    [0.86, 0.68, 0.16, 0.26],
  ] as const
  return lobes
    .map(([cx, cy, rx, ry]) => {
      const ex = x + cx * w
      const ey = y + cy * w * 0.4
      const erx = rx * w
      const ery = ry * w * 0.4
      return `M${ex - erx} ${ey} a${erx} ${ery} 0 1 0 ${erx * 2} 0 a${erx} ${ery} 0 1 0 ${-erx * 2} 0Z`
    })
    .join(' ')
}

const CLOUDS = [
  { d: cloud(0, 120, 300), duration: 150, delay: -20, opacity: 0.22 },
  { d: cloud(0, 260, 220), duration: 120, delay: -80, opacity: 0.16 },
  { d: cloud(0, 60, 180), duration: 190, delay: -130, opacity: 0.14 },
]

const BIRDS = [
  { x: 0, y: 0, scale: 1 },
  { x: -34, y: 18, scale: 0.8 },
  { x: 28, y: 22, scale: 0.7 },
  { x: -64, y: 34, scale: 0.6 },
]
</script>

<template>
  <div ref="root" class="sky pointer-events-none absolute inset-0 overflow-hidden" :data-paused="!inView || undefined" aria-hidden="true">
    <Transition name="sky-fade" mode="out-in">
      <svg v-if="isDark" key="night" class="absolute inset-0 size-full" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMin slice">
        <defs>
          <linearGradient id="shooting-star" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stop-color="var(--paper)" stop-opacity="0" />
            <stop offset="1" stop-color="var(--paper)" stop-opacity="0.95" />
          </linearGradient>
        </defs>
        <circle
          v-for="star in STARS"
          :key="star.id"
          class="star"
          :cx="star.x"
          :cy="star.y"
          :r="0.6 + star.size * 1.3"
          :style="{ animationDelay: `${-star.delay * 6}s`, animationDuration: `${2.6 + star.size * 4}s` }"
        />
        <g class="shooting-star">
          <line x1="0" y1="0" x2="140" y2="46" stroke="url(#shooting-star)" stroke-width="1.6" stroke-linecap="round" />
        </g>
        <g class="shooting-star shooting-star--late">
          <line x1="0" y1="0" x2="110" y2="36" stroke="url(#shooting-star)" stroke-width="1.2" stroke-linecap="round" />
        </g>
      </svg>

      <svg v-else key="day" class="absolute inset-0 size-full" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMin slice">
        <path
          v-for="(item, index) in CLOUDS"
          :key="index"
          class="cloud"
          :d="item.d"
          fill="var(--paper)"
          :fill-opacity="item.opacity"
          :style="{ animationDuration: `${item.duration}s`, animationDelay: `${item.delay}s` }"
        />
        <g class="flock">
          <g v-for="(bird, index) in BIRDS" :key="index" :transform="`translate(${bird.x} ${bird.y}) scale(${bird.scale})`">
            <path
              class="bird"
              d="M0 0 Q7 -7 13 -1 Q19 -7 26 0"
              fill="none"
              stroke="var(--paper)"
              stroke-opacity="0.75"
              stroke-width="2.2"
              stroke-linecap="round"
              stroke-linejoin="round"
              :style="{ animationDelay: `${-index * 0.17}s` }"
            />
          </g>
        </g>
      </svg>
    </Transition>
  </div>
</template>

<style scoped>
.star {
  fill: var(--paper);
  animation: twinkle 4s ease-in-out infinite alternate;
}

.shooting-star {
  opacity: 0;
  animation: shoot 11s var(--ease-out-quint) infinite;
}

.shooting-star--late {
  animation-delay: 6.5s;
  animation-duration: 14s;
}

.cloud {
  animation: cloud-drift 150s linear infinite;
}

.flock {
  animation: flock 42s linear infinite;
  animation-delay: -6s;
}

.bird {
  transform-box: fill-box;
  transform-origin: 50% 100%;
  animation: flap 0.7s ease-in-out infinite alternate;
}

.sky[data-paused] :is(.star, .shooting-star, .cloud, .flock, .bird) {
  animation-play-state: paused;
}

.sky-fade-enter-active,
.sky-fade-leave-active {
  transition: opacity 0.6s var(--ease-out-quint);
}

.sky-fade-enter-from,
.sky-fade-leave-to {
  opacity: 0;
}

@keyframes twinkle {
  from {
    opacity: 0.15;
  }
  to {
    opacity: 0.95;
  }
}

@keyframes shoot {
  0% {
    opacity: 0;
    transform: translate(1180px, 40px);
  }
  1.5% {
    opacity: 1;
  }
  7% {
    opacity: 0;
    transform: translate(760px, 180px);
  }
  100% {
    opacity: 0;
    transform: translate(760px, 180px);
  }
}

@keyframes cloud-drift {
  from {
    transform: translateX(-420px);
  }
  to {
    transform: translateX(1800px);
  }
}

@keyframes flock {
  from {
    transform: translate(-160px, 300px);
  }
  to {
    transform: translate(1780px, 150px);
  }
}

@keyframes flap {
  from {
    transform: scaleY(1);
  }
  to {
    transform: scaleY(-0.55);
  }
}

@media (prefers-reduced-motion: reduce) {
  .star,
  .cloud,
  .bird {
    animation: none;
  }

  .shooting-star,
  .flock {
    display: none;
  }
}
</style>
