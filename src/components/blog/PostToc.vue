<script setup lang="ts">
import { motion } from 'motion-v'
import { computed } from 'vue'

import { getLenis } from '@/composables/useLenis'
import type { TocEntry } from '@/lib/blog'
import { spring } from '@/lib/motion'
import { brandVar } from '@/lib/brand'
import type { BrandColor } from '@/types/content'

/**
 * Sticky contents with a live position marker, and a ring that empties as you read with the
 * minutes that remain.
 */
const props = defineProps<{ entries: TocEntry[]; active: string | null; progress: number; minutesLeft: number; color: BrandColor }>()

const RADIUS = 21
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const dash = computed(() => CIRCUMFERENCE * (1 - props.progress))
const remaining = computed(() =>
  props.progress >= 0.995 ? 'Finished' : props.minutesLeft <= 1 ? 'Under a minute left' : `${props.minutesLeft} min left`,
)

function go(event: MouseEvent, id: string) {
  const target = document.getElementById(id)
  const lenis = getLenis()
  if (!target || !lenis) return
  event.preventDefault()
  lenis.scrollTo(target, { offset: -110 })
  history.replaceState(null, '', `#${id}`)
}
</script>

<template>
  <nav aria-label="On this page" class="text-sm">
    <div class="flex items-center gap-3.5">
      <svg viewBox="0 0 50 50" class="size-12 -rotate-90" aria-hidden="true">
        <circle cx="25" cy="25" :r="RADIUS" class="fill-none stroke-border" stroke-width="3" />
        <circle
          cx="25"
          cy="25"
          :r="RADIUS"
          fill="none"
          :stroke="brandVar(color)"
          stroke-width="3"
          stroke-linecap="round"
          :stroke-dasharray="CIRCUMFERENCE"
          :stroke-dashoffset="dash"
          class="transition-[stroke-dashoffset] duration-150"
        />
      </svg>
      <div>
        <p class="text-label text-muted-foreground">Reading</p>
        <p class="tabular font-medium" aria-live="off">{{ remaining }}</p>
      </div>
    </div>

    <p class="text-label mt-8 text-muted-foreground">On this page</p>
    <ol class="relative mt-4 border-l border-border">
      <li v-for="entry in entries" :key="entry.id" class="relative">
        <motion.span
          v-if="active === entry.id"
          layout-id="toc-marker"
          class="absolute top-0 -left-px h-full w-0.5 rounded-full"
          :style="{ background: brandVar(color) }"
          :transition="spring.layout"
        />
        <a
          :href="`#${entry.id}`"
          class="block py-1.5 pl-4 leading-snug transition-colors duration-200"
          :class="active === entry.id ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'"
          :aria-current="active === entry.id ? 'location' : undefined"
          @click="go($event, entry.id)"
        >
          {{ entry.text }}
        </a>
      </li>
    </ol>
  </nav>
</template>
