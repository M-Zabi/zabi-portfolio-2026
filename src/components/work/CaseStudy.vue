<script setup lang="ts">
import { ArrowLeftIcon } from '@lucide/vue'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion-v'
import { useTemplateRef } from 'vue'

import ArrowLink from '@/components/common/ArrowLink.vue'
import ProjectVisual from '@/components/common/ProjectVisual.vue'
import FadeIn from '@/components/motion/FadeIn.vue'
import RevealText from '@/components/motion/RevealText.vue'
import { Badge } from '@/components/ui/badge'
import { blockClass } from '@/lib/brand'
import { padIndex } from '@/lib/utils'
import type { Project } from '@/types/content'

import NextProject from './NextProject.vue'

const props = defineProps<{ project: Project; next: Project | null }>()

const visual = useTemplateRef<HTMLElement>('visual')
const reducedMotion = useReducedMotion()
const { scrollYProgress } = useScroll({ target: visual, offset: ['start end', 'end start'] })
const visualScale = useTransform(scrollYProgress, [0, 0.45], [0.9, 1])
const visualRadius = useTransform(scrollYProgress, [0, 0.45], [48, 24])

const meta = [
  { label: 'Client', value: props.project.client },
  { label: 'Role', value: props.project.role },
  { label: 'Platforms', value: props.project.platforms.join(', ') },
  { label: 'Year', value: String(props.project.year) },
]
</script>

<template>
  <article>
    <header class="container-page pt-[calc(var(--header-h)+clamp(2.5rem,1.5rem+5vw,6rem))]">
      <FadeIn :y="8">
        <RouterLink
          to="/work"
          class="text-label -ml-1 inline-flex min-h-11 items-center gap-2 rounded-md px-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon class="size-3.5" aria-hidden="true" />
          All work
        </RouterLink>
      </FadeIn>

      <p class="text-label mt-10 text-muted-foreground">Case study — {{ project.year }}</p>
      <h1 class="mt-5 font-display text-display-xl">
        <RevealText :text="project.title" trigger="ready" by="char" />
      </h1>
      <FadeIn
        as="p"
        :delay="0.35"
        class="mt-8 max-w-[38ch] text-[clamp(1.25rem,1.05rem+0.9vw,1.85rem)] leading-snug tracking-[-0.01em]"
      >
        {{ project.summary }}
      </FadeIn>

      <FadeIn :delay="0.45">
        <dl class="mt-14 grid grid-cols-2 gap-x-6 gap-y-8 border-y border-border py-8 lg:grid-cols-4">
          <div v-for="item in meta" :key="item.label">
            <dt class="text-label text-muted-foreground">{{ item.label }}</dt>
            <dd class="mt-2 font-medium">{{ item.value }}</dd>
          </div>
        </dl>
      </FadeIn>
    </header>

    <div ref="visual" class="container-page mt-14">
      <motion.div
        class="overflow-hidden"
        :style="reducedMotion ? { borderRadius: 24 } : { scale: visualScale, borderRadius: visualRadius }"
      >
        <ProjectVisual :project="project" eager class="aspect-[4/3] sm:aspect-[16/10]" />
      </motion.div>
    </div>

    <section class="section-y container-page" aria-label="Story">
      <div class="flex flex-col gap-16 lg:gap-24">
        <div v-for="(section, index) in project.sections" :key="section.heading" class="grid gap-6 lg:grid-cols-12">
          <FadeIn class="lg:col-span-3">
            <h2 class="text-label sticky top-28 text-muted-foreground">
              {{ padIndex(index + 1) }} — {{ section.heading }}
            </h2>
          </FadeIn>
          <FadeIn as="p" :delay="0.08" class="max-w-[60ch] text-lead lg:col-span-7 lg:col-start-5">
            {{ section.body }}
          </FadeIn>
        </div>
      </div>
    </section>

    <section class="container-page" aria-labelledby="results-title">
      <h2 id="results-title" class="text-label text-muted-foreground">Results</h2>
      <ul class="mt-6 grid gap-3 sm:grid-cols-3">
        <li v-for="(metric, index) in project.metrics" :key="metric.label">
          <FadeIn :delay="index * 0.08" class="h-full">
            <div class="grain flex h-full min-h-56 flex-col justify-between rounded-3xl p-7" :class="blockClass[project.color]">
              <span class="text-label opacity-70">{{ padIndex(index + 1) }}</span>
              <div>
                <p class="font-display text-display-md tabular">{{ metric.value }}</p>
                <p class="mt-3 font-medium opacity-80">{{ metric.label }}</p>
              </div>
            </div>
          </FadeIn>
        </li>
      </ul>
    </section>

    <section class="section-y container-page" aria-labelledby="stack-title">
      <div class="grid gap-6 lg:grid-cols-12">
        <h2 id="stack-title" class="text-label text-muted-foreground lg:col-span-3">Stack</h2>
        <div class="lg:col-span-7 lg:col-start-5">
          <FadeIn>
            <ul class="flex flex-wrap gap-2">
              <li v-for="tech in project.stack" :key="tech">
                <Badge variant="outline" class="h-9 rounded-full px-4 text-sm">{{ tech }}</Badge>
              </li>
            </ul>
          </FadeIn>
          <FadeIn v-if="project.links?.live || project.links?.repo" :delay="0.1" class="mt-10 flex flex-wrap gap-6">
            <ArrowLink v-if="project.links?.live" :href="project.links.live" label="Visit live site" />
            <ArrowLink v-if="project.links?.repo" :href="project.links.repo" label="View source" />
          </FadeIn>
        </div>
      </div>
    </section>

    <NextProject v-if="next" :project="next" />
  </article>
</template>
