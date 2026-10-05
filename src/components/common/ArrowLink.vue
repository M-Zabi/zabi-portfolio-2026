<script setup lang="ts">
import { ArrowRightIcon } from '@lucide/vue'
import { computed } from 'vue'
import { type RouteLocationRaw, RouterLink } from 'vue-router'

import RollingText from '@/components/motion/RollingText.vue'

/** Mono, underlined call to action — the hairline wipes across on hover. */
const props = defineProps<{
  label: string
  to?: RouteLocationRaw
  href?: string
}>()

const isExternal = computed(() => Boolean(props.href && /^https?:/.test(props.href)))
const linkProps = computed(() =>
  props.to
    ? { to: props.to }
    : {
        href: props.href,
        target: isExternal.value ? '_blank' : undefined,
        rel: isExternal.value ? 'noopener noreferrer' : undefined,
      },
)
</script>

<template>
  <component
    :is="to ? RouterLink : 'a'"
    v-bind="linkProps"
    class="roll-trigger group/arrow relative inline-flex min-h-11 min-w-[14rem] items-center justify-between gap-8 pb-2 font-mono text-[0.75rem] tracking-[0.04em] uppercase [font-stretch:90%]"
  >
    <RollingText :text="label" />
    <ArrowRightIcon
      class="size-4 shrink-0 transition-transform duration-500 ease-out-expo group-hover/arrow:translate-x-1"
      aria-hidden="true"
    />
    <span class="absolute inset-x-0 bottom-0 h-px bg-current opacity-25" aria-hidden="true" />
    <span
      class="absolute inset-x-0 bottom-0 h-px origin-right scale-x-0 bg-current transition-transform duration-700 ease-out-expo group-hover/arrow:origin-left group-hover/arrow:scale-x-100 group-focus-visible/arrow:scale-x-100"
      aria-hidden="true"
    />
  </component>
</template>
