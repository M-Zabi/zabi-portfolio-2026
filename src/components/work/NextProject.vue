<script setup lang="ts">
import { ArrowRightIcon } from '@lucide/vue'

import { fillClass } from '@/lib/brand'
import type { BrandColor, Project } from '@/types/content'

defineProps<{ project: Project }>()

const hoverText: Record<BrandColor, string> = {
  ember: 'group-hover/next:text-ember-foreground',
  volt: 'group-hover/next:text-volt-foreground',
  cobalt: 'group-hover/next:text-cobalt-foreground',
  mint: 'group-hover/next:text-mint-foreground',
  blush: 'group-hover/next:text-blush-foreground',
}
</script>

<template>
  <RouterLink
    :to="{ name: 'project', params: { slug: project.slug } }"
    class="group/next relative isolate block overflow-hidden border-t border-border transition-colors duration-500"
    :class="hoverText[project.color]"
  >
    <span
      class="absolute inset-0 -z-10 origin-bottom scale-y-0 transition-transform duration-700 ease-out-expo group-hover/next:scale-y-100 group-focus-visible/next:scale-y-100"
      :class="fillClass[project.color]"
      aria-hidden="true"
    />
    <div class="container-page section-y">
      <p class="text-label opacity-60">Next project</p>
      <p class="mt-6 flex items-center justify-between gap-6 font-display text-display-xl">
        <span>{{ project.title }}</span>
        <ArrowRightIcon
          class="size-[0.55em] shrink-0 transition-transform duration-700 ease-out-expo group-hover/next:translate-x-3"
          aria-hidden="true"
        />
      </p>
      <p class="mt-6 max-w-[48ch] opacity-75">{{ project.summary }}</p>
    </div>
  </RouterLink>
</template>
