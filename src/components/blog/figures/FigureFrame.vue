<script setup lang="ts">
import { ChartBarIcon, TableIcon } from '@lucide/vue'
import { motion } from 'motion-v'
import { ref, useId } from 'vue'

import { spring } from '@/lib/motion'

import InlineText from '../InlineText.vue'

/**
 * Chrome shared by every in-article figure: the surface, the "Fig. n" label, the caption and —
 * for charts — a table view, so no value is ever available only as colour or position.
 */
const props = defineProps<{
  index: number
  caption: string
  alt: string
  table?: { head: string[]; rows: string[][]; numeric?: number[] }
  /** Diagrams sit on the page; charts sit on a card surface. */
  surface?: 'card' | 'none'
}>()

const view = ref<'chart' | 'table'>('chart')
const id = useId()
const isNumeric = (column: number) => props.table?.numeric?.includes(column) ?? false
</script>

<template>
  <figure class="post-figure" :aria-labelledby="`${id}-caption`">
    <div
      class="relative overflow-hidden rounded-3xl border border-border"
      :class="surface === 'none' ? 'bg-background' : 'bg-card'"
    >
      <div class="flex items-center justify-between gap-4 px-5 pt-4 sm:px-6">
        <span class="text-label text-muted-foreground">Fig. {{ String(index).padStart(2, '0') }}</span>
        <div v-if="table" class="flex rounded-full border border-border p-0.5" role="group" aria-label="Figure view">
          <button
            v-for="option in (['chart', 'table'] as const)"
            :key="option"
            type="button"
            class="relative flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors"
            :class="view === option ? 'text-background' : 'text-muted-foreground hover:text-foreground'"
            :aria-pressed="view === option"
            @click="view = option"
          >
            <motion.span
              v-if="view === option"
              :layout-id="`${id}-view`"
              class="absolute inset-0 rounded-full bg-foreground"
              :transition="spring.layout"
            />
            <component :is="option === 'chart' ? ChartBarIcon : TableIcon" class="relative size-3.5" aria-hidden="true" />
            <span class="relative capitalize">{{ option }}</span>
          </button>
        </div>
      </div>

      <div v-show="view === 'chart'" class="@container px-5 pt-4 pb-6 sm:px-6" role="img" :aria-label="alt">
        <slot />
      </div>

      <div v-if="table && view === 'table'" class="overflow-x-auto px-2 pt-2 pb-4 sm:px-3" tabindex="0" role="region" :aria-label="`${alt} — data table`">
        <table class="w-full min-w-[28rem] border-collapse text-left text-sm">
          <thead>
            <tr class="border-b border-border">
              <th
                v-for="(cell, column) in table.head"
                :key="cell"
                scope="col"
                class="text-label px-3 py-3 font-normal text-muted-foreground"
                :class="isNumeric(column) && 'text-right'"
              >
                {{ cell }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in table.rows" :key="index" class="border-b border-border/60 last:border-0">
              <td
                v-for="(cell, column) in row"
                :key="column"
                class="px-3 py-2.5"
                :class="isNumeric(column) ? 'text-right tabular' : column === 0 && 'font-medium'"
              >
                {{ cell }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <figcaption :id="`${id}-caption`" class="mt-3 text-sm leading-relaxed text-muted-foreground">
      <span class="font-medium text-foreground">Fig. {{ index }}.</span> <InlineText :text="caption" />
    </figcaption>
  </figure>
</template>
