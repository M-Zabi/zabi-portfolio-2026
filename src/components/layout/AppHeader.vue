<script setup lang="ts">
import { motion, useMotionValueEvent, useScroll } from 'motion-v'
import { ref } from 'vue'

import LocalTime from '@/components/common/LocalTime.vue'
import StatusDot from '@/components/common/StatusDot.vue'
import RollingText from '@/components/motion/RollingText.vue'
import { Button } from '@/components/ui/button'
import { site } from '@/config/site'
import { ease } from '@/lib/motion'
import { useBootStore } from '@/stores/boot'
import { useUiStore } from '@/stores/ui'

import AppLogo from './AppLogo.vue'
import ThemeToggle from './ThemeToggle.vue'

const ui = useUiStore()
const boot = useBootStore()

const { scrollY } = useScroll()
const hidden = ref(false)
const scrolled = ref(false)

// Hide while reading down the page, return the moment the visitor scrolls back up.
useMotionValueEvent(scrollY, 'change', (latest) => {
  const previous = scrollY.getPrevious() ?? 0
  scrolled.value = latest > 24
  hidden.value = latest > previous && latest > 180 && !ui.isMenuOpen
})

/** Staggered drop-in once the preloader lifts. */
function enter(index: number) {
  return {
    initial: { opacity: 0, y: -14 },
    animate: boot.hasRevealed ? { opacity: 1, y: 0 } : { opacity: 0, y: -14 },
    transition: { duration: 0.8, delay: 0.35 + index * 0.07, ease: ease.outQuint },
  }
}
</script>

<template>
  <motion.header
    class="fixed inset-x-0 top-0 z-50"
    :initial="false"
    :animate="{ y: hidden ? '-100%' : '0%' }"
    :transition="{ duration: 0.5, ease: ease.outQuint }"
  >
    <div
      class="absolute inset-0 border-b transition-[background-color,border-color] duration-500"
      :class="scrolled ? 'border-border/70 bg-background/75 backdrop-blur-xl' : 'border-transparent'"
    />

    <div class="container-page relative flex h-(--header-h) items-center justify-between gap-4">
      <motion.div v-bind="enter(0)">
        <RouterLink
          to="/"
          class="-m-2 inline-flex min-h-11 items-center rounded-md p-2"
          :aria-label="`${site.name} — home`"
        >
          <AppLogo />
        </RouterLink>
      </motion.div>

      <motion.p
        v-bind="enter(1)"
        class="text-label hidden items-center gap-3 text-muted-foreground lg:flex"
      >
        <StatusDot />
        <span>{{ site.availability.label }}</span>
        <span aria-hidden="true" class="opacity-40">/</span>
        <LocalTime />
      </motion.p>

      <div class="flex items-center gap-2">
        <motion.div v-bind="enter(2)">
          <ThemeToggle />
        </motion.div>

        <motion.div v-bind="enter(3)" class="hidden sm:block">
          <Button as-child variant="ink" size="pill" class="roll-trigger">
            <RouterLink to="/contact"><RollingText text="Let’s talk" /></RouterLink>
          </Button>
        </motion.div>

        <motion.div v-bind="enter(4)">
          <button
            type="button"
            class="roll-trigger group/menu inline-flex h-11 items-center gap-3 rounded-full border border-border bg-background/80 pr-4 pl-5 text-[0.8125rem] font-medium tracking-wide uppercase backdrop-blur-md transition-colors duration-200 hover:bg-accent"
            aria-haspopup="dialog"
            aria-controls="site-menu"
            :aria-expanded="ui.isMenuOpen"
            @click="ui.openMenu()"
          >
            <RollingText text="Menu" />
            <span class="flex h-2.5 w-4 flex-col justify-between" aria-hidden="true">
              <span
                class="h-px w-full origin-right bg-current transition-transform duration-300 ease-out-quint group-hover/menu:scale-x-60"
              />
              <span class="h-px w-full bg-current" />
            </span>
          </button>
        </motion.div>
      </div>
    </div>
  </motion.header>
</template>
