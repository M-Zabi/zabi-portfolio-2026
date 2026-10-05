<script setup lang="ts">
import { useHead } from '@unhead/vue'
import { MotionConfig } from 'motion-v'
import { nextTick, onBeforeUnmount, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'

import AppErrorBoundary from '@/components/layout/AppErrorBoundary.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppMenu from '@/components/layout/AppMenu.vue'
import AppPreloader from '@/components/layout/AppPreloader.vue'
import RouteAnnouncer from '@/components/layout/RouteAnnouncer.vue'
import RouteCurtain from '@/components/layout/RouteCurtain.vue'
import { Toaster } from '@/components/ui/sonner'
import { createSmoothScroll, getLenis } from '@/composables/useLenis'
import { useTheme } from '@/composables/useTheme'
import { documentTitle } from '@/config/seo'
import { useBootStore } from '@/stores/boot'
import { useTransitionStore } from '@/stores/transition'
import { useUiStore } from '@/stores/ui'

const router = useRouter()
const boot = useBootStore()
const ui = useUiStore()
const transition = useTransitionStore()

useTheme()

useHead({
  titleTemplate: (title?: string) => documentTitle(title),
  htmlAttrs: { lang: 'en' },
})

// What the first paint genuinely waits for. The home view adds the WebGL scene itself.
boot.track('fonts', document.fonts.ready, 1)
boot.track(
  'window',
  new Promise<void>((resolve) => {
    if (document.readyState === 'complete') resolve()
    else window.addEventListener('load', () => resolve(), { once: true })
  }),
  1,
)
boot.track(
  'route',
  router.isReady().then(() => nextTick()),
  2,
)

let destroySmoothScroll: () => void = () => undefined

onMounted(() => {
  destroySmoothScroll = createSmoothScroll()
  if (!boot.hasRevealed) getLenis()?.stop()
})

onBeforeUnmount(() => destroySmoothScroll())

watch(
  () => boot.hasRevealed,
  (revealed) => revealed && getLenis()?.start(),
)

// The menu sheet owns scrolling while open.
watch(
  () => ui.isMenuOpen,
  (open) => {
    const lenis = getLenis()
    if (open) lenis?.stop()
    else if (boot.hasRevealed && transition.state === 'idle') lenis?.start()
  },
)
</script>

<template>
  <MotionConfig reduced-motion="user">
    <a
      href="#main"
      class="sr-only z-[110] rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
    >
      Skip to content
    </a>

    <AppPreloader />
    <AppHeader />
    <AppMenu />

    <!-- Lifts off the footer on large screens (see AppFooter's curtain reveal). -->
    <div class="relative z-10 bg-background shadow-[0_40px_80px_-40px_rgb(0_0_0/0.45)]">
      <main id="main" tabindex="-1" class="outline-none">
        <RouterView v-slot="{ Component, route }">
          <AppErrorBoundary>
            <component :is="Component" :key="route.path" />
          </AppErrorBoundary>
        </RouterView>
      </main>
    </div>

    <AppFooter />
    <RouteCurtain />
    <RouteAnnouncer />
    <Toaster position="bottom-center" :visible-toasts="3" />
  </MotionConfig>
</template>
