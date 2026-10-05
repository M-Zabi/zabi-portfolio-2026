<script setup lang="ts">
import { FolderOpenIcon } from '@lucide/vue'
import { AnimatePresence, motion } from 'motion-v'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import EmptyState from '@/components/common/EmptyState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import PageHero from '@/components/common/PageHero.vue'
import ProjectCard from '@/components/common/ProjectCard.vue'
import FadeIn from '@/components/motion/FadeIn.vue'
import ProjectGridSkeleton from '@/components/skeletons/ProjectGridSkeleton.vue'
import { Button } from '@/components/ui/button'
import { usePageMeta } from '@/composables/usePageMeta'
import { pages } from '@/config/seo'
import { ease, spring } from '@/lib/motion'
import { padIndex } from '@/lib/utils'
import { useProjectsQuery } from '@/queries/projects'
import type { ProjectCategory } from '@/types/content'

usePageMeta(pages.work)

type Filter = 'all' | ProjectCategory

const filters: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'web', label: 'Web' },
  { value: 'mobile', label: 'Mobile' },
  { value: 'desktop', label: 'Desktop' },
]

const route = useRoute()
const router = useRouter()
const { data: projects, isPending, isError, isRefetching, refetch } = useProjectsQuery()

/** Synced to `?type=` so any filtered view is a shareable link. */
const active = computed<Filter>({
  get: () => filters.find((filter) => filter.value === route.query.type)?.value ?? 'all',
  set: (value) => void router.replace({ query: value === 'all' ? {} : { type: value } }),
})

const visible = computed(() =>
  (projects.value ?? []).filter((project) => active.value === 'all' || project.category === active.value),
)

const count = (filter: Filter) =>
  (projects.value ?? []).filter((project) => filter === 'all' || project.category === filter).length
</script>

<template>
  <div>
    <PageHero
      label="(Work)"
      :title="'Selected *work.*'"
      description="Products across the web, both app stores and the desktop — each one with the problem, the approach and what changed."
    />

    <section class="container-page pb-(--space-section)" aria-label="Projects">
      <FadeIn :delay="0.4" :y="12">
        <div
          class="no-scrollbar -mx-(--gutter) flex gap-7 overflow-x-auto border-b border-border px-(--gutter)"
          role="group"
          aria-label="Filter projects by platform"
        >
          <button
            v-for="filter in filters"
            :key="filter.value"
            type="button"
            class="relative flex min-h-12 shrink-0 items-center gap-1.5 text-sm font-medium transition-colors"
            :class="active === filter.value ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'"
            :aria-pressed="active === filter.value"
            @click="active = filter.value"
          >
            {{ filter.label }}
            <span class="text-label tabular opacity-60">{{ padIndex(count(filter.value)) }}</span>
            <motion.span
              v-if="active === filter.value"
              layout-id="work-filter"
              class="absolute inset-x-0 -bottom-px h-0.5 bg-primary"
              :transition="spring.layout"
            />
          </button>
        </div>
      </FadeIn>

      <div class="mt-14">
        <ProjectGridSkeleton v-if="isPending" />
        <ErrorState v-else-if="isError" :retrying="isRefetching" @retry="refetch()" />
        <EmptyState
          v-else-if="!visible.length"
          :icon="FolderOpenIcon"
          title="Nothing here yet"
          description="No projects match this platform right now."
        >
          <Button variant="outline" size="lg" @click="active = 'all'">Show all projects</Button>
        </EmptyState>

        <ul v-else class="grid grid-cols-1 gap-x-6 gap-y-16 md:grid-cols-2">
          <AnimatePresence mode="popLayout">
            <motion.li
              v-for="(project, index) in visible"
              :key="project.slug"
              layout
              :initial="{ opacity: 0, y: 40 }"
              :animate="{ opacity: 1, y: 0 }"
              :exit="{ opacity: 0, scale: 0.96 }"
              :transition="{ duration: 0.6, delay: index * 0.05, ease: ease.outQuint }"
              :class="index % 2 === 1 && 'md:mt-24'"
            >
              <ProjectCard :project="project" :index="index" heading-level="h2" />
            </motion.li>
          </AnimatePresence>
        </ul>
      </div>
    </section>
  </div>
</template>
