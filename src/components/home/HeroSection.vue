<script setup lang="ts">
import { ArrowDownIcon, ArrowRightIcon, Gamepad2Icon, GlobeIcon } from '@lucide/vue'
import { useEventListener, useMediaQuery } from '@vueuse/core'
import { motion, useReducedMotion } from 'motion-v'
import { ref } from 'vue'

import ArrowLink from '@/components/common/ArrowLink.vue'
import IndiaFlag from '@/components/common/IndiaFlag.vue'
import StatusDot from '@/components/common/StatusDot.vue'
import FadeIn from '@/components/motion/FadeIn.vue'
import RevealText from '@/components/motion/RevealText.vue'
import RotatingWord from '@/components/motion/RotatingWord.vue'
import { getLenis } from '@/composables/useLenis'
import { usePageReady } from '@/composables/usePageReady'
import { site, yearsOfExperience } from '@/config/site'
import { ease } from '@/lib/motion'

/** Press-and-hold anywhere on the hero (outside links) scatters the 3D symbol. */
const blast = defineModel<boolean>('blast', { default: false })

const pageReady = usePageReady()
const reducedMotion = useReducedMotion()
const finePointer = useMediaQuery('(hover: hover) and (pointer: fine)')
const rotating = ref(false)

const words = ['alive', 'effortless', 'native', 'inevitable', 'fast']

function onPointerDown(event: PointerEvent) {
  if (event.button !== 0 || reducedMotion.value) return
  if ((event.target as Element).closest('a, button, input, textarea, select')) return
  blast.value = true
}

const release = () => (blast.value = false)
useEventListener(window, 'pointerup', release)
useEventListener(window, 'pointercancel', release)
useEventListener(window, 'blur', release)

function scrollToContent() {
  const target = document.getElementById('manifesto')
  if (!target) return
  const lenis = getLenis()
  if (lenis) lenis.scrollTo(target, { offset: -40 })
  else target.scrollIntoView({ behavior: 'smooth' })
}
</script>

<template>
  <section
    class="relative z-10 flex min-h-svh flex-col pt-(--header-h)"
    :class="finePointer && 'select-none'"
    aria-labelledby="hero-title"
    @pointerdown="onPointerDown"
  >
    <div class="container-page flex flex-1 flex-col justify-between gap-14 pt-8 pb-8 lg:pt-12">
      <div>
        <div class="flex flex-wrap items-center justify-between gap-x-6 gap-y-1">
          <FadeIn as="p" :y="10" class="text-label flex items-center gap-3 text-muted-foreground">
            <StatusDot />
            {{ site.role }}
          </FadeIn>
          <FadeIn :y="10" :delay="0.1">
            <RouterLink
              to="/about#off-the-clock"
              class="group/play text-label -my-3 inline-flex min-h-11 items-center gap-2 text-muted-foreground transition-colors duration-300 hover:text-foreground"
            >
              <Gamepad2Icon
                class="size-4 transition-transform duration-500 ease-out-expo group-hover/play:-rotate-12"
                aria-hidden="true"
              />
              Off the clock: PC gamer
              <ArrowRightIcon
                class="size-3 -translate-x-1 opacity-0 transition duration-300 ease-out-quint group-hover/play:translate-x-0 group-hover/play:opacity-100"
                aria-hidden="true"
              />
            </RouterLink>
          </FadeIn>
        </div>

        <h1 id="hero-title" class="mt-6 font-display text-display-xl tracking-[-0.05em] [font-stretch:104%]">
          <RevealText text="Software" trigger="ready" class="block" />
          <RevealText text="that feels" trigger="ready" :delay="0.08" class="block" @revealed="rotating = true" />
          <span class="reveal-mask block pr-[0.1em]">
            <motion.span
              class="block text-primary italic"
              :initial="{ y: '112%' }"
              :animate="{ y: pageReady ? '0%' : '112%' }"
              :transition="{ duration: 1, delay: 0.2, ease: ease.outQuint }"
            >
              <RotatingWord :words="words" :active="rotating" />
            </motion.span>
          </span>
        </h1>

        <FadeIn :delay="0.55" :y="16" class="mt-10 flex flex-wrap gap-x-6 gap-y-2">
          <ArrowLink to="/contact" label="Discuss your project" />
          <ArrowLink to="/work" label="See selected work" />
        </FadeIn>
      </div>

      <div class="grid items-end gap-10 md:grid-cols-[1fr_auto_1fr]">
        <FadeIn :delay="0.7" class="hidden md:block">
          <button
            type="button"
            class="grid size-12 place-items-center rounded-full border border-border bg-background/60 backdrop-blur-md transition-colors hover:bg-accent"
            aria-label="Scroll to content"
            @click="scrollToContent"
          >
            <ArrowDownIcon class="size-4 motion-safe:animate-float" aria-hidden="true" />
          </button>
        </FadeIn>

        <FadeIn
          v-if="finePointer && !reducedMotion"
          :delay="0.8"
          class="text-label hidden text-center text-muted-foreground md:block"
          aria-hidden="true"
        >
          Press &amp; hold to <span class="text-primary">scatter</span><br />
          Move to tilt the light
        </FadeIn>
        <span v-else class="hidden md:block" />

        <FadeIn :delay="0.65" class="max-w-sm md:justify-self-end">
          <div class="grid grid-cols-[auto_1fr] divide-x divide-border rounded-xl border border-border bg-background/60 backdrop-blur-md">
            <div class="flex flex-col items-center justify-center gap-2 px-5 py-4">
              <GlobeIcon class="size-6 stroke-[1.25]" aria-hidden="true" />
              <span class="text-label">Est. {{ site.startedYear }}</span>
            </div>
            <p class="text-label flex items-center px-5 py-4">
              {{ yearsOfExperience }}+ years shipping web, mobile &amp; desktop
            </p>
          </div>
          <p class="mt-5 text-lead text-balance">
            Web platforms, React Native apps and desktop tools — built in {{ site.home.city }},
            <span class="whitespace-nowrap">{{ site.home.country }} <IndiaFlag class="inline-block w-[1.05em] align-baseline" /></span>,
            for clarity, speed and feel.
          </p>
        </FadeIn>
      </div>
    </div>
  </section>
</template>
