<script setup lang="ts">
import { useInView, useReducedMotion } from 'motion-v'
import { computed, useTemplateRef } from 'vue'

import FigureFrame from './FigureFrame.vue'

defineProps<{ index: number; caption: string; alt: string }>()

interface TreeNode {
  name: string
  depth: number
  hash: string
  next?: string
  note?: string
  /** Order in which the change propagates (leaf = 1). */
  wave?: number
  skipped?: boolean
}

const nodes: TreeNode[] = [
  { name: 'repo/', depth: 0, hash: 'a91f…', next: '3c07…', note: 'root differs → descend', wave: 3 },
  { name: 'src/', depth: 1, hash: '77e2…', next: 'b410…', note: 'differs → descend', wave: 2 },
  { name: 'api/', depth: 2, hash: '0d5e…', next: 'f1c8…', wave: 2 },
  { name: 'orders.ts', depth: 3, hash: '5d1c…', next: 'e9a2…', note: 'edited → re-chunk, re-embed', wave: 1 },
  { name: 'users.ts', depth: 3, hash: '0f3a…', note: 'unchanged' },
  { name: 'ui/', depth: 2, hash: '9b20…', note: 'subtree skipped', skipped: true },
  { name: 'docs/', depth: 1, hash: 'c88b…', note: 'subtree skipped', skipped: true },
  { name: 'package.json', depth: 1, hash: '41aa…', note: 'unchanged' },
]

const root = useTemplateRef<HTMLElement>('root')
const inView = useInView(root, { once: true, margin: '0px 0px -20% 0px' })
const reducedMotion = useReducedMotion()
const lit = computed(() => inView.value || reducedMotion.value)
</script>

<template>
  <FigureFrame :index="index" :caption="caption" :alt="alt">
    <ol ref="root" class="font-mono text-[0.75rem] sm:text-[0.8125rem]">
      <li
        v-for="node in nodes"
        :key="node.name"
        class="relative flex flex-wrap items-center gap-x-3 gap-y-1 py-1.5"
        :style="{ paddingLeft: `${node.depth * 1.5}rem` }"
      >
        <span
          v-if="node.depth > 0"
          class="absolute top-0 bottom-1/2 w-3 rounded-bl-md border-b border-l border-border"
          :style="{ left: `${(node.depth - 1) * 1.5 + 0.55}rem` }"
          aria-hidden="true"
        />
        <span
          class="node relative inline-flex items-center gap-2 rounded-lg border px-2.5 py-1 transition-[background-color,border-color,color] duration-500"
          :class="[
            node.wave && lit ? 'border-ember bg-ember/15 text-foreground' : 'border-border bg-card',
            node.skipped && 'opacity-55',
          ]"
          :style="{ transitionDelay: node.wave && lit && !reducedMotion ? `${node.wave * 0.45}s` : '0s' }"
        >
          <span class="font-semibold">{{ node.name }}</span>
          <span class="text-muted-foreground" :class="node.next && lit && 'line-through decoration-ember/70'">{{ node.hash }}</span>
          <span v-if="node.next" class="text-ember transition-opacity duration-500" :class="lit ? 'opacity-100' : 'opacity-0'" :style="{ transitionDelay: lit && !reducedMotion ? `${(node.wave ?? 0) * 0.45 + 0.2}s` : '0s' }">→ {{ node.next }}</span>
        </span>
        <span v-if="node.note" class="text-label text-[0.625rem] text-muted-foreground">{{ node.note }}</span>
      </li>
    </ol>
    <p class="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
      <span class="flex items-center gap-2"><span class="size-2.5 rounded-sm bg-ember" /> Hash changed — walked and re-embedded</span>
      <span class="flex items-center gap-2"><span class="size-2.5 rounded-sm border border-border bg-card" /> Hash matches — proven unchanged</span>
    </p>
  </FigureFrame>
</template>
