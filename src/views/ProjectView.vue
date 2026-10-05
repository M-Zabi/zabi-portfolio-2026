<script setup lang="ts">
import { SearchXIcon } from '@lucide/vue'

import ArrowLink from '@/components/common/ArrowLink.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import CaseStudySkeleton from '@/components/skeletons/CaseStudySkeleton.vue'
import CaseStudy from '@/components/work/CaseStudy.vue'
import { usePageMeta } from '@/composables/usePageMeta'
import { pages, projectPage } from '@/config/seo'
import { site } from '@/config/site'
import { useNextProjectQuery, useProjectQuery } from '@/queries/projects'

const props = defineProps<{ slug: string }>()

const { data: project, isPending, isError, isRefetching, refetch } = useProjectQuery(() => props.slug)
const { data: next } = useNextProjectQuery(() => props.slug)

usePageMeta(() =>
  project.value
    ? projectPage(project.value)
    : isPending.value
      ? { title: 'Case study', description: site.description }
      : { ...pages.notFound, noindex: true },
)
</script>

<template>
  <CaseStudySkeleton v-if="isPending" />

  <div v-else-if="isError" class="container-page pt-[calc(var(--header-h)+6rem)] pb-(--space-section)">
    <ErrorState :retrying="isRefetching" @retry="refetch()" />
  </div>

  <div v-else-if="!project" class="container-page pt-[calc(var(--header-h)+6rem)] pb-(--space-section)">
    <EmptyState :icon="SearchXIcon" title="Case study not found" description="That project doesn’t exist — or it has moved.">
      <ArrowLink to="/work" label="Browse all work" />
    </EmptyState>
  </div>

  <CaseStudy v-else :project="project" :next="next ?? null" />
</template>
