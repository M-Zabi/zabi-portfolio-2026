import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

import type { CommentInput } from '@/lib/validators/comment'
import { fetchPost, fetchPosts, fetchRelatedPosts } from '@/services/blog'
import { addComment, type Engagement, fetchEngagement, setHeart } from '@/services/engagement'

export const blogKeys = {
  all: ['blog'] as const,
  list: () => [...blogKeys.all, 'list'] as const,
  detail: (slug: string) => [...blogKeys.all, 'detail', slug] as const,
  related: (slug: string) => [...blogKeys.all, 'related', slug] as const,
  engagement: (slug: string) => [...blogKeys.all, 'engagement', slug] as const,
}

export function usePostsQuery() {
  return useQuery({ queryKey: blogKeys.list(), queryFn: () => fetchPosts() })
}

export function usePostQuery(slug: MaybeRefOrGetter<string>) {
  const key = computed(() => toValue(slug))
  return useQuery({ queryKey: computed(() => blogKeys.detail(key.value)), queryFn: () => fetchPost(key.value) })
}

export function useRelatedPostsQuery(slug: MaybeRefOrGetter<string>) {
  const key = computed(() => toValue(slug))
  return useQuery({ queryKey: computed(() => blogKeys.related(key.value)), queryFn: () => fetchRelatedPosts(key.value) })
}

export function useEngagementQuery(slug: MaybeRefOrGetter<string>) {
  const key = computed(() => toValue(slug))
  return useQuery({
    queryKey: computed(() => blogKeys.engagement(key.value)),
    queryFn: () => fetchEngagement(key.value),
    staleTime: 30_000,
  })
}

/** Optimistic: the heart fills and the count moves before the server answers. */
export function useHeartMutation(slug: MaybeRefOrGetter<string>) {
  const client = useQueryClient()
  const key = () => blogKeys.engagement(toValue(slug))

  return useMutation({
    mutationFn: (hearted: boolean) => setHeart(toValue(slug), hearted),
    onMutate: async (hearted) => {
      await client.cancelQueries({ queryKey: key() })
      const previous = client.getQueryData<Engagement>(key())
      if (previous) {
        client.setQueryData<Engagement>(key(), {
          ...previous,
          hearted,
          hearts: Math.max(0, previous.hearts + (hearted ? 1 : -1)),
        })
      }
      return { previous }
    },
    onError: (_error, _hearted, context) => {
      if (context?.previous) client.setQueryData(key(), context.previous)
    },
    onSuccess: (hearts, hearted) => {
      const current = client.getQueryData<Engagement>(key())
      if (current) client.setQueryData<Engagement>(key(), { ...current, hearts, hearted })
    },
  })
}

export function useCommentMutation(slug: MaybeRefOrGetter<string>) {
  const client = useQueryClient()
  const key = () => blogKeys.engagement(toValue(slug))

  return useMutation({
    mutationFn: (input: CommentInput) => addComment(toValue(slug), input),
    onSuccess: (comment) => {
      const current = client.getQueryData<Engagement>(key())
      if (current) client.setQueryData<Engagement>(key(), { ...current, comments: [...current.comments, comment] })
    },
  })
}
