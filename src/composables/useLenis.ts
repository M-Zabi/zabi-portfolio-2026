import Lenis from 'lenis'
import { cancelFrame, frame } from 'motion-v'
import { readonly, shallowRef } from 'vue'

const instance = shallowRef<Lenis | null>(null)

/**
 * Creates the single Lenis instance and drives it from motion's frame loop, so smooth
 * scrolling and every scroll-linked animation are sampled on the same frame.
 *
 * Lenis honours `prefers-reduced-motion` by default (scroll tracks input 1:1).
 */
export function createSmoothScroll(): () => void {
  if (instance.value) return () => undefined

  const lenis = new Lenis({
    lerp: 0.085,
    smoothWheel: true,
    anchors: { offset: -96 },
    stopInertiaOnNavigate: true,
  })

  const tick = ({ timestamp }: { timestamp: number }) => lenis.raf(timestamp)
  frame.update(tick, true)
  instance.value = lenis

  return () => {
    cancelFrame(tick)
    lenis.destroy()
    instance.value = null
  }
}

export function useLenis() {
  return readonly(instance)
}

/** Imperative access for non-component code (router guards). */
export function getLenis(): Lenis | null {
  return instance.value
}

export function scrollToTop(immediate = false) {
  const lenis = instance.value
  if (lenis) lenis.scrollTo(0, { immediate, force: true })
  else window.scrollTo({ top: 0, behavior: immediate ? 'auto' : 'smooth' })
}
