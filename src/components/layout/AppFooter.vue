<script setup lang="ts">
import { ArrowUpIcon, ArrowUpRightIcon, CheckIcon, CopyIcon } from '@lucide/vue'
import { useClipboard } from '@vueuse/core'
import { AnimatePresence, motion } from 'motion-v'
import { toast } from 'vue-sonner'

import IndiaFlag from '@/components/common/IndiaFlag.vue'
import LocalTime from '@/components/common/LocalTime.vue'
import StatusDot from '@/components/common/StatusDot.vue'
import CelestialToggle from '@/components/footer/CelestialToggle.vue'
import FooterCtaBadge from '@/components/footer/FooterCtaBadge.vue'
import FooterMarquee from '@/components/footer/FooterMarquee.vue'
import FooterSky from '@/components/footer/FooterSky.vue'
import FooterWeather from '@/components/footer/FooterWeather.vue'
import KonamiHint from '@/components/footer/KonamiHint.vue'
import ForestScene from '@/components/footer/ForestScene.vue'
import FadeIn from '@/components/motion/FadeIn.vue'
import RevealText from '@/components/motion/RevealText.vue'
import RollingText from '@/components/motion/RollingText.vue'
import { scrollToTop } from '@/composables/useLenis'
import { site } from '@/config/site'
import { spring } from '@/lib/motion'

const { copy, copied, isSupported } = useClipboard({ copiedDuring: 2000 })
const year = new Date().getFullYear()
const marquee = ['Developer.', 'Designer.', 'Hardwork.']

async function copyEmail() {
  if (!isSupported.value) {
    window.location.href = `mailto:${site.email}`
    return
  }
  await copy(site.email)
  toast.success('Email copied', { description: site.email })
}
</script>

<template>
  <footer class="site-footer relative isolate flex flex-col overflow-hidden text-paper">
    <FooterSky />

    <div class="container-page relative z-10 grid gap-x-10 gap-y-12 pt-16 lg:grid-cols-12 lg:pt-20">
      <!-- Sun by day, moon by night — and a theme toggle. -->
      <FadeIn :y="-16" class="flex justify-end lg:col-span-4 lg:col-start-9 lg:row-start-1">
        <CelestialToggle />
      </FadeIn>

      <div class="lg:col-span-7 lg:col-start-1 lg:row-span-2 lg:row-start-1">
        <FadeIn as="p" :y="10" class="text-label opacity-70">(Next step)</FadeIn>
        <h2 class="mt-5 font-display text-[clamp(2.75rem,1.4rem+4.6vw,6rem)] leading-[0.92] tracking-[-0.04em]">
          <RevealText :text="'Got something\nthat needs to *move?*'" emphasis-class="text-volt" />
        </h2>

        <FadeIn :delay="0.2" class="mt-10 flex flex-wrap items-center gap-x-8 gap-y-6">
          <FooterCtaBadge />
          <button
            type="button"
            class="group/copy inline-flex min-h-11 items-center gap-3 text-lead font-medium underline decoration-paper/30 decoration-1 underline-offset-[6px] transition-[text-decoration-color] duration-300 hover:decoration-volt"
            @click="copyEmail"
          >
            {{ site.email }}
            <span class="relative grid size-5 place-items-center" aria-hidden="true">
              <AnimatePresence mode="popLayout" :initial="false">
                <motion.span
                  :key="copied ? 'done' : 'copy'"
                  class="col-start-1 row-start-1 grid place-items-center"
                  :initial="{ scale: 0.4, opacity: 0, rotate: -45 }"
                  :animate="{ scale: 1, opacity: 1, rotate: 0 }"
                  :exit="{ scale: 0.4, opacity: 0, rotate: 45 }"
                  :transition="spring.snappy"
                >
                  <CheckIcon v-if="copied" class="size-4 text-volt" />
                  <CopyIcon v-else class="size-4 opacity-60 transition-opacity group-hover/copy:opacity-100" />
                </motion.span>
              </AnimatePresence>
            </span>
            <span class="sr-only">{{ copied ? '— copied' : '— copy to clipboard' }}</span>
          </button>
        </FadeIn>
      </div>

      <div class="grid grid-cols-2 gap-x-6 gap-y-10 lg:col-span-4 lg:col-start-9 lg:row-start-2">
        <FadeIn as="nav" :delay="0.1" aria-label="Footer">
          <p class="text-label opacity-60">Sitemap</p>
          <ul class="mt-3">
            <li v-for="item in site.nav" :key="item.to">
              <RouterLink :to="item.to" class="footer-link roll-trigger group/link">
                <span class="footer-link-dash" aria-hidden="true" />
                <RollingText :text="item.label" />
              </RouterLink>
            </li>
          </ul>
        </FadeIn>

        <FadeIn :delay="0.18">
          <p class="text-label opacity-60">Elsewhere</p>
          <ul class="mt-3">
            <li v-for="social in site.socials" :key="social.label">
              <a :href="social.href" target="_blank" rel="noopener noreferrer" class="footer-link roll-trigger group/link">
                <span class="footer-link-dash" aria-hidden="true" />
                <RollingText :text="social.label" />
                <ArrowUpRightIcon
                  class="size-3.5 -translate-x-1 translate-y-1 opacity-0 transition duration-300 ease-out-quint group-hover/link:translate-0 group-hover/link:opacity-100"
                  aria-hidden="true"
                />
              </a>
            </li>
          </ul>
        </FadeIn>

        <FadeIn :delay="0.26">
          <p class="text-label opacity-60">Local time</p>
          <p class="mt-3 font-display text-2xl font-semibold"><LocalTime /></p>
        </FadeIn>

        <FadeIn :delay="0.3">
          <FooterWeather />
        </FadeIn>

        <FadeIn :delay="0.34">
          <p class="text-label opacity-60">Based in</p>
          <p class="mt-3 flex items-start gap-2.5 text-sm font-medium">
            <IndiaFlag class="mt-0.5 w-6 shrink-0" />
            <span>{{ site.home.city }}, {{ site.home.region }}, {{ site.home.country }}</span>
          </p>
        </FadeIn>

        <FadeIn :delay="0.38">
          <p class="text-label opacity-60">Status</p>
          <p class="mt-3 flex items-start gap-2.5 text-sm font-medium">
            <StatusDot class="mt-1.5" />
            {{ site.availability.label }}
          </p>
        </FadeIn>
      </div>
    </div>

    <div class="relative mt-10 flex flex-1 flex-col">
      <FooterMarquee :words="marquee" class="relative z-0" />
      <ForestScene class="forest-scene relative z-10 -mt-[clamp(2.5rem,5vw,5.5rem)]" />

      <div class="absolute inset-x-0 bottom-0 z-20">
        <div class="container-page text-label flex flex-wrap items-center justify-between gap-x-6 gap-y-2 pb-4 opacity-85">
          <span>© {{ year }} {{ site.fullName }}</span>
          <span class="hidden items-center gap-3 sm:inline-flex">
            Vue · motion · three.js · a jaguar
            <span class="opacity-40" aria-hidden="true">/</span>
            <KonamiHint />
          </span>
          <button type="button" class="roll-trigger group/top inline-flex min-h-11 items-center gap-2 uppercase" @click="scrollToTop()">
            <RollingText text="Back to top" />
            <ArrowUpIcon
              class="size-3.5 transition-transform duration-500 ease-out-expo group-hover/top:-translate-y-1"
              aria-hidden="true"
            />
          </button>
        </div>
      </div>
    </div>
  </footer>
