<script setup lang="ts">
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion-v'
import { computed, ref, useTemplateRef, watch } from 'vue'

import AppMark from '@/components/layout/AppMark.vue'
import { site } from '@/config/site'

/**
 * A business card with real depth: stacked edge layers give it thickness, the pointer
 * tilts it on springs, a glare and foil sheen track the light, and it flips on click,
 * Enter or Space. Reduced motion keeps the flip but drops the springs and tilt.
 */
const stage = useTemplateRef<HTMLElement>('stage')
const flipped = ref(false)
const hovering = ref(false)
const reducedMotion = useReducedMotion()

const tiltX = useMotionValue(0)
const tiltY = useMotionValue(0)
const flip = useMotionValue(0)
const glareX = useMotionValue(50)
const glareY = useMotionValue(30)

const combinedY = useTransform([tiltY, flip], ([tilt = 0, turn = 0]: number[]) => tilt + turn)
const rotateX = useSpring(tiltX, { stiffness: 150, damping: 18, mass: 0.8 })
const rotateY = useSpring(combinedY, { stiffness: 110, damping: 15, mass: 1 })

const glare = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgb(255 255 255 / 0.3), transparent 50%)`
const sheenAngle = useTransform(glareX, [0, 100], [95, 155])
const sheen = useMotionTemplate`linear-gradient(${sheenAngle}deg, transparent 32%, oklch(0.93 0.18 108 / 0.16) 46%, oklch(0.72 0.19 40 / 0.18) 54%, transparent 68%)`

watch(flipped, (value) => flip.set(value ? 180 : 0))

function onMove(event: PointerEvent) {
  if (reducedMotion.value || !stage.value || event.pointerType === 'touch') return
  hovering.value = true
  const rect = stage.value.getBoundingClientRect()
  const x = (event.clientX - rect.left) / rect.width
  const y = (event.clientY - rect.top) / rect.height
  tiltY.set((x - 0.5) * 28)
  tiltX.set((0.5 - y) * 22)
  glareX.set(x * 100)
  glareY.set(y * 100)
}

function onLeave() {
  hovering.value = false
  tiltX.set(0)
  tiltY.set(0)
  glareX.set(50)
  glareY.set(30)
}

const host = computed(() => site.url.replace(/^https?:\/\//, '').replace(/\/$/, ''))

/** Deterministic dot matrix — decorative, seeded from the email so it is unique per owner. */
const dots = computed(() => {
  let seed = Array.from(site.email).reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return Array.from({ length: 49 }, () => {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280 > 0.45
  })
})
</script>

<template>
  <div ref="stage" class="mx-auto w-full max-w-[34rem]" @pointermove="onMove" @pointerleave="onLeave">
    <div
      class="[perspective:1400px]"
      :class="!hovering && !reducedMotion && 'animate-float'"
    >
      <motion.button
        type="button"
        class="@container relative block aspect-[1.75/1] w-full rounded-[1.25rem] text-left [transform-style:preserve-3d] focus-visible:outline-offset-8"
        :style="reducedMotion ? { rotateY: flipped ? 180 : 0 } : { rotateX, rotateY }"
        :aria-pressed="flipped"
        :aria-label="`${site.fullName} business card — ${flipped ? 'back' : 'front'}. Press to flip.`"
        @click="flipped = !flipped"
      >
        <!-- Card stock: stacked layers read as thickness when tilted. -->
        <span
          v-for="layer in 6"
          :key="layer"
          aria-hidden="true"
          class="absolute inset-0 rounded-[1.25rem] bg-[oklch(0.32_0.03_45)]"
          :style="{ transform: `translateZ(${layer - 3.5}px)` }"
        />

        <!-- Front -->
        <span
          aria-hidden="true"
          class="face grain absolute inset-0 flex flex-col justify-between overflow-hidden rounded-[1.25rem] bg-ink p-[6.5cqw] text-paper"
          style="transform: translateZ(3px)"
        >
          <AppMark class="absolute -right-[10cqw] -bottom-[8cqw] w-[78cqw] text-paper/[0.05]" />
          <span class="relative flex items-start justify-between">
            <AppMark class="h-[7cqw] text-ember" />
            <span class="font-mono text-[2.3cqw] tracking-[0.08em] uppercase opacity-60">Est. {{ site.startedYear }}</span>
          </span>
          <span class="relative flex items-end justify-between gap-[4cqw]">
            <span class="flex flex-col">
              <span class="font-display text-[7.4cqw] leading-none font-bold tracking-[-0.03em] [font-stretch:112%]">
                {{ site.fullName }}
              </span>
              <span class="mt-[1.8cqw] font-mono text-[2.3cqw] tracking-[0.06em] uppercase opacity-70">{{ site.role }}</span>
            </span>
            <span class="text-right font-mono text-[2.1cqw] leading-relaxed tracking-[0.06em] uppercase opacity-60">
              Web<br />Mobile<br />Desktop
            </span>
          </span>
          <motion.span class="pointer-events-none absolute inset-0 mix-blend-screen" :style="{ backgroundImage: sheen }" />
          <motion.span class="pointer-events-none absolute inset-0" :style="{ backgroundImage: glare }" />
        </span>

        <!-- Back -->
        <span
          aria-hidden="true"
          class="face grain absolute inset-0 flex flex-col justify-between overflow-hidden rounded-[1.25rem] bg-ember p-[6.5cqw] text-ember-foreground"
          style="transform: rotateY(180deg) translateZ(3px)"
        >
          <span class="flex items-start justify-between">
            <span class="font-mono text-[2.3cqw] tracking-[0.08em] uppercase opacity-70">Contact</span>
            <AppMark class="h-[4.5cqw]" />
          </span>
          <span class="flex items-end justify-between gap-[5cqw]">
            <span class="flex min-w-0 flex-col gap-[1.6cqw]">
              <span class="truncate font-display text-[5.2cqw] leading-tight font-semibold tracking-[-0.02em]">
                {{ site.email }}
              </span>
              <span class="font-mono text-[2.3cqw] tracking-[0.06em] uppercase opacity-75">{{ host }}</span>
              <span class="font-mono text-[2.3cqw] tracking-[0.06em] uppercase opacity-75">{{ site.location }}</span>
            </span>
            <span class="grid shrink-0 grid-cols-7 gap-[0.8cqw]">
              <span
                v-for="(on, index) in dots"
                :key="index"
                class="size-[1.7cqw] rounded-[0.3cqw]"
                :class="on ? 'bg-ember-foreground' : 'bg-ember-foreground/15'"
              />
            </span>
          </span>
          <motion.span class="pointer-events-none absolute inset-0" :style="{ backgroundImage: glare }" />
        </span>
      </motion.button>
    </div>

    <div
      class="mx-auto mt-10 h-5 w-3/4 rounded-[50%] bg-ink/20 blur-xl dark:bg-black/60"
      aria-hidden="true"
    />
  </div>
</template>

<style scoped>
.face {
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}
</style>
