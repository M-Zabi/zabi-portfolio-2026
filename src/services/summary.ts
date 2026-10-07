import { sleep } from '@/lib/utils'
import type { Post } from '@/types/blog'

/**
 * "Summarize with AI".
 *
 * With `VITE_SUMMARY_ENDPOINT` set, the post is summarised live: the endpoint receives
 * `{ slug, title }` and streams plain text back — a paragraph, then one `- ` line per key
 * point. Keep your model key on that server; never in this bundle.
 *
 * Without one, the summary written for the post (`post.summary`) is streamed in the same
 * format, paced like a model, so the experience and the parser are identical.
 */

export function summaryText(post: Pick<Post, 'summary'>): string {
  return [post.summary.tldr, ...post.summary.points.map((point) => `- ${point}`)].join('\n')
}

export interface ParsedSummary {
  tldr: string
  points: string[]
}

/** Parses a (possibly partial) streamed summary. Safe to call on every chunk. */
export function parseSummary(text: string): ParsedSummary {
  const lines = text.split('\n')
  const points: string[] = []
  const lead: string[] = []
  for (const line of lines) {
    if (/^\s*[-•*]\s/.test(line)) points.push(line.replace(/^\s*[-•*]\s+/, ''))
    else if (points.length === 0) lead.push(line)
    else points[points.length - 1] += ` ${line.trim()}`
  }
  return { tldr: lead.join(' ').trim(), points: points.map((point) => point.trim()).filter(Boolean) }
}

/** Splits text into word-ish tokens that keep their trailing whitespace. */
function chunks(text: string): string[] {
  return text.match(/\S+\s*|\s+/g) ?? []
}

async function* simulated(post: Post, signal?: AbortSignal, pace = 1): AsyncGenerator<string> {
  for (const chunk of chunks(summaryText(post))) {
    if (signal?.aborted) return
    yield chunk
    if (pace > 0) {
      // Models emit in bursts: short words fly, punctuation and line ends breathe.
      const base = /[.:;]\s*$/.test(chunk) ? 90 : /\n/.test(chunk) ? 140 : 16 + Math.random() * 26
      await sleep(base * pace)
    }
  }
}

async function* remote(url: string, post: Post, signal?: AbortSignal): AsyncGenerator<string> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'text/plain' },
    body: JSON.stringify({ slug: post.slug, title: post.title }),
    signal,
  })
  if (!response.ok || !response.body) throw new Error(`Summary request failed (${response.status})`)

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    yield decoder.decode(value, { stream: true })
  }
  const tail = decoder.decode()
  if (tail) yield tail
}

/**
 * Streams the summary as text chunks. `pace` scales the simulated typing (0 = instant,
 * used under reduced motion and in tests).
 */
export function streamSummary(post: Post, options: { signal?: AbortSignal; pace?: number } = {}): AsyncGenerator<string> {
  const url = import.meta.env.VITE_SUMMARY_ENDPOINT
  return url ? remote(url, post, options.signal) : simulated(post, options.signal, options.pace ?? 1)
}

/** True when summaries come from a live model rather than the pre-written copy. */
export function isLiveSummary(): boolean {
  return Boolean(import.meta.env.VITE_SUMMARY_ENDPOINT)
}
