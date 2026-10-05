import { describe, expect, it } from 'vitest'

import { describeWeather } from '../weather'

describe('describeWeather', () => {
  it.each([
    [0, 'Clear', 'clear'],
    [2, 'Partly cloudy', 'partly'],
    [3, 'Overcast', 'cloudy'],
    [45, 'Foggy', 'fog'],
    [53, 'Drizzle', 'drizzle'],
    [61, 'Rain', 'rain'],
    [65, 'Heavy rain', 'rain'],
    [81, 'Showers', 'showers'],
    [95, 'Thunderstorms', 'storm'],
  ])('maps WMO code %i to "%s"', (code, label, sky) => {
    expect(describeWeather(code)).toEqual({ label, sky })
  })

  it('falls back for codes it does not know', () => {
    expect(describeWeather(42)).toEqual({ label: 'Unsettled', sky: 'cloudy' })
  })
})
