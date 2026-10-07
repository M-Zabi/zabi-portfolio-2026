import { useEventListener, useRafFn } from '@vueuse/core'
import { computed, type MaybeRefOrGetter, ref, type Ref, toValue } from 'vue'

import { clamp } from '@/lib/utils'

/**
 * How far through an article the reader is (0 → 1), measured from the article's top reaching
 * the header to its bottom reaching the bottom of the viewport. Sampled once per frame while
 * scrolling, so it agrees with Lenis' smoothed position.
 */
export function useReadingProgress(article: Ref<HTMLElement | null | undefined>, minutes: MaybeRefOrGetter<number>) {
  const progress = ref(0)

  function measure() {
    const element = article.value
    if (!element) return
    const rect = element.getBoundingClientRect()
    const start = 96
    const distance = rect.height - window.innerHeight + start
    progress.value = distance <= 0 ? 1 : clamp((start - rect.top) / distance)
  }

  // Cheap and robust: one rect read per frame only while the page is actually moving.
  const { pause, resume } = useRafFn(measure, { immediate: false })
  let idle: ReturnType<typeof setTimeout> | undefined
  useEventListener(
    window,
    'scroll',
    () => {
      resume()
      clearTimeout(idle)
      idle = setTimeout(() => {
        measure()
        pause()
      }, 160)
    },
    { passive: true },
  )
  useEventListener(window, 'resize', measure, { passive: true })

  const minutesLeft = computed(() => Math.max(0, Math.ceil(toValue(minutes) * (1 - progress.value))))

  return { progress, minutesLeft, measure }
}
