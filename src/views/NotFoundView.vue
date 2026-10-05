<script setup lang="ts">
import { useReducedMotion } from 'motion-v'
import { ref } from 'vue'

import ArrowLink from '@/components/common/ArrowLink.vue'
import AppMark from '@/components/layout/AppMark.vue'
import FadeIn from '@/components/motion/FadeIn.vue'
import RevealText from '@/components/motion/RevealText.vue'
import { usePageMeta } from '@/composables/usePageMeta'
import { pages } from '@/config/seo'

usePageMeta({ ...pages.notFound, noindex: true })

const reducedMotion = useReducedMotion()
/** The monogram arrives scattered and pulls itself together while hovered. */
const assembled = ref(false)
</script>

<template>
  <section class="container-page grid min-h-svh grid-cols-1 items-center gap-16 pt-(--header-h) pb-24 lg:grid-cols-12">
    <div class="lg:col-span-7">
      <FadeIn as="p" :y="10" class="text-label text-muted-foreground">(404) Lost in transit</FadeIn>
      <h1 class="mt-6 font-display text-display-lg">
        <RevealText :text="'This page took\na *different route.*'" trigger="ready" />
      </h1>
      <FadeIn as="p" :delay="0.3" class="mt-8 max-w-[40ch] text-lead text-muted-foreground">
        The link may be old, or the page may have moved. Everything else is right where you left it.
      </FadeIn>
      <FadeIn :delay="0.4" class="mt-10 flex flex-wrap gap-x-6 gap-y-2">
        <ArrowLink to="/" label="Back home" />
        <ArrowLink to="/work" label="See the work" />
      </FadeIn>
    </div>

    <FadeIn :delay="0.2" class="hidden justify-self-center text-primary lg:col-span-5 lg:block">
      <div aria-hidden="true" @pointerenter="assembled = true" @pointerleave="assembled = false">
        <AppMark
          :spread="assembled || reducedMotion ? 0 : 3.5"
          class="w-[min(28rem,32vw)] motion-safe:animate-float"
        />
      </div>
    </FadeIn>
  </section>
</template>
