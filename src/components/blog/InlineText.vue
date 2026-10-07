<script setup lang="ts">
import { computed, type FunctionalComponent, h, inject, type VNode } from 'vue'
import { RouterLink } from 'vue-router'

import { type InlineNode, parseInline } from '@/lib/inline'

import { referencesKey } from './references'
import RefMarker from './RefMarker.vue'

/**
 * Renders article copy written in the small inline markup from `lib/inline.ts` as real
 * VNodes. Nothing is ever passed through `v-html`.
 */
const props = defineProps<{ text: string }>()

const references = inject(referencesKey, null)

function render(nodes: InlineNode[]): (VNode | string)[] {
  return nodes.map((node) => {
    switch (node.type) {
      case 'text':
        return node.value
      case 'code':
        return h('code', { class: 'inline-code' }, node.value)
      case 'strong':
        return h('strong', { class: 'font-semibold text-foreground' }, render(node.children))
      case 'em':
        return h('em', render(node.children))
      case 'ref':
        return h(RefMarker, { id: node.id, reference: references?.value.find((item) => item.id === node.id) })
      case 'link': {
        const children = render(node.children)
        const className = 'article-link'
        if (node.href.startsWith('/')) return h(RouterLink, { to: node.href, class: className }, () => children)
        const external = /^https?:/.test(node.href)
        return h(
          'a',
          { href: node.href, class: className, ...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {}) },
          children,
        )
      }
    }
  })
}

const nodes = computed(() => parseInline(props.text))
const Rendered: FunctionalComponent = () => render(nodes.value)
</script>

<template>
  <Rendered />
</template>
