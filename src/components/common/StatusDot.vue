<script setup lang="ts">
withDefaults(defineProps<{ tone?: 'success' | 'ember' }>(), { tone: 'success' })
</script>

<template>
  <span class="relative inline-flex size-2 shrink-0" aria-hidden="true">
    <span
      class="absolute inline-flex size-full animate-ping rounded-full opacity-60 motion-reduce:hidden"
      :class="tone === 'success' ? 'bg-success' : 'bg-ember'"
    />
    <span class="relative inline-flex size-2 rounded-full" :class="tone === 'success' ? 'bg-success' : 'bg-ember'" />
  </span>
</template>
