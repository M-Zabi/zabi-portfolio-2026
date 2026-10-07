import type { Post, PostBlock, PostCategory } from '@/types/blog'

import { plainInline, referenceIds } from './inline'

export const categoryLabel: Record<PostCategory, string> = {
  editors: 'Editors & IDEs',
  design: 'AI design',
  'local-ai': 'Local AI',
  economics: 'Token economics',
  protocols: 'Protocols',
  mobile: 'On-device AI',
}

/** Average silent reading rate for non-fiction (Brysbaert, 2019). */
const WORDS_PER_MINUTE = 238
/** Code is read line by line, not skimmed. */
const SECONDS_PER_CODE_LINE = 2.4
/** A diagram or chart takes a moment to take in. */
const SECONDS_PER_FIGURE = 12

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length
}

function blockText(block: PostBlock): string {
  switch (block.type) {
    case 'p':
    case 'lead':
    case 'quote':
      return plainInline(block.text)
    case 'h2':
    case 'h3':
      return block.text
    case 'callout':
      return `${block.title} ${plainInline(block.text)}`
    case 'list':
      return block.items.map(plainInline).join(' ')
    case 'table':
      return [plainInline(block.caption), ...block.head, ...block.rows.flat().map(plainInline)].join(' ')
    case 'figure':
      return plainInline(block.caption)
    case 'stats':
      return block.items.map((item) => `${item.value} ${item.label}`).join(' ')
    default:
      return ''
  }
}

export function wordCount(post: Pick<Post, 'body'>): number {
  return post.body.reduce((total, block) => total + countWords(blockText(block)), 0)
}

/** Whole minutes, never less than one. */
export function readingMinutes(post: Pick<Post, 'body'>): number {
  let seconds = (wordCount(post) / WORDS_PER_MINUTE) * 60
  for (const block of post.body) {
    if (block.type === 'code') seconds += block.code.split('\n').length * SECONDS_PER_CODE_LINE
    if (block.type === 'figure') seconds += SECONDS_PER_FIGURE
  }
  return Math.max(1, Math.round(seconds / 60))
}

export interface TocEntry {
  id: string
  text: string
}

export function tableOfContents(post: Pick<Post, 'body'>): TocEntry[] {
  return post.body.flatMap((block) => (block.type === 'h2' ? [{ id: block.id, text: block.text }] : []))
}

/** Every reference marker used anywhere in the body. */
export function citedReferences(post: Pick<Post, 'body'>): number[] {
  const ids = new Set<number>()
  const visit = (text: string) => referenceIds(text).forEach((id) => ids.add(id))
  for (const block of post.body) {
    switch (block.type) {
      case 'p':
      case 'lead':
      case 'quote':
        visit(block.text)
        break
      case 'callout':
        visit(block.text)
        break
      case 'list':
        block.items.forEach(visit)
        break
      case 'table':
        visit(block.caption)
        block.rows.flat().forEach(visit)
        break
      case 'figure':
        visit(block.caption)
        break
      case 'code':
        if (block.caption) visit(block.caption)
        break
    }
  }
  return [...ids].sort((a, b) => a - b)
}

const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })

/** `2026-09-30` → `30 Sept 2026`, read as a calendar date (no time-zone drift). */
export function formatPostDate(iso: string): string {
  return dateFormat.format(new Date(`${iso}T00:00:00Z`))
}

/** Newest first; ties keep their authored order. */
export function sortByDate<T extends Pick<Post, 'publishedAt'>>(posts: readonly T[]): T[] {
  return [...posts].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
}

/** Same category first, then shared tags, then recency. */
export function relatedPosts(post: Post, all: readonly Post[], limit = 2): Post[] {
  const score = (other: Post) =>
    (other.category === post.category ? 10 : 0) + other.tags.filter((tag) => post.tags.includes(tag)).length
  return sortByDate(all.filter((other) => other.slug !== post.slug))
    .map((other, index) => ({ other, score: score(other), index }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map(({ other }) => other)
}

const relativeFormat = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 31_536_000],
  ['month', 2_592_000],
  ['week', 604_800],
  ['day', 86_400],
  ['hour', 3_600],
  ['minute', 60],
]

/** `2 hours ago`, `yesterday`, `just now`. */
export function timeAgo(iso: string, now = Date.now()): string {
  const seconds = Math.round((new Date(iso).getTime() - now) / 1000)
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return relativeFormat.format(Math.round(seconds / size), unit)
  }
  return 'just now'
}
