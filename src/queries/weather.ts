import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'

import { useHomeBase } from '@/composables/useHomeBase'
import { site } from '@/config/site'
import { fetchWeather } from '@/services/weather'

export function useWeatherQuery() {
  const home = useHomeBase()
  return useQuery({
    queryKey: computed(() => ['weather', home.value.latitude, home.value.longitude] as const),
    queryFn: ({ signal }) =>
      fetchWeather({ latitude: home.value.latitude, longitude: home.value.longitude }, site.timeZone, signal),
    // Open-Meteo refreshes current conditions every 15 minutes.
    staleTime: 10 * 60_000,
    refetchInterval: 15 * 60_000,
    retry: 1,
  })
}
