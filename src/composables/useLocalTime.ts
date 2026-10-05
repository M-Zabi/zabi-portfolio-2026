import { createSharedComposable, useIntervalFn } from '@vueuse/core'
import { computed, ref } from 'vue'

import { site } from '@/config/site'

/** Live wall-clock time in the site's time zone, shared by every readout on the page. */
export const useLocalTime = createSharedComposable(() => {
  const now = ref(new Date())
  useIntervalFn(() => (now.value = new Date()), 1000)

  const timeFormat = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: site.timeZone,
  })

  // en-IN names India Standard Time "IST"; other zones still get a readable short name.
  const zoneFormat = new Intl.DateTimeFormat('en-IN', {
    timeZone: site.timeZone,
    timeZoneName: 'short',
  })

  const time = computed(() => timeFormat.format(now.value))

  const zone = computed(
    () => zoneFormat.formatToParts(now.value).find((part) => part.type === 'timeZoneName')?.value ?? site.timeZone,
  )

  /** Blinks the separator once a second without re-rendering the digits. */
  const tick = computed(() => now.value.getSeconds() % 2 === 0)

  return { time, zone, tick }
})
