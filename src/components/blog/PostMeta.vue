<script setup lang="ts">
import { CalendarIcon, Clock3Icon } from '@lucide/vue'

import { formatPostDate } from '@/lib/blog'

/** Date and reading time, in one line of mono labels. */
defineProps<{ date: string; minutes: number; words?: number }>()
</script>

<template>
  <p class="text-label flex flex-wrap items-center gap-x-4 gap-y-1.5">
    <span class="inline-flex items-center gap-1.5">
      <CalendarIcon class="size-3" aria-hidden="true" />
      <time :datetime="date">{{ formatPostDate(date) }}</time>
    </span>
    <span class="inline-flex items-center gap-1.5">
      <Clock3Icon class="size-3" aria-hidden="true" />
      {{ minutes }} min read
    </span>
    <span v-if="words" class="tabular opacity-70">{{ words.toLocaleString('en-US') }} words</span>
  </p>
</template>
