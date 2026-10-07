import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'

import { type SealedVault, VaultLockedError } from '@/lib/vault'
import type { VaultPage } from '@/types/vault'

import VaultGate from '../vault/VaultGate.vue'

const page: VaultPage = {
  kind: 'home-remix',
  curtain: 'Behind the door',
  heroLines: ['Line one', 'Line two'],
  words: ['alpha', 'beta'],
  home: { city: 'Town', region: 'Region', country: 'Country', location: 'Town, Country', latitude: 1, longitude: 2 },
}

const openVault = vi.fn<(sealed: SealedVault, password: string) => Promise<VaultPage>>(async (_sealed, password) => {
  if (password !== 'right-password') throw new VaultLockedError()
  return page
})

vi.mock('@/lib/vault', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/vault')>()),
  openVault: (sealed: SealedVault, password: string) => openVault(sealed, password),
}))
vi.mock('@/composables/usePageMeta', () => ({ usePageMeta: () => undefined }))
vi.mock('@/lib/utils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/utils')>()),
  sleep: () => Promise.resolve(),
}))

beforeAll(() => {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return []
      }
    },
  )
})

const sealed: SealedVault = { v: 1, id: 'a'.repeat(64), iterations: 1, salt: '', iv: '', data: '' }

function mountGate(errors: unknown[]) {
  return mount(VaultGate, {
    props: { sealed },
    attachTo: document.body,
    global: {
      config: { errorHandler: (error) => void errors.push(error) },
      stubs: { HomeRemix: defineComponent({ setup: () => () => h('div', { id: 'unlocked' }) }) },
    },
  })
}

async function settle() {
  for (let i = 0; i < 5; i++) {
    await flushPromises()
    await new Promise((resolve) => setTimeout(resolve, 20))
  }
}

describe('VaultGate', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    openVault.mockClear()
  })

  it('opens on the right password without a single runtime error', async () => {
    const errors: unknown[] = []
    const wrapper = mountGate(errors)

    await wrapper.get('input').setValue('right-password')
    await wrapper.get('form').trigger('submit')
    await settle()

    expect(openVault).toHaveBeenCalledWith(sealed, 'right-password')
    expect(errors).toEqual([])
    expect(wrapper.find('#unlocked').exists()).toBe(true)
    expect(wrapper.find('input').exists()).toBe(false)
    wrapper.unmount()
  })

  it('stays locked on a wrong password and says so', async () => {
    const errors: unknown[] = []
    const wrapper = mountGate(errors)

    await wrapper.get('input').setValue('nope')
    await wrapper.get('form').trigger('submit')
    await settle()

    expect(errors).toEqual([])
    expect(wrapper.find('#unlocked').exists()).toBe(false)
    expect(wrapper.get('input').attributes('aria-invalid')).toBe('true')
    expect(wrapper.get('#vault-status').text()).toMatch(/not quite/i)
    wrapper.unmount()
  })

  it('remembers nothing: a fresh load after unlocking starts locked', async () => {
    const first = mountGate([])
    await first.get('input').setValue('right-password')
    await first.get('form').trigger('submit')
    await settle()
    expect(first.find('#unlocked').exists()).toBe(true)
    first.unmount()

    const second = mountGate([])
    expect(second.find('#unlocked').exists()).toBe(false)
    expect(second.find('input[type="password"]').exists()).toBe(true)
    second.unmount()
  })
})
