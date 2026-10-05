import { createSharedComposable, usePreferredDark, useStorage } from '@vueuse/core'
import { computed, watch } from 'vue'

import { prefersReducedMotion } from '@/lib/utils'

export type ThemePreference = 'light' | 'dark' | 'system'

/** Must match the inline boot script in index.html. */
export const THEME_STORAGE_KEY = 'zabi-theme'

const THEME_COLOR = { light: '#f7f4ef', dark: '#191512' } as const

function applyTheme(dark: boolean) {
  const root = document.documentElement
  root.classList.toggle('dark', dark)
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', dark ? THEME_COLOR.dark : THEME_COLOR.light)
}

export const useTheme = createSharedComposable(() => {
  const preference = useStorage<ThemePreference>(THEME_STORAGE_KEY, 'system')
  const systemDark = usePreferredDark()

  const isDark = computed(
    () => preference.value === 'dark' || (preference.value === 'system' && systemDark.value),
  )

  watch(isDark, applyTheme, { immediate: true, flush: 'sync' })

  /**
   * Toggles the theme. Where the View Transitions API is available the new theme
   * expands as a circle from the toggle — otherwise it switches instantly.
   */
  async function toggle(origin?: { x: number; y: number }) {
    const next: ThemePreference = isDark.value ? 'light' : 'dark'

    if (!origin || !document.startViewTransition || prefersReducedMotion()) {
      preference.value = next
      return
    }

    const transition = document.startViewTransition(() => {
      preference.value = next
      applyTheme(next === 'dark')
    })
    await transition.ready

    const radius = Math.hypot(
      Math.max(origin.x, window.innerWidth - origin.x),
      Math.max(origin.y, window.innerHeight - origin.y),
    )
    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${origin.x}px ${origin.y}px)`,
          `circle(${radius}px at ${origin.x}px ${origin.y}px)`,
        ],
      },
      {
        duration: 700,
        easing: 'cubic-bezier(0.76, 0, 0.24, 1)',
        pseudoElement: '::view-transition-new(root)',
      },
    )
  }

  return { preference, isDark, toggle }
})
