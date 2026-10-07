<script setup lang="ts">
import { ArrowLeftIcon } from '@lucide/vue'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion-v'
import { useTemplateRef } from 'vue'

import AiOrb from '@/components/assistant/AiOrb.vue'
import FadeIn from '@/components/motion/FadeIn.vue'
import RevealText from '@/components/motion/RevealText.vue'
import { site } from '@/config/site'
import { blockClass, textOnClass } from '@/lib/brand'
import { categoryLabel } from '@/lib/blog'
import type { Post } from '@/types/blog'

import PostCover from './PostCover.vue'
import PostMeta from './PostMeta.vue'
import ShareMenu from './ShareMenu.vue'

/**
 * Split hero: the cover sits half on the page and half on a full-colour block that carries
 * the title, byline and actions — the post's colour is its identity everywhere it appears.
 */
const props = defineProps<{ post: Post; minutes: number; words: number; url: string; summarizing: boolean }>()
defineEmits<{ summarize: [] }>()

const hero = useTemplateRef<HTMLElement>('hero')
const reducedMotion = useReducedMotion()
const { scrollYProgress } = useScroll({ target: hero, offset: ['start start', 'end start'] })
const coverY = useTransform(scrollYProgress, [0, 1], [0, 90])
const coverRotate = useTransform(scrollYProgress, [0, 1], [0, -2])

const firstName = site.fullName.split(' ')[0]
const titleText = props.post.title
</script>

<template>
  <section ref="hero" class="relative overflow-x-clip">
    <!-- The colour block: full width on small screens, the right side from lg -->
    <div class="grain absolute inset-x-0 top-0 bottom-[30%] lg:bottom-0 lg:left-[44%]" :class="blockClass[post.color]" aria-hidden="true" />

    <div class="container-page relative grid gap-10 pt-[calc(var(--header-h)+2rem)] pb-14 lg:grid-cols-12 lg:gap-8 lg:pt-[calc(var(--header-h)+4.5rem)] lg:pb-24">
      <div class="lg:col-span-6 lg:row-start-1 lg:self-center">
        <FadeIn :y="40" :delay="0.25" class="relative">
          <motion.div :style="reducedMotion ? {} : { y: coverY, rotate: coverRotate }">
            <PostCover
              :kind="post.cover"
              :color="post.color"
              live
              class="aspect-[4/3] rounded-3xl shadow-[0_40px_80px_-30px_rgb(0_0_0/0.45)] ring-1 ring-black/5"
            />
          </motion.div>
        </FadeIn>
      </div>

      <div class="order-first lg:order-none lg:col-span-5 lg:col-start-8 lg:row-start-1 lg:self-center" :class="textOnClass[post.color]">
        <FadeIn :y="8">
          <RouterLink
            to="/blog"
            class="text-label -ml-1 inline-flex min-h-11 items-center gap-2 rounded-md px-1 opacity-75 transition-opacity hover:opacity-100"
          >
            <ArrowLeftIcon class="size-3.5" aria-hidden="true" />
            All articles
          </RouterLink>
        </FadeIn>

        <h1 class="mt-4 font-display text-[clamp(2.25rem,1.4rem+3.2vw,4.25rem)] leading-[0.98] font-semibold tracking-[-0.035em]">
          <RevealText :text="titleText" trigger="ready" emphasis-class="" />
        </h1>
        <FadeIn as="p" :delay="0.3" class="mt-6 max-w-[46ch] text-[clamp(1.05rem,0.95rem+0.45vw,1.3rem)] leading-snug opacity-85">
          {{ post.dek }}
        </FadeIn>

        <FadeIn :delay="0.4" class="mt-7 space-y-2.5">
          <p class="text-sm">
            by <RouterLink to="/about" class="font-semibold underline decoration-current/40 underline-offset-4 hover:decoration-current">{{ firstName }}</RouterLink>
            in <RouterLink :to="{ name: 'blog', query: { topic: post.category } }" class="font-semibold underline decoration-current/40 underline-offset-4 hover:decoration-current">{{ categoryLabel[post.category] }}</RouterLink>
          </p>
          <PostMeta :date="post.publishedAt" :minutes="minutes" :words="words" class="opacity-80" />
        </FadeIn>

        <FadeIn :delay="0.5" class="mt-7 flex flex-col items-start gap-4">
          <button
            type="button"
            class="summarize group/ai relative inline-flex h-12 items-center gap-3 overflow-hidden rounded-full bg-ink pr-5 pl-2 text-sm font-semibold text-paper transition-transform duration-200 active:scale-[0.97]"
            :aria-expanded="summarizing"
            aria-controls="ai-summary"
            @click="$emit('summarize')"
          >
            <span class="shimmer pointer-events-none absolute inset-0" aria-hidden="true" />
            <AiOrb class="size-8" :state="summarizing ? 'speaking' : 'idle'" />
            <span class="relative">{{ summarizing ? 'Summary open' : 'Summarize with AI' }}</span>
          </button>
          <ShareMenu :title="post.title" :text="post.dek" :url="url" tone="block" />
        </FadeIn>
      </div>
    </div>
  </section>
</template>

<style scoped>
.shimmer {
  background: linear-gradient(110deg, transparent 30%, rgb(255 255 255 / 0.16) 50%, transparent 70%);
  background-size: 250% 100%;
  animation: shimmer 3.2s var(--ease-in-out-quart) infinite;
}

@keyframes shimmer {
  from {
    background-position: 120% 0;
  }
  to {
    background-position: -120% 0;
  }
}
</style>
