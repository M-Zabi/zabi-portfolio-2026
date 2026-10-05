import { describe, expect, it } from 'vitest'

import { MARK_HEIGHT, MARK_WIDTH, markPieces, markViewBox } from '../mark'

/** Absolute coordinates touched by a path (enough to bound-check these simple strokes). */
function absolutePoints(d: string): [number, number][] {
  const points: [number, number][] = []
  let x = 0
  let y = 0
  for (const [, command, args] of d.matchAll(/([MLHVCSZmlhvcsz])([^MLHVCSZmlhvcsz]*)/g)) {
    const n = (args?.match(/-?\d*\.?\d+/g) ?? []).map(Number)
    const relative = command === command?.toLowerCase()
    switch (command?.toUpperCase()) {
      case 'M':
      case 'L':
        for (let i = 0; i < n.length; i += 2) {
          x = (relative ? x : 0) + n[i]!
          y = (relative ? y : 0) + n[i + 1]!
          points.push([x, y])
        }
        break
      case 'H':
        for (const value of n) points.push([(x = (relative ? x : 0) + value), y])
        break
      case 'V':
        for (const value of n) points.push([x, (y = (relative ? y : 0) + value)])
        break
      case 'C':
      case 'S': {
        const step = command.toUpperCase() === 'C' ? 6 : 4
        for (let i = 0; i < n.length; i += step) {
          x = (relative ? x : 0) + n[i + step - 2]!
          y = (relative ? y : 0) + n[i + step - 1]!
          points.push([x, y])
        }
        break
      }
    }
  }
  return points
}

describe('MZ monogram', () => {
  it('is split into the six strokes of the brand logo', () => {
    expect(markPieces.map((piece) => piece.id)).toEqual([
      'm-foot',
      'm-diagonal',
      'm-stem',
      'z-top',
      'z-diagonal',
      'z-bottom',
    ])
    expect(new Set(markPieces.map((piece) => piece.id)).size).toBe(markPieces.length)
  })

  it('keeps every stroke inside the logo viewBox', () => {
    expect(markViewBox).toBe(`0 0 ${MARK_WIDTH} ${MARK_HEIGHT}`)
    for (const piece of markPieces) {
      for (const [x, y] of absolutePoints(piece.d)) {
        expect(x).toBeGreaterThanOrEqual(-0.01)
        expect(x).toBeLessThanOrEqual(MARK_WIDTH + 0.01)
        expect(y).toBeGreaterThanOrEqual(-0.01)
        expect(y).toBeLessThanOrEqual(MARK_HEIGHT + 0.01)
      }
    }
  })

  it('places the M strokes left of the Z strokes', () => {
    const maxX = (d: string) => Math.max(...absolutePoints(d).map(([x]) => x))
    const minX = (d: string) => Math.min(...absolutePoints(d).map(([x]) => x))
    const m = markPieces.filter((piece) => piece.id.startsWith('m-'))
    const z = markPieces.filter((piece) => piece.id.startsWith('z-'))
    expect(Math.max(...m.map((piece) => maxX(piece.d)))).toBeLessThan(Math.min(...z.map((piece) => minX(piece.d))))
  })

  it('gives every stroke a drift direction for the explode effects', () => {
    for (const piece of markPieces) expect(Math.hypot(...piece.drift)).toBeGreaterThan(0)
  })
})
