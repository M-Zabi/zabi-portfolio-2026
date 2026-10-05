import { useQuery } from '@tanstack/vue-query'

import { site } from '@/config/site'
import { fetchWeather } from '@/services/weather'

export function useWeatherQuery() {
  const { latitude, longitude } = site.home
  return useQuery({
    queryKey: ['weather', latitude, longitude] as const,
    queryFn: ({ signal }) => fetchWeather({ latitude, longitude }, site.timeZone, signal),
    // Open-Meteo refreshes current conditions every 15 minutes.
    staleTime: 10 * 60_000,
    refetchInterval: 15 * 60_000,
    retry: 1,
  })
}
