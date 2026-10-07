import { describe, expect, it } from 'vitest'

import type { Post } from '@/types/blog'

import { formatPostDate, readingMinutes, relatedPosts, sortByDate, tableOfContents, timeAgo, wordCount } from '../blog'

const words = (count: number) => Array.from({ length: count }, () => 'word').join(' ')

function post(overrides: Partial<Post>): Post {
  return {
    slug: 'a',
    title: 'A',
    dek: '',
    excerpt: '',
    category: 'editors',
    tags: [],
    color: 'ember',
    cover: 'terminal',
    publishedAt: '2026-01-01',
    summary: { tldr: '', points: [] },
    body: [],
    references: [],
    ...overrides,
  }
}

describe('reading time', () => {
  it('counts words across every kind of text block, ignoring markup', () => {
    const body: Post['body'] = [
      { type: 'p', text: '**Two** words[^1]' },
      { type: 'h2', id: 'x', text: 'Three word heading' },
      { type: 'list', items: ['one', '`two` three'] },
    ]
    expect(wordCount({ body })).toBe(2 + 3 + 3)
  })

  it('never reports less than a minute', () => {
    expect(readingMinutes({ body: [{ type: 'p', text: 'Short.' }] })).toBe(1)
  })

  it('reads at ~238 wpm and adds time for code and figures', () => {
    expect(readingMinutes({ body: [{ type: 'p', text: words(238 * 5) }] })).toBe(5)
    const withExtras = readingMinutes({
      body: [
        { type: 'p', text: words(238 * 5) },
        { type: 'code', lang: 'ts', code: Array.from({ length: 50 }, () => 'x').join('\n') },
      ],
    })
    expect(withExtras).toBe(7)
  })
})

describe('tableOfContents', () => {
  it('lists section headings in order', () => {
    const body: Post['body'] = [
      { type: 'h2', id: 'one', text: 'One' },
      { type: 'h3', text: 'Sub' },
      { type: 'h2', id: 'two', text: 'Two' },
    ]
    expect(tableOfContents({ body })).toEqual([
      { id: 'one', text: 'One' },
      { id: 'two', text: 'Two' },
    ])
  })
})

describe('ordering and related posts', () => {
  const a = post({ slug: 'a', publishedAt: '2026-01-01', category: 'editors', tags: ['MCP'] })
  const b = post({ slug: 'b', publishedAt: '2026-03-01', category: 'design', tags: ['MCP'] })
  const c = post({ slug: 'c', publishedAt: '2026-02-01', category: 'editors' })
  const d = post({ slug: 'd', publishedAt: '2026-04-01', category: 'mobile' })

  it('sorts newest first', () => {
    expect(sortByDate([a, b, c]).map((item) => item.slug)).toEqual(['b', 'c', 'a'])
  })

  it('prefers the same category, then shared tags, then recency', () => {
    expect(relatedPosts(a, [a, b, c, d], 3).map((item) => item.slug)).toEqual(['c', 'b', 'd'])
  })
})

describe('dates', () => {
  it('formats calendar dates without time-zone drift', () => {
    expect(formatPostDate('2026-10-02')).toMatch(/2 Oct\S* 2026/)
  })

  it('describes recent times relative to now', () => {
    const now = Date.parse('2026-10-07T12:00:00Z')
    expect(timeAgo('2026-10-07T11:59:30Z', now)).toBe('just now')
    expect(timeAgo('2026-10-07T10:00:00Z', now)).toBe('2 hours ago')
    expect(timeAgo('2026-10-06T12:00:00Z', now)).toBe('yesterday')
  })
})