</template>

<!--
  Theme palette lives in an unscoped block: a scoped `:global(.dark) .site-footer` compiles to
  just `.dark`, which put the night palette on <html> where the footer never saw it.
-->
<style>
/* Scene palette — day under a cobalt sky, night under deep navy. */
.site-footer {
  --sky-top: oklch(0.47 0.2 262);
  --sky-bottom: oklch(0.6 0.16 250);
  --sky-glow: oklch(0.93 0.18 108 / 0.28);
  --forest-far: oklch(0.4 0.15 262);
  --forest-mid: oklch(0.3 0.12 264);
  --forest-near: oklch(0.21 0.08 266);
  --forest-front: oklch(0.16 0.05 266);
  --jaguar: oklch(0.13 0.04 266);
  --jaguar-far: oklch(0.19 0.06 266);
  --jaguar-rosette: oklch(0.25 0.08 266);
  --jaguar-eye: var(--jaguar);

  background:
    radial-gradient(38% 42% at 88% 10%, var(--sky-glow), transparent 70%),
    linear-gradient(180deg, var(--sky-top) 0%, var(--sky-top) 35%, var(--sky-bottom) 100%);
}

.dark .site-footer {
  --sky-top: oklch(0.15 0.035 270);
  --sky-bottom: oklch(0.31 0.08 258);
  --sky-glow: oklch(0.95 0.02 90 / 0.1);
  --forest-far: oklch(0.245 0.06 262);
  --forest-mid: oklch(0.18 0.042 264);
  --forest-near: oklch(0.13 0.028 266);
  --forest-front: oklch(0.1 0.02 266);
  --jaguar: oklch(0.075 0.012 266);
  --jaguar-far: oklch(0.14 0.025 266);
  --jaguar-rosette: oklch(0.15 0.03 266);
  /* Eyes catch the moonlight. */
  --jaguar-eye: var(--volt);
  --jaguar-eye-glow: drop-shadow(0 0 2px var(--volt));
}
</style>

<style scoped>
/* Never shorter than 17vw: at the widest crop the scene's empty top band stays visible. */
.forest-scene {
  height: clamp(13rem, 34vw, 22rem);
  min-height: 17vw;
}

.footer-link {
  position: relative;
  display: inline-flex;
  min-height: 2.5rem;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 500;
  transition: color 0.3s var(--ease-out-quint);
}

/* A short volt dash slides in from the left on hover / focus. */
.footer-link-dash {
  position: absolute;
  right: calc(100% + 0.5rem);
  top: 50%;
  height: 1px;
  width: 1rem;
  background: var(--volt);
  transform: scaleX(0);
  transform-origin: right;
  transition: transform 0.5s var(--ease-out-expo);
}

@media (hover: hover) {
  .footer-link:hover {
    color: var(--volt);
  }

  .footer-link:hover .footer-link-dash {
    transform: scaleX(1);
  }
}

.footer-link:focus-visible .footer-link-dash {
  transform: scaleX(1);
}

/*
 * Curtain reveal: on screens tall enough to hold the whole footer, it sits pinned beneath the
 * page and is uncovered as the content scrolls away; the forest absorbs any spare height.
 */
@media (min-width: 1024px) and (min-height: 840px) {
  .site-footer {
    position: sticky;
    bottom: 0;
    z-index: 0;
    height: 100svh;
  }

  .forest-scene {
    height: auto;
    min-height: max(13rem, 17vw);
    flex: 1;
  }
}
</style>
