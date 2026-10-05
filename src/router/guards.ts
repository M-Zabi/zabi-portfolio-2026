import { nextTick } from 'vue'
import type { RouteLocationNormalized, Router } from 'vue-router'

import { getLenis } from '@/composables/useLenis'
import { isChunkLoadError } from '@/lib/utils'
import { useTransitionStore } from '@/stores/transition'
import { useUiStore } from '@/stores/ui'

function isPageChange(to: RouteLocationNormalized, from: RouteLocationNormalized) {
  // The first navigation is handled by the preloader; hash/query changes stay in place.
  return from.matched.length > 0 && to.path !== from.path
}

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

/**
 * Page transitions as a navigation lifecycle:
 *   beforeEach → curtain covers the screen (lazy chunks load underneath)
 *   scrollBehavior → jumps to the saved/top position while covered
 *   afterEach → Lenis re-measures the new page, then the curtain lifts
 */
export function installTransitionGuards(router: Router) {
  router.beforeEach(async (to, from) => {
    if (!isPageChange(to, from)) return

    useUiStore().closeMenu()
    getLenis()?.stop()
    await useTransitionStore().cover(to.meta.title)
  })

  router.afterEach(async (to, from) => {
    if (!isPageChange(to, from)) return

    await nextTick()
    await nextFrame()
    const lenis = getLenis()
    lenis?.resize()
    lenis?.start()
    await useTransitionStore().reveal()
  })

  router.onError((error, to) => {
    // A stale chunk after a deploy: do a full load of the page the visitor asked for.
    if (isChunkLoadError(error)) window.location.assign(to.fullPath)
  })
}
