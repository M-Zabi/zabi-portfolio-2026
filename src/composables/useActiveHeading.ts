import { onBeforeUnmount, onMounted, ref, type Ref, watch } from 'vue'

/**
 * The id of the section heading the reader is currently in: the last heading that has
 * crossed a line ~30% down the viewport. Drives the table of contents marker.
 */
export function useActiveHeading(ids: Ref<string[]>) {
  const active = ref<string | null>(null)
  const passed = new Set<string>()
  let observer: IntersectionObserver | null = null

  function observe() {
    observer?.disconnect()
    passed.clear()
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id
          // Above the line (scrolled past) or crossing it.
          if (entry.boundingClientRect.top < window.innerHeight * 0.3) passed.add(id)
          else passed.delete(id)
        }
        active.value = [...ids.value].reverse().find((id) => passed.has(id)) ?? null
      },
      { rootMargin: '0px 0px -70% 0px', threshold: [0, 1] },
    )
    for (const id of ids.value) {
      const element = document.getElementById(id)
      if (element) observer.observe(element)
    }
  }

  onMounted(observe)
  watch(ids, observe, { flush: 'post' })
  onBeforeUnmount(() => observer?.disconnect())

  return active
}
