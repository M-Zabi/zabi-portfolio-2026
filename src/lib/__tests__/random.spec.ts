import { describe, expect, it } from 'vitest'

import { memes } from '@/content/memes'

import { pickIndex } from '../random'

describe('pickIndex', () => {
  it('covers the whole range when nothing is excluded', () => {
    expect(pickIndex(4, undefined, () => 0)).toBe(0)
    expect(pickIndex(4, undefined, () => 0.999)).toBe(3)
  })

  it('never returns the excluded index, and can still reach every other one', () => {
    const seen = new Set<number>()
    for (let step = 0; step < 6; step++) seen.add(pickIndex(7, 2, () => step / 6))
    expect([...seen].sort()).toEqual([0, 1, 3, 4, 5, 6])
  })

  it('ignores an exclude that is out of range', () => {
    expect(pickIndex(3, 9, () => 0.999)).toBe(2)
  })

  it('returns 0 for lists that cannot shuffle', () => {
    expect(pickIndex(1, 0)).toBe(0)
    expect(pickIndex(0)).toBe(0)
  })
})

describe('memes', () => {
  it('have unique ids, so shuffling always swaps the card', () => {
    const ids = memes.map((meme) => meme.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids.length).toBeGreaterThan(1)
  })
})
