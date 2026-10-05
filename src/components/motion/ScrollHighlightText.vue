<script setup lang="ts">
import { useReducedMotion, useScroll } from 'motion-v'
import { computed, useTemplateRef } from 'vue'

import { plainText, tokenize } from '@/lib/text'

import HighlightWord from './HighlightWord.vue'

/** Words light up one by one as the paragraph scrolls through the viewport. */
const props = withDefaults(defineProps<{ text: string; as?: string; emphasisClass?: string }>(), {
  as: 'p',
  emphasisClass: 'text-primary',
})

const root = useTemplateRef<HTMLElement>('root')
const reducedMotion = useReducedMotion()
const { scrollYProgress } = useScroll({ target: root, offset: ['start 0.85', 'end 0.55'] })

const words = computed(() =>
  tokenize(props.text).flatMap((token) => (token.type === 'word' ? [token] : [])),
)
</script>

<template>
  <component :is="as" ref="root">
    <template v-if="reducedMotion">{{ plainText(text) }}</template>
    <template v-else>
      <template v-for="(word, index) in words" :key="index">
        <HighlightWord
          :progress="scrollYProgress"
          :range="[index / words.length, (index + 1) / words.length]"
          :class="word.emphasis && emphasisClass"
          >{{ word.value }}</HighlightWord
        >{{ ' ' }}
      </template>
    </template>
  </component>
</template>
