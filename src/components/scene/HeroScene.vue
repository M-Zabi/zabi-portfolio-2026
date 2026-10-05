<script setup lang="ts">
import { useDocumentVisibility, useEventListener, useResizeObserver } from '@vueuse/core'
import { useMotionValueEvent, useReducedMotion, useScroll } from 'motion-v'
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'

import AppMark from '@/components/layout/AppMark.vue'
import { useTheme } from '@/composables/useTheme'
import { clamp, smoothstep } from '@/lib/utils'
import { hasWebGL } from '@/lib/webgl'
import { useBootStore } from '@/stores/boot'

import type { SymbolScene } from './symbol-scene'

/**
 * Fixed WebGL backdrop for the home page. three.js is fetched on demand, so it never
 * blocks first paint; the preloader waits for the first rendered frame (or times out).
 */
const props = defineProps<{ blast?: boolean }>()

const host = useTemplateRef<HTMLDivElement>('host')
const canvas = useTemplateRef<HTMLCanvasElement>('canvas')
const status = ref<'loading' | 'ready' | 'unsupported'>('loading')
const fade = ref(1)

const boot = useBootStore()
const { isDark } = useTheme()
const reducedMotion = useReducedMotion()
const visibility = useDocumentVisibility()
const { scrollY } = useScroll()

let scene: SymbolScene | null = null
let disposed = false

const active = computed(() => fade.value > 0.01 && visibility.value === 'visible')

function resize() {
  if (scene && host.value) scene.setSize(host.value.clientWidth, host.value.clientHeight)
}

function syncScroll(y: number) {
  const viewport = window.innerHeight
  const max = Math.max(1, document.documentElement.scrollHeight - viewport)
  // Fade out before the footer slides in from beneath the page.
  const exit = smoothstep(max - viewport * 1.5, max - viewport * 0.6, y)
  const hero = clamp(y / viewport)
  fade.value = (1 - hero * 0.5) * (1 - exit)
  scene?.setScroll(hero, clamp(y / max))
}

onMounted(() => {
  if (!canvas.value || !hasWebGL()) {
    status.value = 'unsupported'
    return
  }

  const load = (async () => {
    const { SymbolScene } = await import('./symbol-scene')
    if (disposed || !canvas.value) return
    scene = new SymbolScene({ canvas: canvas.value, dark: isDark.value, reducedMotion: reducedMotion.value })
    resize()
    syncScroll(window.scrollY)
    scene.setActive(active.value)
    await scene.ready
    if (!disposed) status.value = 'ready'
  })().catch((error: unknown) => {
    status.value = 'unsupported'
    if (import.meta.env.DEV) console.warn('[HeroScene] falling back to static mark', error)
  })

  boot.track('scene', load, 3)
})

onBeforeUnmount(() => {
  disposed = true
  scene?.dispose()
  scene = null
})

useResizeObserver(host, resize)
useMotionValueEvent(scrollY, 'change', syncScroll)
useEventListener(
  window,
  'pointermove',
  (event: PointerEvent) =>
    scene?.setPointer((event.clientX / window.innerWidth) * 2 - 1, (event.clientY / window.innerHeight) * 2 - 1),
  { passive: true },
)

watch(isDark, (dark) => scene?.setTheme(dark))
watch(reducedMotion, (reduced) => scene?.setReducedMotion(reduced))
watch(active, (value) => scene?.setActive(value))
watch(
  () => props.blast,
  (value) => scene?.setBlast(Boolean(value)),
)
</script>

<template>
  <div ref="host" class="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
    <!-- Loading / no-WebGL composition: a warm glow where the mark will appear. -->
    <div
      class="absolute inset-0 transition-opacity duration-1000 ease-out-quint"
      :style="{ opacity: status === 'ready' ? 0 : fade }"
    >
      <div class="scene-glow absolute inset-0" />
      <AppMark
        v-if="status === 'unsupported'"
        class="absolute top-1/2 right-[6%] w-[44vw] -translate-y-1/2 text-foreground/10 max-md:top-auto max-md:right-1/2 max-md:bottom-[12%] max-md:w-[80vw] max-md:translate-x-1/2 max-md:translate-y-0"
      />
    </div>

    <div class="absolute inset-0" :style="{ opacity: fade }">
      <canvas
        ref="canvas"
        class="size-full transition-opacity duration-[1600ms] ease-out-quint"
        :class="status === 'ready' ? 'opacity-100' : 'opacity-0'"
      />
    </div>
  </div>
</template>

<style scoped>
.scene-glow {
  background:
    radial-gradient(38% 46% at 66% 52%, color-mix(in oklch, var(--ember) 26%, transparent), transparent 70%),
    radial-gradient(30% 36% at 76% 64%, color-mix(in oklch, var(--cobalt) 18%, transparent), transparent 70%);
  filter: blur(24px);
}

@media (max-width: 767px) {
  .scene-glow {
    background: radial-gradient(60% 34% at 55% 72%, color-mix(in oklch, var(--ember) 26%, transparent), transparent 70%);
  }
}
</style>
