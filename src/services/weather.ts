/**
 * Current conditions from Open-Meteo — free, keyless and CORS-enabled. Its origin is
 * allowed in the build's Content Security Policy (`connect-src`).
 */
export const WEATHER_ENDPOINT = 'https://api.open-meteo.com/v1/forecast'

export interface Weather {
  /** °C */
  temperature: number
  /** Today's high / low, °C */
  high: number
  low: number
  /** WMO weather code */
  code: number
  isDay: boolean
}

interface Place {
  latitude: number
  longitude: number
}

export async function fetchWeather(
  place: Place,
  timeZone: string,
  signal?: AbortSignal,
): Promise<Weather> {
  const params = new URLSearchParams({
    latitude: String(place.latitude),
    longitude: String(place.longitude),
    current: 'temperature_2m,weather_code,is_day',
    daily: 'temperature_2m_max,temperature_2m_min',
    timezone: timeZone,
    forecast_days: '1',
  })
  const response = await fetch(`${WEATHER_ENDPOINT}?${params}`, { signal })
  if (!response.ok) throw new Error(`Weather request failed (${response.status})`)
  return parseWeather(await response.json())
}

const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

/** Narrows Open-Meteo's response; throws rather than render half a reading. */
export function parseWeather(data: unknown): Weather {
  const { current, daily } = (data ?? {}) as {
    current?: Record<string, unknown>
    daily?: Record<string, unknown[] | undefined>
  }
  const reading = {
    temperature: current?.temperature_2m,
    high: daily?.temperature_2m_max?.[0],
    low: daily?.temperature_2m_min?.[0],
    code: current?.weather_code,
    isDay: current?.is_day,
  }
  if (!Object.values(reading).every(isNumber)) throw new Error('Unexpected weather response')
  const { temperature, high, low, code, isDay } = reading as Record<keyof typeof reading, number>
  return { temperature, high, low, code, isDay: isDay === 1 }
}
