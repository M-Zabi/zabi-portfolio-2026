import type { BrandColor } from './content'

export type PostCategory = 'editors' | 'design' | 'local-ai' | 'economics' | 'protocols' | 'mobile'

/** Which generated illustration `PostCover` draws for a post. */
export type PostCoverKind = 'planes' | 'terminal' | 'chip' | 'ledger' | 'protocol' | 'palette' | 'device'

/** Diagrams and charts a post can place in its body (rendered by `PostFigure`). */
export type PostFigureKind =
  | 'agent-loop'
  | 'merkle-index'
  | 'context-budget'
  | 'vram-budget'
  | 'cost-per-task'
  | 'mcp-architecture'
  | 'design-pipeline'
  | 'on-device-stack'

/**
 * Inline copy supports a small, safe markup (see `lib/inline.ts`):
 * `**strong**`, `*emphasis*`, `` `code` ``, `[label](https://…)` and `[^3]` reference markers.
 */
export type InlineCopy = string

export type PostBlock =
  | { type: 'p'; text: InlineCopy }
  | { type: 'lead'; text: InlineCopy }
  | { type: 'h2'; id: string; text: string }
  | { type: 'h3'; text: string }
  | { type: 'list'; ordered?: boolean; items: InlineCopy[] }
  | { type: 'code'; lang: string; code: string; filename?: string; caption?: InlineCopy }
  | { type: 'callout'; tone: 'note' | 'tip' | 'warning'; title: string; text: InlineCopy }
  | { type: 'quote'; text: InlineCopy; cite?: string }
  | {
      type: 'table'
      caption: InlineCopy
      head: string[]
      rows: InlineCopy[][]
      /** Columns that hold numbers — right-aligned, tabular figures. */
      numeric?: number[]
    }
  | { type: 'figure'; figure: PostFigureKind; caption: InlineCopy; alt: string }
  | { type: 'stats'; items: { value: string; label: string }[] }
  | { type: 'divider' }

export interface PostReference {
  /** Matches the `[^n]` markers in the body. */
  id: number
  title: string
  publisher: string
  url: string
}

/** The "Summarize with AI" panel — written ahead of time, streamed in on request. */
export interface PostSummary {
  tldr: string
  points: string[]
}

export interface Post {
  slug: string
  title: string
  /** One-line standfirst under the title. */
  dek: string
  /** Meta description and card copy. */
  excerpt: string
  category: PostCategory
  tags: string[]
  color: BrandColor
  cover: PostCoverKind
  /** ISO dates (YYYY-MM-DD). */
  publishedAt: string
  updatedAt?: string
  featured?: boolean
  summary: PostSummary
  body: PostBlock[]
  references: PostReference[]
}

export interface PostComment {
  id: string
  name: string
  body: string
  /** ISO timestamp. */
  createdAt: string
}
