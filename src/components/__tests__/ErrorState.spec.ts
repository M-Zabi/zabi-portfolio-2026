import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ErrorState from '../common/ErrorState.vue'

describe('ErrorState', () => {
  it('announces itself and emits retry', async () => {
    const wrapper = mount(ErrorState)

    expect(wrapper.attributes('role')).toBe('alert')
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(1)
  })

  it('keeps the label and disables the button while retrying', () => {
    const wrapper = mount(ErrorState, { props: { retrying: true } })
    const button = wrapper.get('button')

    expect(button.attributes('disabled')).toBeDefined()
    expect(button.text()).toContain('Try again')
    expect(button.find('.animate-spin').exists()).toBe(true)
  })
})
