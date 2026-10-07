<script setup lang="ts">
import { useScroll } from '@vueuse/core'
import { computed, useTemplateRef } from 'vue'

import InlineText from './InlineText.vue'

/** Hairline data table. Scrolls sideways on small screens, with edge fades showing there is more. */
const props = defineProps<{ caption: string; head: string[]; rows: string[][]; numeric?: number[] }>()

const scroller = useTemplateRef<HTMLElement>('scroller')
const { arrivedState } = useScroll(scroller)
const isNumeric = (column: number) => props.numeric?.includes(column) ?? false
const fades = computed(() => ({ start: !arrivedState.left, end: !arrivedState.right }))
</script>

<template>
  <figure class="post-table">
    <div class="relative">
      <div ref="scroller" class="overflow-x-auto overscroll-x-contain rounded-2xl border border-border bg-card" tabindex="0" role="region" :aria-label="caption">
        <table class="w-full min-w-[36rem] border-collapse text-left text-[0.9375rem]">
          <thead>
            <tr class="border-b border-border">
              <th
                v-for="(cell, column) in head"
                :key="cell"
                scope="col"
                class="text-label px-4 py-3.5 font-normal whitespace-nowrap text-muted-foreground first:pl-5 last:pr-5"
                :class="isNumeric(column) && 'text-right'"
              >
                {{ cell }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in rows" :key="index" class="border-b border-border/70 transition-colors last:border-0 hover:bg-muted/40">
              <component
                :is="column === 0 ? 'th' : 'td'"
                v-for="(cell, column) in row"
                :key="column"
                :scope="column === 0 ? 'row' : undefined"
                class="px-4 py-3.5 align-top leading-snug first:pl-5 first:font-medium last:pr-5"
                :class="isNumeric(column) ? 'text-right tabular whitespace-nowrap' : 'text-foreground/85'"
              >
                <InlineText :text="cell" />
              </component>
            </tr>
          </tbody>
        </table>
      </div>
      <span
        class="pointer-events-none absolute inset-y-px left-px w-10 rounded-l-2xl bg-gradient-to-r from-card to-transparent transition-opacity"
        :class="fades.start ? 'opacity-100' : 'opacity-0'"
        aria-hidden="true"
      />
      <span
        class="pointer-events-none absolute inset-y-px right-px w-10 rounded-r-2xl bg-gradient-to-l from-card to-transparent transition-opacity"
        :class="fades.end ? 'opacity-100' : 'opacity-0'"
        aria-hidden="true"
      />
    </div>
    <figcaption class="mt-3 text-sm leading-relaxed text-muted-foreground"><InlineText :text="caption" /></figcaption>
  </figure>
</template>
