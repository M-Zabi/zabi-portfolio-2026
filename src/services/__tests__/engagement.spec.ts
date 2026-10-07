import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { addComment, EngagementError, fetchEngagement, setHeart } from '../engagement'

describe('engagement (browser-only mode)', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_ENGAGEMENT_ENDPOINT', '')
    localStorage.clear()
  })
  afterEach(() => vi.unstubAllEnvs())

  it('starts empty and says it is not shared', async () => {
    expect(await fetchEngagement('post-a')).toEqual({ hearts: 0, hearted: false, comments: [], shared: false })
  })

  it('remembers this visitor’s heart', async () => {
    expect(await setHeart('post-a', true)).toBe(1)
    expect(await fetchEngagement('post-a')).toMatchObject({ hearts: 1, hearted: true })
    expect(await setHeart('post-a', false)).toBe(0)
  })

  it('stores validated comments per post', async () => {
    const comment = await addComment('post-a', { name: '  Ada ', body: 'Great breakdown of the KV cache.' })
    expect(comment).toMatchObject({ name: 'Ada', body: 'Great breakdown of the KV cache.' })
    expect((await fetchEngagement('post-a')).comments).toHaveLength(1)
    expect((await fetchEngagement('post-b')).comments).toHaveLength(0)
  })

  it('rejects invalid comments', async () => {
    await expect(addComment('post-a', { name: 'A', body: '' })).rejects.toThrow(/name/)
  })

  it('pretends to accept honeypot comments but stores nothing', async () => {
    await addComment('post-a', { name: 'Bot', body: 'Buy now', website: 'https://spam.example' })
    expect((await fetchEngagement('post-a')).comments).toHaveLength(0)
  })
})

describe('engagement (shared mode)', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_ENGAGEMENT_ENDPOINT', 'https://api.example.com/blog/')
    localStorage.clear()
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('reads totals from the API and the visitor’s own heart from the browser', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => Response.json({ hearts: 41, comments: [] }))
    vi.stubGlobal('fetch', fetchMock)
    expect(await fetchEngagement('post-a')).toEqual({ hearts: 41, hearted: false, comments: [], shared: true })
    expect(fetchMock.mock.calls[0]![0]).toBe('https://api.example.com/blog/posts/post-a')
  })

  it('posts heart deltas', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => Response.json({ hearts: 42 }))
    vi.stubGlobal('fetch', fetchMock)
    expect(await setHeart('post-a', true)).toBe(42)
    const [url, init = {}] = fetchMock.mock.calls[0]!
    expect(url).toBe('https://api.example.com/blog/posts/post-a/hearts')
    expect(JSON.parse(String(init.body))).toEqual({ delta: 1 })
  })

  it('turns HTTP failures into readable errors', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 429 })))
    const error = await addComment('post-a', { name: 'Ada', body: 'Hello there' }).catch((reason: unknown) => reason)
    expect(error).toBeInstanceOf(EngagementError)
    expect((error as EngagementError).status).toBe(429)
  })
})
