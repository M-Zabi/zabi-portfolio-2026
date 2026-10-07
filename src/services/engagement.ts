import { type CommentInput, commentSchema } from '@/lib/validators/comment'
import type { PostComment } from '@/types/blog'

/**
 * Hearts and comments.
 *
 * With `VITE_ENGAGEMENT_ENDPOINT` set, they are shared through your API:
 *
 *   GET  {endpoint}/posts/:slug            → { hearts: number, comments: PostComment[] }
 *   POST {endpoint}/posts/:slug/hearts     { delta: 1 | -1 }        → { hearts: number }
 *   POST {endpoint}/posts/:slug/comments   { name, body }           → PostComment
 *
 * Without one, both are kept in this browser only, and the UI says so. Whether *this* visitor
 * has hearted a post is always remembered locally, so a reload never double-counts.
 */

export interface Engagement {
  hearts: number
  hearted: boolean
  comments: PostComment[]
  /** False when hearts and comments live only in this browser. */
  shared: boolean
}

export class EngagementError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message)
    this.name = 'EngagementError'
  }
}

const STORE_PREFIX = 'mz:blog:'

interface LocalRecord {
  hearted: boolean
  comments: PostComment[]
}

function endpoint(): string | undefined {
  const value = import.meta.env.VITE_ENGAGEMENT_ENDPOINT
  return value ? value.replace(/\/+$/, '') : undefined
}

/** Storage can be unavailable (private mode, blocked site data); everything degrades to memory. */
const memory = new Map<string, LocalRecord>()

function readLocal(slug: string): LocalRecord {
  try {
    const raw = localStorage.getItem(STORE_PREFIX + slug)
    if (!raw) return { hearted: false, comments: [] }
    const parsed = JSON.parse(raw) as Partial<LocalRecord>
    return { hearted: Boolean(parsed.hearted), comments: Array.isArray(parsed.comments) ? parsed.comments : [] }
  } catch {
    // Storage blocked or the record is corrupt: use this visit's copy.
    return memory.get(slug) ?? { hearted: false, comments: [] }
  }
}

function writeLocal(slug: string, record: LocalRecord) {
  memory.set(slug, record)
  try {
    localStorage.setItem(STORE_PREFIX + slug, JSON.stringify(record))
  } catch {
    // memory copy is enough for this visit
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${endpoint()}${path}`, {
    ...init,
    headers: { Accept: 'application/json', ...(init?.body ? { 'Content-Type': 'application/json' } : {}) },
  })
  if (!response.ok) {
    throw new EngagementError(
      response.status === 429
        ? 'Easy there — try again in a minute.'
        : response.status >= 500
          ? 'The comments service is having a moment. Please try again shortly.'
          : 'That didn’t go through. Please try again.',
      response.status,
    )
  }
  return (await response.json()) as T
}

function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export async function fetchEngagement(slug: string): Promise<Engagement> {
  const local = readLocal(slug)
  if (!endpoint()) {
    return { hearts: local.hearted ? 1 : 0, hearted: local.hearted, comments: local.comments, shared: false }
  }
  const remote = await request<{ hearts: number; comments: PostComment[] }>(`/posts/${encodeURIComponent(slug)}`)
  return { hearts: remote.hearts, hearted: local.hearted, comments: remote.comments, shared: true }
}

/** Sets this visitor's heart. Returns the new total. */
export async function setHeart(slug: string, hearted: boolean): Promise<number> {
  const local = readLocal(slug)
  if (local.hearted === hearted) return (await fetchEngagement(slug)).hearts

  if (!endpoint()) {
    writeLocal(slug, { ...local, hearted })
    return hearted ? 1 : 0
  }

  const { hearts } = await request<{ hearts: number }>(`/posts/${encodeURIComponent(slug)}/hearts`, {
    method: 'POST',
    body: JSON.stringify({ delta: hearted ? 1 : -1 }),
  })
  writeLocal(slug, { ...local, hearted })
  return hearts
}

export async function addComment(slug: string, input: CommentInput): Promise<PostComment> {
  const payload = commentSchema.parse(input)

  // Honeypot tripped: look successful, store nothing.
  if (payload.website) {
    return { id: newId(), name: payload.name, body: payload.body, createdAt: new Date().toISOString() }
  }

  if (!endpoint()) {
    const comment: PostComment = { id: newId(), name: payload.name, body: payload.body, createdAt: new Date().toISOString() }
    const local = readLocal(slug)
    writeLocal(slug, { ...local, comments: [...local.comments, comment] })
    return comment
  }

  return request<PostComment>(`/posts/${encodeURIComponent(slug)}/comments`, {
    method: 'POST',
    body: JSON.stringify({ name: payload.name, body: payload.body }),
  })
}
