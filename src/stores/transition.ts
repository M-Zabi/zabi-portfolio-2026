import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export interface CurtainDriver {
  cover: () => Promise<void>
  reveal: () => Promise<void>
}

export type CurtainState = 'idle' | 'covering' | 'covered' | 'revealing'

/**
 * Coordinates the route curtain. Router guards call `cover()` / `reveal()`; the
 * `RouteCurtain` component registers the driver that actually animates.
 */
export const useTransitionStore = defineStore('route-transition', () => {
  const state = ref<CurtainState>('idle')
  const label = ref('')
  let driver: CurtainDriver | null = null
  let covering: Promise<void> | null = null

  /** Page content may animate in — nothing is covering it. */
  const isSettled = computed(() => state.value === 'idle' || state.value === 'revealing')

  function register(next: CurtainDriver) {
    driver = next
    return () => {
      if (driver === next) driver = null
    }
  }

  async function cover(nextLabel: string) {
    label.value = nextLabel
    // A second navigation while covered re-uses the curtain instead of replaying it.
    if (state.value === 'covered') return
    if (state.value === 'covering' && covering) return covering

    state.value = 'covering'
    covering = (driver?.cover() ?? Promise.resolve()).finally(() => {
      state.value = 'covered'
      covering = null
    })
    return covering
  }

  async function reveal() {
    if (covering) await covering
    if (state.value !== 'covered') return
    state.value = 'revealing'
    try {
      await driver?.reveal()
    } finally {
      state.value = 'idle'
    }
  }

  return { state, label, isSettled, register, cover, reveal }
})
