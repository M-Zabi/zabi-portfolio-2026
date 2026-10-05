<script setup lang="ts">
import { Gamepad2Icon } from '@lucide/vue'
import { useDocumentVisibility, useResizeObserver } from '@vueuse/core'
import { useInView, useReducedMotion } from 'motion-v'
import { computed, onBeforeUnmount, ref, useTemplateRef, watch } from 'vue'

import BentoTile from '@/components/home/bento/BentoTile.vue'
import { usePageReady } from '@/composables/usePageReady'
import { hasWebGL } from '@/lib/webgl'

import type { ControllerScene, ControllerVariant } from './controller-scene'

/**
 * Hero tile: a 3D Xbox Elite Series 2 that idles on its own; each press rumbles it and swaps
 * the finish between black and the white Core. three.js loads once
 * the page has been revealed, so it never competes with the preloader.
 */
defineProps<{ delay?: number }>()

const stage = useTemplateRef<HTMLButtonElement>('stage')
const canvas = useTemplateRef<HTMLCanvasElement>('canvas')
const status = ref<'idle' | 'loading' | 'ready' | 'unsupported'>('idle')
const finishes: ControllerVariant[] = ['black', 'white']
const variant = ref<ControllerVariant>('black')

const pageReady = usePageReady()
const inView = useInView(stage)
const visibility = useDocumentVisibility()
const reducedMotion = useReducedMotion()
const active = computed(() => inView.value && visibility.value === 'visible')

let scene: ControllerScene | null = null
let disposed = false

function resize() {
  if (scene && stage.value) scene.setSize(stage.value.clientWidth, stage.value.clientHeight)
}

async function load() {
  if (!canvas.value || !hasWebGL()) {
    status.value = 'unsupported'
    return
  }
  status.value = 'loading'
  try {
    const { ControllerScene } = await import('./controller-scene')
    if (disposed || !canvas.value) return
    scene = new ControllerScene({ canvas: canvas.value, reducedMotion: reducedMotion.value })
    resize()
    scene.setActive(active.value)
    await scene.ready
    if (!disposed) status.value = 'ready'
  } catch (error) {
    status.value = 'unsupported'
    if (import.meta.env.DEV) console.warn('[ControllerWidget] falling back to an icon', error)
  }
}

watch(
  () => pageReady.value && inView.value,
  (go) => go && status.value === 'idle' && void load(),
  { immediate: true },
)
watch(active, (value) => scene?.setActive(value))
watch(reducedMotion, (value) => scene?.setReducedMotion(value))
useResizeObserver(stage, resize)

onBeforeUnmount(() => {
  disposed = true
  scene?.dispose()
  scene = null
})

function onMove(event: PointerEvent) {
  if (!stage.value || event.pointerType === 'touch') return
  const rect = stage.value.getBoundingClientRect()
  scene?.setPointer(((event.clientX - rect.left) / rect.width) * 2 - 1, ((event.clientY - rect.top) / rect.height) * 2 - 1)
}

function onLeave() {
  scene?.setPointer(0, 0)
}

/** Every press rumbles and swaps the finish: black ⇄ white. */
function press() {
  if (!scene) return
  scene.rumble()
  variant.value = scene.toggleVariant()
  // The real thing, where the device can.
  if (!reducedMotion.value) navigator.vibrate?.(120)
}
</script>

<template>
  <BentoTile tone="volt" :delay="delay" content-class="rounded-2xl p-0 sm:p-0">
    <button
      ref="stage"
      type="button"
      class="relative block size-full text-left"
      :aria-label="`Xbox Elite Series 2 controller, ${variant} — press to rumble and switch to ${variant === 'black' ? 'white' : 'black'}`"
      @click="press"
      @pointermove="onMove"
      @pointerleave="onLeave"
    >
      <span class="text-label absolute top-3 left-3.5 z-10 opacity-70 xl:top-4 xl:left-4">(Elite Series 2)</span>
      <!-- Finish swatches: the ring marks the one on show. -->
      <span v-if="status === 'ready'" class="absolute top-3 right-3.5 z-10 flex gap-1.5 xl:top-4 xl:right-4" aria-hidden="true">
        <span
          v-for="finish in finishes"
          :key="finish"
          class="size-2.5 rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.25)] ring-offset-1 ring-offset-volt transition-shadow duration-300"
          :class="[finish === 'black' ? 'bg-[#141414]' : 'bg-[#efefeb]', variant === finish && 'ring-1 ring-volt-foreground/70']"
        />
      </span>
      <!-- Contact shadow under the floating pad. -->
      <span
        class="absolute inset-x-[18%] bottom-[16%] h-[10%] rounded-[50%] bg-volt-foreground/30 blur-md"
        aria-hidden="true"
      />
      <canvas
        ref="canvas"
        class="absolute inset-0 size-full transition-opacity duration-700 ease-out-quint"
        :class="status === 'ready' ? 'opacity-100' : 'opacity-0'"
        aria-hidden="true"
      />
      <Gamepad2Icon
        v-if="status === 'unsupported'"
        class="absolute inset-0 m-auto size-16 stroke-[1.25]"
        aria-hidden="true"
      />
      <span class="text-label absolute bottom-3 left-3.5 z-10 opacity-60 xl:bottom-4 xl:left-4">Tap to rumble &amp; swap</span>
    </button>
  </BentoTile>
</template>
