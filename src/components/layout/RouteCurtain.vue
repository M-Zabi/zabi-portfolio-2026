<script setup lang="ts">
import { animate, stagger, useReducedMotion } from 'motion-v'
import { nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'

import { ease } from '@/lib/motion'
import { type CurtainDriver, useTransitionStore } from '@/stores/transition'

/**
 * Page transition: columns rise to cover the page, the destination title appears (with
 * a loading bar while the next route's chunk resolves), then the columns lift away.
 */
const transition = useTransitionStore()
const reducedMotion = useReducedMotion()
const root = useTemplateRef<HTMLElement>('root')
const active = ref(false)

const columns = () => root.value?.querySelectorAll<HTMLElement>('[data-curtain-col]') ?? []
const label = () => root.value?.querySelector<HTMLElement>('[data-curtain-label]') ?? null

const driver: CurtainDriver = {
  async cover() {
    active.value = true
    await nextTick()
    if (!root.value) return

    if (reducedMotion.value) {
      // No movement: park the columns in place and cross-fade the whole layer.
      columns().forEach((column) => (column.style.transform = 'translateY(0%)'))
      label()?.style.setProperty('opacity', '1')
      await animate(root.value, { opacity: [0, 1] }, { duration: 0.15 }).finished
      return
    }

    root.value.style.opacity = '1'
    await animate(
      columns(),
      { transform: ['translateY(101%)', 'translateY(0%)'] },
      { duration: 0.65, delay: stagger(0.05), ease: ease.inOutQuart },
    ).finished

    const title = label()
    if (title) {
      animate(
        title,
        { opacity: [0, 1], transform: ['translateY(40%)', 'translateY(0%)'] },
        { duration: 0.5, ease: ease.outQuint },
      )
    }
  },

  async reveal() {
    if (!root.value) return

    if (reducedMotion.value) {
      await animate(root.value, { opacity: 0 }, { duration: 0.2 }).finished
      columns().forEach((column) => (column.style.transform = 'translateY(101%)'))
      active.value = false
      return
    }

    const title = label()
    if (title) animate(title, { opacity: 0, transform: 'translateY(-40%)' }, { duration: 0.35, ease: ease.inOutQuart })

    await animate(
      columns(),
      { transform: ['translateY(0%)', 'translateY(-101%)'] },
      { duration: 0.8, delay: stagger(0.05, { startDelay: 0.12 }), ease: ease.inOutQuart },
    ).finished
    active.value = false
  },
}

let unregister: (() => void) | undefined
onMounted(() => (unregister = transition.register(driver)))
onBeforeUnmount(() => unregister?.())
</script>

<template>
  <div
    ref="root"
    class="fixed inset-0 z-[90]"
    :class="active ? 'visible' : 'pointer-events-none invisible'"
    aria-hidden="true"
  >
    <div class="absolute inset-0 flex">
      <div v-for="index in 5" :key="index" data-curtain-col class="curtain-col -mr-px h-full flex-1 bg-foreground" />
    </div>

    <div class="absolute inset-0 grid place-items-center">
      <div data-curtain-label class="flex flex-col items-center gap-6 text-background opacity-0">
        <span class="font-display text-display-lg">{{ transition.label }}</span>
        <span class="relative block h-px w-28 overflow-hidden bg-background/20">
          <span class="loading-bar absolute inset-y-0 left-0 block w-1/2 bg-ember" />
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.curtain-col {
  transform: translateY(101%);
}

.loading-bar {
  animation: loading 1.1s var(--ease-in-out-quart) infinite;
}

@keyframes loading {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(200%);
  }
}
</style>
