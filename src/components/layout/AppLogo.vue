<script setup lang="ts">
import { site } from '@/config/site'

import AppMark from './AppMark.vue'

withDefaults(defineProps<{ wordmark?: boolean }>(), { wordmark: true })
</script>

<template>
  <span class="group/mark inline-flex items-center gap-2.5">
    <AppMark explode class="h-[1.1rem] sm:h-5" />
    <span v-if="wordmark" class="font-display text-[1.05rem] font-bold tracking-[-0.02em] uppercase [font-stretch:118%]">
      {{ site.name }}
    </span>
  </span>
</template>
