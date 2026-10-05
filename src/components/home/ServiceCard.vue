<script setup lang="ts">
import { fillClass } from '@/lib/brand'
import type { BrandColor, Service } from '@/types/content'

import ServiceIcon from './ServiceIcon.vue'

defineProps<{ service: Service }>()

/** On hover the card floods with its brand colour from the bottom edge. */
const hoverText: Record<BrandColor, string> = {
  ember: 'group-hover/service:text-ember-foreground',
  volt: 'group-hover/service:text-volt-foreground',
  cobalt: 'group-hover/service:text-cobalt-foreground',
  mint: 'group-hover/service:text-mint-foreground',
  blush: 'group-hover/service:text-blush-foreground',
}
</script>

<template>
  <article
    class="group/service relative isolate flex h-full min-h-[24rem] flex-col overflow-hidden rounded-xl border border-border bg-card/85 p-6 backdrop-blur-sm transition-colors duration-500 sm:min-h-[27rem]"
    :class="hoverText[service.color]"
  >
    <span
      class="absolute inset-0 -z-10 origin-bottom scale-y-0 transition-transform duration-700 ease-out-expo group-hover/service:scale-y-100"
      :class="fillClass[service.color]"
      aria-hidden="true"
    />
    <p class="text-label tabular text-muted-foreground transition-colors duration-500 group-hover/service:text-current">
      {{ service.id }}
    </p>
    <ServiceIcon :kind="service.icon" class="mt-8 size-24" />
    <div class="mt-auto pt-10">
      <h3 class="font-display text-[1.75rem] leading-tight font-semibold tracking-[-0.02em]">{{ service.title }}</h3>
      <p class="mt-2 font-medium">{{ service.tagline }}</p>
      <p class="mt-4 leading-relaxed text-muted-foreground transition-colors duration-500 group-hover/service:text-current">
        {{ service.description }}
      </p>
    </div>
  </article>
</template>
