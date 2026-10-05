/** The handful of sky types the footer has an icon for. */
export type Sky =
  'clear' | 'partly' | 'cloudy' | 'fog' | 'drizzle' | 'rain' | 'showers' | 'snow' | 'storm'

/**
 * WMO weather interpretation codes (as returned by Open-Meteo) → a short label and a sky
 * type. https://open-meteo.com/en/docs#weather_variable_documentation
 */
export function describeWeather(code: number): { label: string; sky: Sky } {
  if (code === 0) return { label: 'Clear', sky: 'clear' }
  if (code === 1) return { label: 'Mostly clear', sky: 'clear' }
  if (code === 2) return { label: 'Partly cloudy', sky: 'partly' }
  if (code === 3) return { label: 'Overcast', sky: 'cloudy' }
  if (code === 45 || code === 48) return { label: 'Foggy', sky: 'fog' }
  if (code >= 51 && code <= 57) return { label: 'Drizzle', sky: 'drizzle' }
  if (code >= 61 && code <= 67) return { label: code >= 65 ? 'Heavy rain' : 'Rain', sky: 'rain' }
  if ((code >= 71 && code <= 77) || code === 85 || code === 86)
    return { label: 'Snow', sky: 'snow' }
  if (code >= 80 && code <= 82) return { label: 'Showers', sky: 'showers' }
  if (code >= 95 && code <= 99) return { label: 'Thunderstorms', sky: 'storm' }
  return { label: 'Unsettled', sky: 'cloudy' }
}
