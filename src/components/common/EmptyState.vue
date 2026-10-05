<script setup lang="ts">
import type { Component } from 'vue'

/** Icon, headline, one sentence, and the action that resolves it (DESIGN.md §2). */
defineProps<{ icon: Component; title: string; description: string }>()
</script>

<template>
  <div class="flex flex-col items-start gap-5 rounded-3xl border border-dashed border-border p-8 sm:p-12">
    <span class="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground" aria-hidden="true">
      <component :is="icon" class="size-5" />
    </span>
    <div>
      <h2 class="font-display text-display-sm">{{ title }}</h2>
      <p class="mt-2 max-w-[48ch] text-muted-foreground">{{ description }}</p>
    </div>
    <slot />
  </div>
</template>
