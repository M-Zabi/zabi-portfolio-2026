import { afterEach, describe, expect, it, vi } from 'vitest'

import { fetchWeather, parseWeather } from '../weather'

const response = {
  current: { time: '2026-10-05T15:30', temperature_2m: 27.4, weather_code: 2, is_day: 1 },
  daily: { temperature_2m_max: [29.1], temperature_2m_min: [19.6] },
}

const bengaluru = { latitude: 12.9716, longitude: 77.5946 }

describe('parseWeather', () => {
  it('reads current conditions and today’s range', () => {
    expect(parseWeather(response)).toEqual({
      temperature: 27.4,
      high: 29.1,
      low: 19.6,
      code: 2,
      isDay: true,
    })
  })

  it('rejects a response with missing readings', () => {
    expect(() => parseWeather({ current: { temperature_2m: 27 } })).toThrow(
      'Unexpected weather response',
    )
    expect(() => parseWeather(null)).toThrow('Unexpected weather response')
  })
})

describe('fetchWeather', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('asks Open-Meteo for the place, in the site’s time zone', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => Response.json(response))
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchWeather(bengaluru, 'Asia/Kolkata')).resolves.toMatchObject({
      temperature: 27.4,
    })

    const url = new URL(String(fetchMock.mock.calls[0]![0]))
    expect(url.origin).toBe('https://api.open-meteo.com')
    expect(url.searchParams.get('latitude')).toBe('12.9716')
    expect(url.searchParams.get('timezone')).toBe('Asia/Kolkata')
  })

  it('raises a readable error when the API fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async () => new Response(null, { status: 503 })),
    )
    await expect(fetchWeather(bengaluru, 'Asia/Kolkata')).rejects.toThrow(
      'Weather request failed (503)',
    )
  })
})
