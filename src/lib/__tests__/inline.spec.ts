import { describe, expect, it } from 'vitest'

import { isSafeHref, parseInline, plainInline, referenceIds } from '../inline'

describe('parseInline', () => {
  it('returns plain text untouched', () => {
    expect(parseInline('Just words.')).toEqual([{ type: 'text', value: 'Just words.' }])
  })

  it('parses strong, emphasis, code and reference markers', () => {
    expect(parseInline('A **bold** and *quiet* `npm run` claim[^3].')).toEqual([
      { type: 'text', value: 'A ' },
      { type: 'strong', children: [{ type: 'text', value: 'bold' }] },
      { type: 'text', value: ' and ' },
      { type: 'em', children: [{ type: 'text', value: 'quiet' }] },
      { type: 'text', value: ' ' },
      { type: 'code', value: 'npm run' },
      { type: 'text', value: ' claim' },
      { type: 'ref', id: 3 },
      { type: 'text', value: '.' },
    ])
  })

  it('nests markup inside strong text and links', () => {
    const [strong] = parseInline('**Use `q8_0`**')
    expect(strong).toEqual({
      type: 'strong',
      children: [
        { type: 'text', value: 'Use ' },
        { type: 'code', value: 'q8_0' },
      ],
    })
  })

  it('keeps safe links and drops unsafe ones to their label', () => {
    expect(parseInline('[docs](https://example.com/a)')).toEqual([
      { type: 'link', href: 'https://example.com/a', children: [{ type: 'text', value: 'docs' }] },
    ])
    expect(parseInline('[click](javascript:void0)')).toEqual([{ type: 'text', value: 'click' }])
  })

  it('does not treat asterisks inside code as emphasis', () => {
    expect(parseInline('`a * b * c`')).toEqual([{ type: 'code', value: 'a * b * c' }])
  })
})

describe('isSafeHref', () => {
  it.each([
    ['https://a.dev', true],
    ['mailto:hi@a.dev', true],
    ['/blog', true],
    ['#ref-1', true],
    ['//evil.example', false],
    ['javascript:alert(1)', false],
    ['data:text/html,hi', false],
  ])('%s → %s', (href, safe) => expect(isSafeHref(href)).toBe(safe))
})

describe('plainInline / referenceIds', () => {
  it('strips markup and reference markers', () => {
    expect(plainInline('**Cache** the `prefix`[^2] — [why](https://a.dev).')).toBe('Cache the prefix — why.')
  })

  it('lists reference ids in order', () => {
    expect(referenceIds('One[^1], two[^4][^2].')).toEqual([1, 4, 2])
  })
})
