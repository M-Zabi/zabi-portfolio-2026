<script setup lang="ts">
import { useDocumentVisibility, useElementVisibility, useEventListener, useResizeObserver } from '@vueuse/core'
import { useReducedMotion } from 'motion-v'
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'

import { useTheme } from '@/composables/useTheme'
import { hasWebGL } from '@/lib/webgl'

import AiOrb from './AiOrb.vue'
import type { OrbScene, OrbState } from './orb-scene'

/**
 * The assistant's body. three.js is fetched on demand; until the first frame renders (or
 * without WebGL) the CSS orb stands in, so there is always something alive on screen.
 */
const props = defineProps<{ state: OrbState }>()

const host = useTemplateRef<HTMLDivElement>('host')
const canvas = useTemplateRef<HTMLCanvasElement>('canvas')
const status = ref<'loading' | 'ready' | 'unsupported'>('loading')

const { isDark } = useTheme()
const reducedMotion = useReducedMotion()
const visibility = useDocumentVisibility()
const onScreen = useElementVisibility(host)
const active = computed(() => onScreen.value && visibility.value === 'visible')

let scene: OrbScene | null = null
let disposed = false

function resize() {
  if (scene && host.value) scene.setSize(host.value.clientWidth, host.value.clientHeight)
}

onMounted(() => {
  if (!canvas.value || !hasWebGL()) {
    status.value = 'unsupported'
    return
  }
  void (async () => {
    try {
      const { OrbScene } = await import('./orb-scene')
      if (disposed || !canvas.value) return
      scene = new OrbScene({ canvas: canvas.value, dark: isDark.value, reducedMotion: reducedMotion.value })
      resize()
      scene.setState(props.state)
      scene.setActive(active.value)
      await scene.ready
      if (!disposed) status.value = 'ready'
    } catch (error) {
      status.value = 'unsupported'
      if (import.meta.env.DEV) console.warn('[AssistantOrb] falling back to the CSS orb', error)
    }
  })()
})

onBeforeUnmount(() => {
  disposed = true
  scene?.dispose()
  scene = null
})

useResizeObserver(host, resize)
useEventListener(
  window,
  'pointermove',
  (event: PointerEvent) => {
    if (!scene || !host.value) return
    const rect = host.value.getBoundingClientRect()
    scene.setPointer(((event.clientX - rect.left) / rect.width) * 2 - 1, ((event.clientY - rect.top) / rect.height) * 2 - 1)
  },
  { passive: true },
)

watch(
  () => props.state,
  (state) => scene?.setState(state),
)
watch(isDark, (dark) => scene?.setTheme(dark))
watch(reducedMotion, (reduced) => scene?.setReducedMotion(reduced))
watch(active, (value) => scene?.setActive(value))

/** Keystrokes and clicks make the orb shiver. */
function pulse(strength?: number) {
  scene?.pulse(strength)
}

defineExpose({ pulse })

const cssState = computed(() =>
  props.state === 'listening' ? 'idle' : props.state === 'speaking' ? 'speaking' : props.state === 'thinking' ? 'thinking' : props.state,
)
</script>

<template>
  <div ref="host" class="relative size-full" aria-hidden="true">
    <div class="absolute inset-0 grid place-items-center transition-opacity duration-700 ease-out-quint" :class="status === 'ready' ? 'opacity-0' : 'opacity-100'">
      <AiOrb class="w-[46%]" :state="cssState" />
    </div>
    <canvas
      ref="canvas"
      class="absolute inset-0 size-full transition-opacity duration-[1200ms] ease-out-quint"
      :class="status === 'ready' ? 'opacity-100' : 'opacity-0'"
    />
  </div>
</template>
