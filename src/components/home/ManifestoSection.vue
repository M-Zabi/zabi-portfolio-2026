<script setup lang="ts">
import FadeIn from '@/components/motion/FadeIn.vue'
import ScrollHighlightText from '@/components/motion/ScrollHighlightText.vue'

const manifesto =
  'I design and engineer software for people who notice the details — *web platforms* that load before you blink, *mobile apps* that feel truly native, and *desktop tools* that turn a twelve-step workflow into one smooth motion.'
</script>

<template>
  <section id="manifesto" class="section-y relative z-10" aria-label="Approach">
    <div class="container-page grid gap-8 lg:grid-cols-12">
      <FadeIn as="p" :y="10" class="text-label text-muted-foreground lg:col-span-3 lg:pt-3">(01) Approach</FadeIn>
      <ScrollHighlightText
        :text="manifesto"
        class="max-w-[32ch] font-display text-[clamp(1.75rem,1.05rem+2.5vw,3.5rem)] leading-[1.08] font-medium tracking-[-0.03em] lg:col-span-9"
      />
    </div>
  </section>
</template>
