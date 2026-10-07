<script setup lang="ts">
import { HashIcon } from '@lucide/vue'
import { computed, provide, toRef } from 'vue'

import FadeIn from '@/components/motion/FadeIn.vue'
import type { PostBlock, PostReference } from '@/types/blog'

import CodeBlock from './CodeBlock.vue'
import InlineText from './InlineText.vue'
import PostCallout from './PostCallout.vue'
import PostFigure from './PostFigure.vue'
import PostTable from './PostTable.vue'
import { referencesKey } from './references'

const props = defineProps<{ blocks: PostBlock[]; references: PostReference[] }>()

provide(referencesKey, toRef(props, 'references'))

/** Figures are numbered in reading order. */
const figureNumbers = computed(() => {
  const numbers = new Map<number, number>()
  let count = 0
  props.blocks.forEach((block, index) => {
    if (block.type === 'figure') numbers.set(index, ++count)
  })
  return numbers
})
</script>

<template>
  <div class="post-body">
    <template v-for="(block, index) in blocks" :key="index">
      <p v-if="block.type === 'lead'" class="post-lead"><InlineText :text="block.text" /></p>

      <p v-else-if="block.type === 'p'" class="post-p"><InlineText :text="block.text" /></p>

      <h2 v-else-if="block.type === 'h2'" :id="block.id" class="post-h2 group/heading">
        <a :href="`#${block.id}`" class="post-anchor" :aria-label="`Link to ${block.text}`">
          <HashIcon class="size-5" aria-hidden="true" />
        </a>
        {{ block.text }}
      </h2>

      <h3 v-else-if="block.type === 'h3'" class="post-h3">{{ block.text }}</h3>

      <component :is="block.ordered ? 'ol' : 'ul'" v-else-if="block.type === 'list'" class="post-list" :class="block.ordered ? 'is-ordered' : 'is-bulleted'">
        <li v-for="(item, itemIndex) in block.items" :key="itemIndex"><InlineText :text="item" /></li>
      </component>

      <FadeIn v-else-if="block.type === 'code'" :y="16" class="post-wide">
        <CodeBlock :code="block.code" :lang="block.lang" :filename="block.filename" :caption="block.caption" />
      </FadeIn>

      <FadeIn v-else-if="block.type === 'callout'" :y="16" class="post-block">
        <PostCallout :tone="block.tone" :title="block.title" :text="block.text" />
      </FadeIn>

      <blockquote v-else-if="block.type === 'quote'" class="post-quote">
        <p><InlineText :text="block.text" /></p>
        <footer v-if="block.cite" class="text-label mt-4 text-muted-foreground">— {{ block.cite }}</footer>
      </blockquote>

      <FadeIn v-else-if="block.type === 'table'" :y="16" class="post-wide">
        <PostTable :caption="block.caption" :head="block.head" :rows="block.rows" :numeric="block.numeric" />
      </FadeIn>

      <FadeIn v-else-if="block.type === 'figure'" :y="20" class="post-wide">
        <PostFigure :figure="block.figure" :index="figureNumbers.get(index) ?? 1" :caption="block.caption" :alt="block.alt" />
      </FadeIn>

      <FadeIn v-else-if="block.type === 'stats'" :y="16" class="post-wide">
        <dl class="grid gap-px overflow-hidden rounded-3xl border border-border bg-border sm:grid-cols-3">
          <div v-for="item in block.items" :key="item.label" class="flex flex-col justify-between gap-6 bg-card p-6">
            <dt class="order-2 text-sm leading-snug text-muted-foreground">{{ item.label }}</dt>
            <dd class="order-1 font-display text-[clamp(1.6rem,1.2rem+1.2vw,2.25rem)] leading-none font-semibold tracking-tight">{{ item.value }}</dd>
          </div>
        </dl>
      </FadeIn>

      <hr v-else-if="block.type === 'divider'" class="post-divider" />
    </template>
  </div>
</template>

<style scoped>
.post-body {
  --measure: 42rem;
  font-size: clamp(1.0625rem, 1rem + 0.25vw, 1.15rem);
  line-height: 1.75;
}

.post-body > * {
  max-width: var(--measure);
}

.post-body > .post-wide {
  max-width: 50rem;
  margin-block: 2.75rem;
}

.post-body > .post-block {
  margin-block: 2.25rem;
}

.post-lead {
  font-size: clamp(1.25rem, 1.05rem + 0.8vw, 1.6rem);
  line-height: 1.5;
  letter-spacing: -0.012em;
  color: var(--foreground);
  margin-bottom: 2rem;
}

.post-p {
  color: color-mix(in oklch, var(--foreground) 86%, var(--background));
  margin-block: 0 1.4em;
}

.post-h2 {
  position: relative;
  font-family: var(--font-display);
  font-weight: 600;
  font-stretch: 104%;
  font-size: clamp(1.6rem, 1.2rem + 1.3vw, 2.25rem);
  line-height: 1.1;
  letter-spacing: -0.025em;
  margin-block: 3.75rem 1.25rem;
  scroll-margin-top: 7rem;
}

.post-anchor {
  position: absolute;
  left: -2.25rem;
  top: 50%;
  translate: 0 -50%;
  display: grid;
  place-items: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 999px;
  color: var(--muted-foreground);
  opacity: 0;
  transition: opacity 0.2s;
}

.post-h2:hover .post-anchor,
.post-anchor:focus-visible {
  opacity: 1;
}

@media (max-width: 1023px) {
  .post-anchor {
    display: none;
  }
}

.post-h3 {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 1.3rem;
  letter-spacing: -0.015em;
  margin-block: 2.5rem 0.75rem;
}

.post-list {
  margin-block: 0 1.6em;
  padding-left: 0;
  list-style: none;
  color: color-mix(in oklch, var(--foreground) 86%, var(--background));
}

.post-list > li {
  position: relative;
  padding-left: 2rem;
  margin-block: 0.6em;
}

.post-list.is-bulleted > li::before {
  content: '';
  position: absolute;
  left: 0.55rem;
  top: 0.72em;
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 2px;
  background: var(--primary);
  rotate: 45deg;
}

.post-list.is-ordered {
  counter-reset: item;
}

.post-list.is-ordered > li {
  counter-increment: item;
}

.post-list.is-ordered > li::before {
  content: counter(item, decimal-leading-zero);
  position: absolute;
  left: 0;
  top: 0.38em;
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  font-stretch: 90%;
  letter-spacing: 0.04em;
  color: var(--muted-foreground);
  font-variant-numeric: tabular-nums;
}

.post-quote {
  margin-block: 2.5rem;
  padding-left: 1.5rem;
  border-left: 3px solid var(--primary);
  font-family: var(--font-display);
  font-size: clamp(1.35rem, 1.1rem + 0.9vw, 1.75rem);
  line-height: 1.35;
  letter-spacing: -0.015em;
}

.post-divider {
  margin-block: 3rem;
  border: 0;
  height: 1px;
  background: var(--border);
}

.post-body :deep(.inline-code) {
  font-family: var(--font-mono);
  font-size: 0.82em;
  font-stretch: 92%;
  padding: 0.12em 0.4em;
  border-radius: 0.4em;
  background: var(--muted);
  border: 1px solid var(--border);
  white-space: break-spaces;
  overflow-wrap: anywhere;
}

.post-body :deep(.article-link) {
  color: var(--foreground);
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 0.2em;
  text-decoration-color: color-mix(in oklch, var(--primary) 60%, transparent);
  transition: text-decoration-color 0.2s;
}

.post-body :deep(.article-link:hover) {
  text-decoration-color: var(--primary);
}
</style>
