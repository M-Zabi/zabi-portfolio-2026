import { useEventListener, useTimeoutFn } from '@vueuse/core'
import { readonly, ref } from 'vue'

export const KONAMI_CODE = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a',
] as const

/**
 * Watches the keyboard for the Konami code (ignored while typing in a field). `progress` counts
 * the keys matched so far, so a hint can light up as it's entered; it holds at full for a
 * moment after `onComplete` fires.
 */
export function useKonamiCode(onComplete: () => void) {
  const progress = ref(0)
  const { start: settle } = useTimeoutFn(() => (progress.value = 0), 1600, { immediate: false })

  useEventListener(window, 'keydown', (event: KeyboardEvent) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return
    if ((event.target as Element | null)?.closest?.('input, textarea, select, [contenteditable]')) return

    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key
    if (key === KONAMI_CODE[progress.value]) progress.value += 1
    // A miss restarts the code — but "↑↑↑" still counts as the first two keys.
    else if (key === 'ArrowUp') progress.value = progress.value === 2 ? 2 : 1
    else progress.value = 0

    if (progress.value === KONAMI_CODE.length) {
      onComplete()
      settle()
    }
  })

  return { progress: readonly(progress) }
}
