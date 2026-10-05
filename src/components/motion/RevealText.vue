<script setup lang="ts">
import { animate, stagger as staggerDelay, useInView, useReducedMotion } from 'motion-v'
import { computed, nextTick, useTemplateRef, watch } from 'vue'

import { usePageReady } from '@/composables/usePageReady'
import { ease } from '@/lib/motion'
import { plainText, tokenize } from '@/lib/text'

/**
 * Masked line reveal. Each word (or character) rises out of its own clipping box.
 *
 * Copy supports `\n` for hard breaks and `*emphasis*` for accent words. Screen readers
 * get the plain sentence once; the split spans are hidden from the accessibility tree.
 */
const props = withDefaults(
  defineProps<{
    text: string
    as?: string
    by?: 'word' | 'char'
    /** `view` waits until scrolled into view; `ready` plays as soon as the page is visible. */
    trigger?: 'view' | 'ready'
    delay?: number
    stagger?: number
    duration?: number
    emphasisClass?: string
  }>(),
  {
    as: 'span',
    by: 'word',
    trigger: 'view',
    delay: 0,
    stagger: undefined,
    duration: 1,
    emphasisClass: 'text-primary',
  },
)

const emit = defineEmits<{ revealed: [] }>()

const root = useTemplateRef<HTMLElement>('root')
const tokens = computed(() => tokenize(props.text))
const label = computed(() => plainText(props.text))

const inView = useInView(root, { once: true, margin: '0px 0px -10% 0px' })
const pageReady = usePageReady()
const reducedMotion = useReducedMotion()

const shouldPlay = computed(() => pageReady.value && (props.trigger === 'ready' || inView.value))
let played = false

function play() {
  if (played || !root.value) return
  played = true

  const items = root.value.querySelectorAll<HTMLElement>('[data-reveal-item]')
  if (!items.length) return

  const step = props.stagger ?? (props.by === 'char' ? 0.022 : 0.06)
  const controls = reducedMotion.value
    ? animate(items, { opacity: [0, 1] }, { duration: 0.3, delay: props.delay })
    : animate(
        items,
        { transform: ['translateY(112%) rotate(5deg)', 'translateY(0%) rotate(0deg)'] },
        { duration: props.duration, delay: staggerDelay(step, { startDelay: props.delay }), ease: ease.outQuint },
      )
  void controls.finished.then(() => emit('revealed'))
}

watch(shouldPlay, (value) => value && play(), { flush: 'post', immediate: true })

// New copy re-renders hidden spans, so replay the reveal for them.
watch(
  () => props.text,
  async () => {
    played = false
    await nextTick()
    if (shouldPlay.value) play()
  },
)
</script>

<template>
  <component :is="as" ref="root" class="reveal" :data-reduced="reducedMotion || undefined">
    <span class="sr-only">{{ label }}</span>
    <span aria-hidden="true">
      <template v-for="(token, index) in tokens" :key="index">
        <br v-if="token.type === 'break'" />
        <template v-else-if="token.type === 'space'">{{ ' ' }}</template>
        <span v-else-if="by === 'word'" class="reveal-mask">
          <span data-reveal-item class="reveal-item" :class="token.emphasis && emphasisClass">{{
            token.value
          }}</span>
        </span>
        <span v-else class="inline-block whitespace-nowrap" :class="token.emphasis && emphasisClass">
          <span v-for="(char, charIndex) in Array.from(token.value)" :key="charIndex" class="reveal-mask">
            <span data-reveal-item class="reveal-item">{{ char }}</span>
          </span>
        </span>
      </template>
    </span>
  </component>
</template>

<style scoped>
/* Hidden until motion takes over; motion's inline styles win once the reveal starts. */
.reveal-item {
  display: inline-block;
  transform: translateY(112%) rotate(5deg);
  transform-origin: 0% 100%;
}

.reveal[data-reduced] .reveal-item {
  transform: none;
  opacity: 0;
}
</style>
