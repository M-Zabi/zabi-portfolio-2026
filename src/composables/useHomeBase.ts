import { computed, onBeforeUnmount, shallowRef } from 'vue'

import { site } from '@/config/site'
import type { HomeBase } from '@/types/vault'

const fallback: HomeBase = {
  city: site.home.city,
  region: site.home.region,
  country: site.home.country,
  location: site.location,
  latitude: site.home.latitude,
  longitude: site.home.longitude,
}

/** App-wide so the footer and the weather report follow a private page's override too. */
const override = shallowRef<HomeBase | null>(null)

/** Where the site is based right now — normally `site.home`. */
export function useHomeBase() {
  return computed(() => override.value ?? fallback)
}

/** Swaps the home base while the calling component is mounted. */
export function useHomeBaseOverride(base: HomeBase) {
  override.value = base
  onBeforeUnmount(() => {
    if (override.value === base) override.value = null
  })
}
