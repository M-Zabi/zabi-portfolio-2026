import { describe, expect, it } from 'vitest'

import { techColor, techIcons } from '../tech-icons'

describe('techColor', () => {
  it('keeps a brand colour that reads on both themes', () => {
    expect(techColor(techIcons['Vue 3'])).toBe('#4FC08D')
  })

  it('falls back to the text colour for near-black marks', () => {
    expect(techColor(techIcons['Next.js'])).toBe('currentColor')
    expect(techColor({ hex: '1C2024' })).toBe('currentColor')
  })
})

describe('techIcons', () => {
  it('has a drawable path for every tool', () => {
    for (const icon of Object.values(techIcons)) expect(icon.path).toMatch(/^M/)
  })
})
