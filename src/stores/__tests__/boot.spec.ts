import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useBootStore } from '../boot'

describe('boot store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('reports weighted progress as tasks settle', async () => {
    const boot = useBootStore()
    let finishFonts!: () => void
    boot.track('fonts', new Promise<void>((resolve) => (finishFonts = resolve)), 1)
    boot.track('scene', Promise.resolve(), 3)

    await vi.advanceTimersByTimeAsync(0)
    expect(boot.progress).toBe(0.75)

    finishFonts()
    await vi.advanceTimersByTimeAsync(0)
    expect(boot.progress).toBe(1)
  })

  it('treats a failed task as settled so the site still loads', async () => {
    const boot = useBootStore()
    boot.track('scene', Promise.reject(new Error('no webgl')), 1)
    await vi.advanceTimersByTimeAsync(0)
    expect(boot.progress).toBe(1)
  })

  it('gives up on a task that never settles after its timeout', async () => {
    const boot = useBootStore()
    boot.track('stuck', new Promise(() => undefined), 1, 500)

    await vi.advanceTimersByTimeAsync(499)
    expect(boot.progress).toBe(0)
    await vi.advanceTimersByTimeAsync(1)
    expect(boot.progress).toBe(1)
  })

  it('ignores duplicate ids and late registrations once the reveal has started', async () => {
    const boot = useBootStore()
    boot.track('fonts', Promise.resolve(), 1)
    boot.track('fonts', new Promise(() => undefined), 5)
    await vi.advanceTimersByTimeAsync(0)
    expect(boot.progress).toBe(1)

    boot.beginReveal()
    boot.track('late', new Promise(() => undefined), 10)
    expect(boot.progress).toBe(1)
  })

  it('moves through loading → revealing → ready', () => {
    const boot = useBootStore()
    expect(boot.phase).toBe('loading')
    expect(boot.hasRevealed).toBe(false)

    boot.beginReveal()
    expect(boot.phase).toBe('revealing')
    expect(boot.hasRevealed).toBe(true)
    expect(boot.isReady).toBe(false)

    boot.finish()
    expect(boot.isReady).toBe(true)
  })
})
