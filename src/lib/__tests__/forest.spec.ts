import { describe, expect, it } from 'vitest'

import { canopyRidge, canopyTree, fern, grass, groundBand, leaf, mulberry32, palm, scatter, vines } from '../forest'

/** Every number in a path — used to catch NaN / Infinity leaking into geometry. */
const numbers = (d: string) => (d.match(/-?\d*\.?\d+(e-?\d+)?|NaN|Infinity/g) ?? []).map(Number)

describe('forest generators', () => {
  it('are deterministic for a given seed', () => {
    const a = canopyRidge({ width: 1600, floor: 420, base: 250, amplitude: 40, step: 80, seed: 7 })
    const b = canopyRidge({ width: 1600, floor: 420, base: 250, amplitude: 40, step: 80, seed: 7 })
    const c = canopyRidge({ width: 1600, floor: 420, base: 250, amplitude: 40, step: 80, seed: 8 })
    expect(a).toBe(b)
    expect(a).not.toBe(c)
  })

  it('produce finite, closed paths', () => {
    const paths = [
      canopyRidge({ width: 1600, floor: 420, base: 250, amplitude: 40, step: 80, seed: 1 }),
      canopyTree({ x: 800, ground: 314, height: 140, spread: 180, seed: 2 }),
      palm({ x: 120, ground: 318, height: 136, lean: 26, seed: 3 }),
      fern({ x: 150, ground: 344, size: 76, seed: 4 }),
      groundBand({ width: 1600, y: 340, floor: 420, seed: 5 }),
      leaf({ x: 0, y: 0 }, -90, 50),
      ...grass({ width: 1600, ground: 349, seed: 6, spacing: 7, minHeight: 6, maxHeight: 22 }),
    ]
    for (const d of paths) {
      expect(d.startsWith('M')).toBe(true)
      expect(d.trimEnd().endsWith('Z')).toBe(true)
      expect(numbers(d).every(Number.isFinite)).toBe(true)
    }
  })

  it('keeps canopy tops inside the band the footer guarantees is visible', () => {
    const ridge = canopyRidge({ width: 1600, floor: 420, base: 252, amplitude: 38, step: 80, seed: 11 })
    const ys = [...ridge.matchAll(/A[\d.]+ [\d.]+ 0 0 1 [\d.]+ ([\d.]+)/g)].map((match) => Number(match[1]))
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(252 - 38)
  })

  it('spreads the ridge across the full width', () => {
    const ridge = canopyRidge({ width: 1600, floor: 420, base: 250, amplitude: 40, step: 80, seed: 1 })
    expect(ridge).toContain('L1600 420Z')
  })

  it('splits grass into independently swaying groups', () => {
    const groups = grass({ width: 400, ground: 300, seed: 9, spacing: 8, minHeight: 5, maxHeight: 20, groups: 3 })
    expect(groups).toHaveLength(3)
    for (const group of groups) expect(group.length).toBeGreaterThan(0)
  })

  it('anchors vines where asked and scatters points inside the box', () => {
    const lianas = vines({ anchors: [10, 20], y: 100, seed: 2 })
    expect(lianas.map((vine) => [vine.x, vine.y])).toEqual([
      [10, 100],
      [20, 100],
    ])

    for (const point of scatter({ count: 50, x: [100, 200], y: [10, 20], seed: 4 })) {
      expect(point.x).toBeGreaterThanOrEqual(100)
      expect(point.x).toBeLessThanOrEqual(200)
      expect(point.y).toBeGreaterThanOrEqual(10)
      expect(point.y).toBeLessThanOrEqual(20)
    }
  })

  it('has a PRNG that stays in [0, 1)', () => {
    const rand = mulberry32(42)
    for (let i = 0; i < 1000; i++) {
      const value = rand()
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })
})
