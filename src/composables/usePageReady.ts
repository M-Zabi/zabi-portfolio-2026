import { computed } from 'vue'

import { useBootStore } from '@/stores/boot'
import { useTransitionStore } from '@/stores/transition'

/**
 * True when page content is visible: the preloader has started lifting and no route
 * curtain is covering the screen. Entrance animations wait for this, so they are
 * never spent behind an overlay.
 */
export function usePageReady() {
  const boot = useBootStore()
  const transition = useTransitionStore()
  return computed(() => boot.hasRevealed && transition.isSettled)
}
