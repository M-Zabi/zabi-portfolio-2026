<script setup lang="ts">
import { useLocalTime } from '@/composables/useLocalTime'

withDefaults(defineProps<{ showZone?: boolean }>(), { showZone: true })

const { time, zone, tick } = useLocalTime()
</script>

<template>
  <span class="tabular inline-flex items-baseline gap-1.5">
    <time :datetime="time">
      {{ time.slice(0, 2) }}<span class="transition-opacity duration-300" :class="tick ? 'opacity-100' : 'opacity-30'">:</span
      >{{ time.slice(3) }}
    </time>
    <span v-if="showZone" class="opacity-60">{{ zone }}</span>
  </span>
</template>
