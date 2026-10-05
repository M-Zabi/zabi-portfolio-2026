<script setup lang="ts">
import { ArrowUpRightIcon, XIcon } from '@lucide/vue'
import { motion } from 'motion-v'
import { useRoute } from 'vue-router'

import LocalTime from '@/components/common/LocalTime.vue'
import StatusDot from '@/components/common/StatusDot.vue'
import RollingText from '@/components/motion/RollingText.vue'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { site } from '@/config/site'
import { ease } from '@/lib/motion'
import { padIndex } from '@/lib/utils'
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()
const route = useRoute()

const isActive = (to: string) => (to === '/' ? route.path === '/' : route.path.startsWith(to))

/** Links rise out of their rows one after another as the panel slides in. */
const linkTransition = (index: number) => ({ duration: 1, delay: 0.22 + index * 0.075, ease: ease.outQuint })
const detailTransition = (index: number) => ({ duration: 0.8, delay: 0.55 + index * 0.06, ease: ease.outQuint })
</script>

<template>
  <Sheet v-model:open="ui.isMenuOpen">
    <SheetContent
      id="site-menu"
      side="right"
      :show-close-button="false"
      data-lenis-prevent
      class="grain gap-0 border-none bg-ember p-0 text-ember-foreground data-[side=right]:w-full data-[side=right]:sm:max-w-[42rem]"
    >
      <SheetTitle class="sr-only">Menu</SheetTitle>
      <SheetDescription class="sr-only">Site navigation and contact details.</SheetDescription>

      <div class="flex h-full flex-col overflow-y-auto overscroll-contain px-(--gutter) pb-8">
        <div class="flex h-(--header-h) shrink-0 items-center justify-between">
          <span class="text-label opacity-70">Navigation</span>
          <SheetClose as-child>
            <button
              type="button"
              class="roll-trigger inline-flex h-11 items-center gap-2.5 rounded-full bg-ember-foreground pr-4 pl-5 text-[0.8125rem] font-medium tracking-wide text-ember uppercase transition-transform duration-200 active:scale-95"
            >
              <RollingText text="Close" />
              <XIcon class="size-4" aria-hidden="true" />
            </button>
          </SheetClose>
        </div>

        <nav aria-label="Site" class="mt-4 flex-1">
          <ol>
            <li
              v-for="(item, index) in site.nav"
              :key="item.to"
              class="overflow-hidden border-b border-ember-foreground/15"
            >
              <motion.div :initial="{ y: '110%' }" :animate="{ y: '0%' }" :transition="linkTransition(index)">
                <RouterLink
                  :to="item.to"
                  class="menu-link group/link flex min-h-11 items-center justify-between gap-4 py-3 sm:py-4"
                  :aria-current="isActive(item.to) ? 'page' : undefined"
                >
                  <span class="flex items-baseline gap-4 sm:gap-6">
                    <span class="text-label tabular opacity-60">{{ padIndex(index + 1) }}</span>
                    <span class="menu-label font-display">{{ item.label }}</span>
                  </span>
                  <ArrowUpRightIcon
                    class="size-8 shrink-0 -translate-x-3 opacity-0 transition duration-500 ease-out-expo group-hover/link:translate-x-0 group-hover/link:opacity-100 group-focus-visible/link:translate-x-0 group-focus-visible/link:opacity-100 sm:size-10"
                    aria-hidden="true"
                  />
                </RouterLink>
              </motion.div>
            </li>
          </ol>
        </nav>

        <div class="mt-12 grid gap-10 sm:grid-cols-2">
          <motion.div :initial="{ opacity: 0, y: 20 }" :animate="{ opacity: 1, y: 0 }" :transition="detailTransition(0)">
            <p class="text-label opacity-60">Elsewhere</p>
            <ul class="mt-3 grid grid-cols-2 gap-x-4">
              <li v-for="social in site.socials" :key="social.label">
                <a
                  :href="social.href"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="roll-trigger inline-flex min-h-11 items-center text-base font-medium"
                >
                  <RollingText :text="social.label" />
                </a>
              </li>
            </ul>
          </motion.div>

          <motion.div :initial="{ opacity: 0, y: 20 }" :animate="{ opacity: 1, y: 0 }" :transition="detailTransition(1)">
            <p class="text-label opacity-60">Say hello</p>
            <a
              :href="`mailto:${site.email}`"
              class="mt-3 inline-block font-display text-2xl font-semibold tracking-tight underline decoration-1 underline-offset-[6px] decoration-ember-foreground/30 transition-[text-decoration-color] hover:decoration-ember-foreground"
            >
              {{ site.email }}
            </a>
            <p class="mt-5 flex items-center gap-2.5 text-sm font-medium">
              <StatusDot />
              {{ site.availability.label }}
            </p>
            <p class="text-label mt-2 opacity-70">Local time · <LocalTime /></p>
          </motion.div>
        </div>
      </div>
    </SheetContent>
  </Sheet>
</template>

<style scoped>
.menu-label {
  display: inline-block;
  font-size: clamp(2.75rem, 1.4rem + 5.6vw, 5.75rem);
  line-height: 1;
  letter-spacing: -0.04em;
  font-weight: 600;
  font-stretch: 100%;
  /* Kinetic type: the width axis of Mona Sans opens up on hover. */
  transition:
    font-stretch 0.7s var(--ease-out-expo),
    font-weight 0.7s var(--ease-out-expo);
}

@media (hover: hover) {
  .menu-link:hover .menu-label {
    font-stretch: 125%;
    font-weight: 750;
  }
}

.menu-link:focus-visible .menu-label {
  font-stretch: 125%;
  font-weight: 750;
}

.menu-link[aria-current='page'] .menu-label {
  font-style: italic;
}
</style>
