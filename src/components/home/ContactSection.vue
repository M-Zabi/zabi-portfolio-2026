<script setup lang="ts">
import BusinessCard3D from '@/components/business-card/BusinessCard3D.vue'
import ArrowLink from '@/components/common/ArrowLink.vue'
import FadeIn from '@/components/motion/FadeIn.vue'
import RevealText from '@/components/motion/RevealText.vue'
import { site } from '@/config/site'
</script>

<template>
  <section class="section-y relative z-10 overflow-x-clip" aria-labelledby="contact-title">
    <div class="container-page grid grid-cols-1 items-center gap-16 lg:grid-cols-12">
      <div class="lg:col-span-6">
        <FadeIn as="p" :y="10" class="text-label text-muted-foreground">(06) Contact</FadeIn>
        <h2 id="contact-title" class="mt-6 font-display text-display-lg">
          <RevealText :text="'Let’s build\nsomething that *moves.*'" />
        </h2>
        <FadeIn as="p" :delay="0.15" class="mt-8 max-w-[44ch] text-lead text-muted-foreground">
          Tell me about the product, the deadline and what “great” looks like. {{ site.replyTime }}.
        </FadeIn>
        <FadeIn :delay="0.25" class="mt-10 flex flex-wrap gap-x-6 gap-y-2">
          <ArrowLink to="/contact" label="Start a project" />
          <ArrowLink :href="`mailto:${site.email}`" label="Email me" />
        </FadeIn>
      </div>

      <FadeIn :delay="0.2" class="lg:col-span-6">
        <BusinessCard3D />
        <p class="text-label mt-2 text-center text-muted-foreground">Tilt it · Click to flip</p>
      </FadeIn>
    </div>
  </section>
</template>
