<script setup lang="ts">
import FadeIn from '@/components/motion/FadeIn.vue'
import RevealText from '@/components/motion/RevealText.vue'

/** Index label in the left rail, display title on the right — the site's section rhythm. */
defineProps<{
  index: string
  label: string
  title: string
  description?: string
  titleId?: string
}>()
</script>

<template>
  <header class="grid gap-6 lg:grid-cols-12 lg:gap-8">
    <FadeIn as="p" :y="10" class="text-label text-muted-foreground lg:col-span-3 lg:pt-3">
      ({{ index }}) {{ label }}
    </FadeIn>
    <div class="flex flex-col gap-8 lg:col-span-9 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h2 :id="titleId" class="font-display text-display-md">
          <RevealText :text="title" />
        </h2>
        <FadeIn v-if="description" as="p" :delay="0.15" class="mt-6 max-w-[54ch] text-lead text-muted-foreground">
          {{ description }}
        </FadeIn>
      </div>
      <slot name="actions" />
    </div>
  </header>
</template>
