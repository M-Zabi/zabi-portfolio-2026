<script setup lang="ts">
import FadeIn from '@/components/motion/FadeIn.vue'
import RevealText from '@/components/motion/RevealText.vue'

/** Opening block for inner pages. The title reveals as soon as the curtain lifts. */
defineProps<{
  label: string
  title: string
  description?: string
}>()
</script>

<template>
  <section class="container-page pt-[calc(var(--header-h)+clamp(3rem,2rem+6vw,8rem))] pb-12 lg:pb-16">
    <FadeIn as="p" :y="12" class="text-label text-muted-foreground">{{ label }}</FadeIn>
    <h1 class="mt-6 font-display text-display-xl">
      <RevealText :text="title" trigger="ready" />
    </h1>
    <div class="mt-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
      <FadeIn v-if="description" as="p" :delay="0.35" class="max-w-[52ch] text-lead text-muted-foreground">
        {{ description }}
      </FadeIn>
      <slot />
    </div>
  </section>
</template>
