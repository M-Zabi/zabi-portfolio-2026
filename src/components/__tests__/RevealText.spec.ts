import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import RevealText from '../motion/RevealText.vue'

beforeAll(() => {
  // jsdom has no IntersectionObserver; motion's useInView needs one.
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

describe('RevealText', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('gives assistive tech one clean sentence and hides the split spans', () => {
    const wrapper = mount(RevealText, { props: { text: 'Let’s build\nsomething that *moves.*', as: 'h2' } })

    expect(wrapper.element.tagName).toBe('H2')
    expect(wrapper.get('.sr-only').text()).toBe('Let’s build something that moves.')
    expect(wrapper.get('[aria-hidden="true"]').findAll('[data-reveal-item]')).toHaveLength(5)
    expect(wrapper.findAll('br')).toHaveLength(1)
  })

  it('applies the emphasis class only to marked words', () => {
    const wrapper = mount(RevealText, { props: { text: 'feels *alive*', emphasisClass: 'text-primary' } })
    const items = wrapper.findAll('[data-reveal-item]')

    expect(items[0]!.classes()).not.toContain('text-primary')
    expect(items[1]!.classes()).toContain('text-primary')
  })

  it('splits by character when asked', () => {
    const wrapper = mount(RevealText, { props: { text: 'Zabi', by: 'char' } })
    expect(wrapper.findAll('[data-reveal-item]').map((item) => item.text())).toEqual(['Z', 'a', 'b', 'i'])
  })
})
