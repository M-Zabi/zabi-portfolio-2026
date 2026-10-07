<script setup lang="ts">
import type { PostReference } from '@/types/blog'

/**
 * A numbered citation. Hover or focus previews the source; activating it jumps to the
 * reference list (Lenis handles the in-page anchor with the header offset).
 */
defineProps<{ id: number; reference?: PostReference }>()
</script>

<template>
  <span class="ref group/ref relative inline-block align-super leading-none">
    <a
      :href="`#ref-${id}`"
      class="text-label inline-grid min-w-[1.35rem] place-items-center rounded-full border border-border bg-background px-1 py-0.5 text-[0.625rem] text-muted-foreground no-underline transition-colors duration-200 hover:border-foreground hover:bg-foreground hover:text-background focus-visible:bg-foreground focus-visible:text-background"
      :aria-label="reference ? `Reference ${id}: ${reference.title}` : `Reference ${id}`"
      :aria-describedby="reference ? `ref-preview-${id}` : undefined"
    >
      {{ id }}
    </a>
    <span
      v-if="reference"
      :id="`ref-preview-${id}`"
      role="tooltip"
      class="pointer-events-none absolute bottom-[calc(100%+0.5rem)] left-1/2 z-30 w-72 -translate-x-1/2 translate-y-1 rounded-xl border border-border bg-popover p-3.5 text-left align-baseline text-sm leading-snug font-normal text-popover-foreground normal-case opacity-0 shadow-xl transition duration-200 ease-out-quint group-hover/ref:translate-y-0 group-hover/ref:opacity-100 group-focus-within/ref:translate-y-0 group-focus-within/ref:opacity-100"
    >
      <span class="text-label block text-muted-foreground">{{ reference.publisher }}</span>
      <span class="mt-1.5 block font-medium">{{ reference.title }}</span>
    </span>
  </span>
</template>

<style scoped>
.ref {
  margin-inline: 0.15em;
  top: -0.1em;
}

/* Touch screens have no hover; the marker is a plain jump link there. */
@media (hover: none) {
  [role='tooltip'] {
    display: none;
  }
}
</style>
