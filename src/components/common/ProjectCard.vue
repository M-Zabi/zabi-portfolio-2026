<script setup lang="ts">
import { ArrowUpRightIcon } from '@lucide/vue'

import { padIndex } from '@/lib/utils'
import type { Project } from '@/types/content'

import ProjectVisual from './ProjectVisual.vue'

withDefaults(defineProps<{ project: Project; index: number; headingLevel?: 'h2' | 'h3' }>(), {
  headingLevel: 'h3',
})
</script>

<template>
  <RouterLink
    :to="{ name: 'project', params: { slug: project.slug } }"
    class="group/card block rounded-2xl focus-visible:outline-offset-8"
    draggable="false"
  >
    <div class="relative overflow-hidden rounded-2xl">
      <ProjectVisual
        :project="project"
        class="transition-transform duration-[1200ms] ease-out-expo group-hover/card:scale-[1.025]"
      />
      <span
        class="text-label absolute top-4 left-4 translate-y-2 rounded-full bg-background/90 px-3.5 py-2 text-foreground opacity-0 backdrop-blur-md transition duration-500 ease-out-expo group-hover/card:translate-y-0 group-hover/card:opacity-100 group-focus-visible/card:translate-y-0 group-focus-visible/card:opacity-100"
        aria-hidden="true"
      >
        View case study
      </span>
    </div>

    <div class="mt-5 flex items-start justify-between gap-6">
      <div>
        <p class="text-label tabular text-muted-foreground">
          {{ padIndex(index + 1) }} — {{ project.platforms.join(' · ') }} — {{ project.year }}
        </p>
        <component :is="headingLevel" class="mt-2 font-display text-display-sm">{{ project.title }}</component>
        <p class="mt-2 max-w-[46ch] text-muted-foreground">{{ project.summary }}</p>
      </div>
      <span
        class="grid size-12 shrink-0 place-items-center rounded-full border border-border transition-colors duration-300 group-hover/card:border-foreground group-hover/card:bg-foreground group-hover/card:text-background"
        aria-hidden="true"
      >
        <ArrowUpRightIcon class="size-5 transition-transform duration-500 ease-out-expo group-hover/card:rotate-45" />
      </span>
    </div>
  </RouterLink>
</template>
