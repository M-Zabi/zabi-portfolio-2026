import { afterEach, describe, expect, it, vi } from 'vitest'

import { posts } from '@/content/blog'

import { parseSummary, streamSummary, summaryText } from '../summary'

const post = posts[0]!

async function collect(stream: AsyncGenerator<string>) {
  let text = ''
  for await (const chunk of stream) text += chunk
  return text
}

describe('parseSummary', () => {
  it('splits the lead from the key points', () => {
    expect(parseSummary('Lead sentence.\n- One\n- Two')).toEqual({ tldr: 'Lead sentence.', points: ['One', 'Two'] })
  })

  it('copes with a partial stream', () => {
    expect(parseSummary('Lead sen')).toEqual({ tldr: 'Lead sen', points: [] })
    expect(parseSummary('Lead.\n- On')).toEqual({ tldr: 'Lead.', points: ['On'] })
  })

  it('joins wrapped point lines', () => {
    expect(parseSummary('Lead.\n- First half\nsecond half')).toEqual({ tldr: 'Lead.', points: ['First half second half'] })
  })
})

describe('streamSummary', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('streams the written summary when no endpoint is set', async () => {
    vi.stubEnv('VITE_SUMMARY_ENDPOINT', '')
    const text = await collect(streamSummary(post, { pace: 0 }))
    expect(text).toBe(summaryText(post))
    expect(parseSummary(text)).toEqual(post.summary)
  })

  it('stops when aborted', async () => {
    vi.stubEnv('VITE_SUMMARY_ENDPOINT', '')
    const controller = new AbortController()
    controller.abort()
    expect(await collect(streamSummary(post, { pace: 0, signal: controller.signal }))).toBe('')
  })

  it('streams from the endpoint when one is configured', async () => {
    vi.stubEnv('VITE_SUMMARY_ENDPOINT', 'https://ai.example.com/summarize')
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('Live lead.\n'))
        controller.enqueue(new TextEncoder().encode('- Live point'))
        controller.close()
      },
    })
    const fetchMock = vi.fn<typeof fetch>(async () => new Response(body, { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    expect(await collect(streamSummary(post))).toBe('Live lead.\n- Live point')
    const [url, init = {}] = fetchMock.mock.calls[0]!
    expect(url).toBe('https://ai.example.com/summarize')
    expect(JSON.parse(String(init.body))).toEqual({ slug: post.slug, title: post.title })
  })
})
