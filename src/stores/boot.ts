import { defineStore } from 'pinia'
import { computed, reactive, ref } from 'vue'

/**
 * - `loading`   the preloader is counting
 * - `revealing` curtains are lifting; hero copy may start animating
 * - `ready`     the preloader has unmounted
 */
export type BootPhase = 'loading' | 'revealing' | 'ready'

interface BootTask {
  weight: number
  done: boolean
}

/** No single asset may hold the site hostage. */
export const BOOT_TASK_TIMEOUT_MS = 6000

/**
 * Tracks the real work the first paint depends on (fonts, the initial route, the WebGL
 * scene). The preloader turns `progress` into a smooth 0 → 100 count.
 */
export const useBootStore = defineStore('boot', () => {
  const phase = ref<BootPhase>('loading')
  const tasks = reactive(new Map<string, BootTask>())

  const progress = computed(() => {
    let total = 0
    let done = 0
    for (const task of tasks.values()) {
      total += task.weight
      if (task.done) done += task.weight
    }
    return total === 0 ? 0 : done / total
  })

  const hasRevealed = computed(() => phase.value !== 'loading')
  const isReady = computed(() => phase.value === 'ready')

  /**
   * Registers work the preloader should wait for. Settles on success, failure or timeout —
   * a failed asset degrades gracefully instead of blocking the site.
   */
  function track(id: string, work: Promise<unknown>, weight = 1, timeoutMs = BOOT_TASK_TIMEOUT_MS) {
    if (phase.value !== 'loading' || tasks.has(id)) return

    tasks.set(id, { weight, done: false })
    let timer: ReturnType<typeof setTimeout> | undefined
    const timeout = new Promise<void>((resolve) => {
      timer = setTimeout(resolve, timeoutMs)
    })

    void Promise.race([work, timeout])
      .catch(() => undefined)
      .finally(() => {
        clearTimeout(timer)
        const task = tasks.get(id)
        if (task) task.done = true
      })
  }

  function beginReveal() {
    if (phase.value === 'loading') phase.value = 'revealing'
  }

  function finish() {
    phase.value = 'ready'
  }

  return { phase, progress, hasRevealed, isReady, track, beginReveal, finish }
})
