import { describe, expect, it } from 'vitest'

import { plainText, tokenize } from '../text'

describe('tokenize', () => {
  it('splits words and keeps single spaces between them', () => {
    expect(tokenize('Software that feels')).toEqual([
      { type: 'word', value: 'Software', emphasis: false },
      { type: 'space' },
      { type: 'word', value: 'that', emphasis: false },
      { type: 'space' },
      { type: 'word', value: 'feels', emphasis: false },
    ])
  })

  it('turns newlines into hard breaks', () => {
    const types = tokenize('Got something\nthat moves').map((token) => token.type)
    expect(types).toEqual(['word', 'space', 'word', 'break', 'word', 'space', 'word'])
  })

  it('marks *emphasis* spanning several words and strips the markers', () => {
    const words = tokenize('a *really good* idea').filter((token) => token.type === 'word')
    expect(words).toEqual([
      { type: 'word', value: 'a', emphasis: false },
      { type: 'word', value: 'really', emphasis: true },
      { type: 'word', value: 'good', emphasis: true },
      { type: 'word', value: 'idea', emphasis: false },
    ])
  })

  it('keeps punctuation inside an emphasised word', () => {
    const [, , word] = tokenize('that *move?*')
    expect(word).toEqual({ type: 'word', value: 'move?', emphasis: true })
  })
})

describe('plainText', () => {
  it('removes markup and collapses line breaks for screen readers', () => {
    expect(plainText('Let’s build\nsomething that *moves.*')).toBe('Let’s build something that moves.')
  })
})
