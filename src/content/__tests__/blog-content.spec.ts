import { describe, expect, it } from 'vitest'

import { citedReferences, tableOfContents } from '@/lib/blog'
import { isSafeHref } from '@/lib/inline'
import type { PostFigureKind } from '@/types/blog'

import { posts } from '../blog'

/** Editorial guard rails: every article must be internally consistent before it ships. */

const FIGURES: PostFigureKind[] = [
  'agent-loop',
  'merkle-index',
  'context-budget',
  'vram-budget',
  'cost-per-task',
  'mcp-architecture',
  'design-pipeline',
  'on-device-stack',
]

describe('blog content', () => {
  it('has at least six articles with unique, URL-safe slugs', () => {
    expect(posts.length).toBeGreaterThanOrEqual(6)
    const slugs = posts.map((post) => post.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  })

  describe.each(posts.map((post) => [post.slug, post] as const))('%s', (_slug, post) => {
    it('cites only references it lists, and lists only references it cites', () => {
      const cited = citedReferences(post)
      const listed = post.references.map((reference) => reference.id).sort((a, b) => a - b)
      expect(cited).toEqual(listed)
    })

    it('numbers references 1…n with https URLs', () => {
      post.references.forEach((reference, index) => {
        expect(reference.id).toBe(index + 1)
        expect(reference.url).toMatch(/^https:\/\//)
        expect(reference.title.length).toBeGreaterThan(3)
      })
    })

    it('has unique, slug-like section ids and enough sections for a contents list', () => {
      const ids = tableOfContents(post).map((entry) => entry.id)
      expect(ids.length).toBeGreaterThanOrEqual(4)
      expect(new Set(ids).size).toBe(ids.length)
      for (const id of ids) expect(id).toMatch(/^[a-z0-9-]+$/)
      expect(ids).not.toContain('references')
    })

    it('uses known figures and only safe links', () => {
      const figures = post.body.flatMap((block) => (block.type === 'figure' ? [block] : []))
      for (const figure of figures) {
        expect(FIGURES).toContain(figure.figure)
        expect(figure.alt.length).toBeGreaterThan(20)
      }

      const texts = post.body.flatMap((block) =>
        block.type === 'p' ||
        block.type === 'lead' ||
        block.type === 'quote' ||
        block.type === 'callout'
          ? [block.text]
          : block.type === 'list'
            ? block.items
            : [],
      )
      const hrefs = texts.flatMap((text) =>
        [...text.matchAll(/\]\(([^)]+)\)/g)].map((match) => match[1]!),
      )
      for (const href of hrefs) expect(isSafeHref(href)).toBe(true)
    })

    it('ships an AI summary and sensible metadata', () => {
      expect(post.summary.tldr.length).toBeGreaterThan(80)
      expect(post.summary.points.length).toBeGreaterThanOrEqual(3)
      expect(post.excerpt.length).toBeLessThanOrEqual(260)
      expect(post.publishedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(post.body[0]?.type).toBe('lead')
    })
  })
})
