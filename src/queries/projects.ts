import { useQuery } from '@tanstack/vue-query'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

import {
  fetchFeaturedProjects,
  fetchNextProject,
  fetchProject,
  fetchProjects,
} from '@/services/content'

export const projectKeys = {
  all: ['projects'] as const,
  list: () => [...projectKeys.all, 'list'] as const,
  featured: () => [...projectKeys.all, 'featured'] as const,
  detail: (slug: string) => [...projectKeys.all, 'detail', slug] as const,
  next: (slug: string) => [...projectKeys.all, 'next', slug] as const,
}

export function useProjectsQuery() {
  return useQuery({ queryKey: projectKeys.list(), queryFn: () => fetchProjects() })
}

export function useFeaturedProjectsQuery() {
  return useQuery({ queryKey: projectKeys.featured(), queryFn: fetchFeaturedProjects })
}

export function useProjectQuery(slug: MaybeRefOrGetter<string>) {
  const key = computed(() => toValue(slug))
  return useQuery({
    queryKey: computed(() => projectKeys.detail(key.value)),
    queryFn: () => fetchProject(key.value),
  })
}

export function useNextProjectQuery(slug: MaybeRefOrGetter<string>) {
  const key = computed(() => toValue(slug))
  return useQuery({
    queryKey: computed(() => projectKeys.next(key.value)),
    queryFn: () => fetchNextProject(key.value),
  })
}
