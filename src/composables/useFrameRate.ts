import { useDocumentVisibility, useRafFn } from '@vueuse/core'
import { useInView } from 'motion-v'
import { readonly, ref, type Ref, watch } from 'vue'

import { createFrameMeter } from '@/lib/frame-meter'

/**
 * Live frame rate of this page on the visitor's machine, sampled with requestAnimationFrame.
 * It only runs while `target` is on screen and the tab is visible, so an off-screen readout
 * costs nothing. `onFrame` receives the recent frame times (ms, oldest first) every frame —
 * for drawing straight to the DOM without a re-render.
 */
export function useFrameRate(target: Ref<HTMLElement | null>, onFrame?: (frameTimes: readonly number[]) => void) {
  const fps = ref<number | null>(null)
  const meter = createFrameMeter()
  const inView = useInView(target)
  const visibility = useDocumentVisibility()

  const { pause, resume } = useRafFn(
    ({ delta }) => {
      const reading = meter.push(delta)
      if (reading !== null) fps.value = reading
      onFrame?.(meter.frameTimes)
    },
    { immediate: false },
  )

  watch(
    () => inView.value && visibility.value === 'visible',
    (active) => (active ? resume() : pause()),
    { immediate: true },
  )

  return { fps: readonly(fps) }
}
