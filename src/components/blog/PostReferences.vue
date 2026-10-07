<script setup lang="ts">
import { ArrowUpRightIcon } from '@lucide/vue'

import type { PostReference } from '@/types/blog'

defineProps<{ references: PostReference[] }>()

const host = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}
</script>

<template>
  <section aria-labelledby="references" class="border-t border-border pt-10">
    <h2 id="references" class="font-display text-2xl font-semibold tracking-tight [scroll-margin-top:7rem]">References</h2>
    <p class="mt-2 text-sm text-muted-foreground">Every claim above links to one of these. Accessed October 2026.</p>
    <ol class="mt-6 space-y-1">
      <li
        v-for="reference in references"
        :id="`ref-${reference.id}`"
        :key="reference.id"
        class="reference group/ref -mx-3 rounded-xl px-3 [scroll-margin-top:7rem]"
      >
        <a
          :href="reference.url"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-start gap-4 py-3"
        >
          <span class="text-label tabular mt-1 w-6 shrink-0 text-muted-foreground">{{ String(reference.id).padStart(2, '0') }}</span>
          <span class="min-w-0 flex-1">
            <span class="block leading-snug font-medium decoration-primary/60 underline-offset-4 group-hover/ref:underline">{{ reference.title }}</span>
            <span class="mt-1 block text-sm text-muted-foreground">{{ reference.publisher }} · <span class="font-mono text-xs">{{ host(reference.url) }}</span></span>
          </span>
          <ArrowUpRightIcon class="mt-1 size-4 shrink-0 text-muted-foreground transition-transform duration-300 group-hover/ref:translate-x-0.5 group-hover/ref:-translate-y-0.5" aria-hidden="true" />
        </a>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.reference {
  transition: background-color 0.6s;
}

/* Arriving from an inline citation flashes the source. */
.reference:target {
  animation: ref-flash 2.4s var(--ease-out-quint);
}

@keyframes ref-flash {
  0%,
  30% {
    background: color-mix(in oklch, var(--volt) 45%, transparent);
  }
  100% {
    background: transparent;
  }
}
</style>
