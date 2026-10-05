import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { type CurtainDriver, useTransitionStore } from '../transition'

type Step = CurtainDriver['cover']

const createDriver = (cover: Step = async () => undefined) => ({
  cover: vi.fn<Step>(cover),
  reveal: vi.fn<Step>(async () => undefined),
})

function deferred() {
  let resolve!: () => void
  const promise = new Promise<void>((done) => (resolve = done))
  return { promise, resolve }
}

describe('route transition store', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('covers, then reveals through the registered driver', async () => {
    const transition = useTransitionStore()
    const driver = createDriver()
    transition.register(driver)

    await transition.cover('Work')
    expect(transition.state).toBe('covered')
    expect(transition.label).toBe('Work')
    expect(transition.isSettled).toBe(false)

    await transition.reveal()
    expect(transition.state).toBe('idle')
    expect(transition.isSettled).toBe(true)
    expect(driver.cover).toHaveBeenCalledOnce()
    expect(driver.reveal).toHaveBeenCalledOnce()
  })

  it('reuses an in-flight cover when a second navigation starts', async () => {
    const transition = useTransitionStore()
    const gate = deferred()
    const driver = createDriver(() => gate.promise)
    transition.register(driver)

    const first = transition.cover('Work')
    const second = transition.cover('About')
    gate.resolve()
    await Promise.all([first, second])

    expect(driver.cover).toHaveBeenCalledOnce()
    expect(transition.label).toBe('About')
  })

  it('does not reveal when nothing is covering the page', async () => {
    const transition = useTransitionStore()
    const driver = createDriver()
    transition.register(driver)

    await transition.reveal()
    expect(driver.reveal).not.toHaveBeenCalled()
  })

  it('still completes without a mounted curtain', async () => {
    const transition = useTransitionStore()
    await transition.cover('Contact')
    await transition.reveal()
    expect(transition.state).toBe('idle')
  })

  it('stops using a driver after it unregisters', async () => {
    const transition = useTransitionStore()
    const driver = createDriver()
    const unregister = transition.register(driver)
    unregister()

    await transition.cover('Work')
    expect(driver.cover).not.toHaveBeenCalled()
  })
})
