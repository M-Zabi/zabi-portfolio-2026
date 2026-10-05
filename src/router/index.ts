import { createRouter, createWebHistory } from 'vue-router'

import { installTransitionGuards } from './guards'
import { routes } from './routes'

declare module 'vue-router' {
  interface RouteMeta {
    /** Shown on the route curtain and used as the document title. */
    title: string
  }
}

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // Same page (filters in the query string, hash links): stay put unless a hash asks to move.
    if (to.path === from.path) return to.hash ? { el: to.hash, top: 96, behavior: 'smooth' } : false
    // Runs while the curtain covers the page, so the jump is never visible.
    return savedPosition ?? (to.hash ? { el: to.hash, top: 96 } : { top: 0 })
  },
})

installTransitionGuards(router)
