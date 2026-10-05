import { describe, expect, it } from 'vitest'

import { createFrameMeter } from '../frame-meter'

function feed(meter: ReturnType<typeof createFrameMeter>, delta: number, count: number) {
  const readings: number[] = []
  for (let index = 0; index < count; index += 1) {
    const reading = meter.push(delta)
    if (reading !== null) readings.push(reading)
  }
  return readings
}

describe('createFrameMeter', () => {
  it('reports the average frame rate once per window', () => {
    // ~700ms of frames: one full 500ms window, the rest still accumulating.
    expect(feed(createFrameMeter({ window: 500 }), 1000 / 144, 100)).toEqual([144])
    expect(feed(createFrameMeter({ window: 500 }), 1000 / 60, 42)).toEqual([60])
  })

  it('stays silent until a window completes', () => {
    const meter = createFrameMeter({ window: 500 })
    expect(feed(meter, 16, 10)).toEqual([])
  })

  it('restarts the window after a stall instead of reporting a dip', () => {
    const meter = createFrameMeter({ window: 500, stall: 250 })
    feed(meter, 10, 40)
    expect(meter.push(2000)).toBeNull()
    expect(feed(meter, 10, 50)).toEqual([100])
  })

  it('ignores empty and invalid deltas', () => {
    const meter = createFrameMeter()
    expect(meter.push(0)).toBeNull()
    expect(meter.push(-5)).toBeNull()
    expect(meter.push(Number.NaN)).toBeNull()
    expect(meter.frameTimes).toEqual([])
  })

  it('keeps only the most recent frame times, oldest first', () => {
    const meter = createFrameMeter({ capacity: 3 })
    for (const delta of [1, 2, 3, 4, 5]) meter.push(delta)
    expect(meter.frameTimes).toEqual([3, 4, 5])
  })
})
