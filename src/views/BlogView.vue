<script setup lang="ts">
import { NewspaperIcon } from '@lucide/vue'
import { AnimatePresence, motion } from 'motion-v'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import PostCard from '@/components/blog/PostCard.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import PageHero from '@/components/common/PageHero.vue'
import FadeIn from '@/components/motion/FadeIn.vue'
import PostGridSkeleton from '@/components/skeletons/PostGridSkeleton.vue'
import { Button } from '@/components/ui/button'
import { usePageMeta } from '@/composables/usePageMeta'
import { pages } from '@/config/seo'
import { categoryLabel } from '@/lib/blog'
import { ease, spring } from '@/lib/motion'
import { padIndex } from '@/lib/utils'
import { usePostsQuery } from '@/queries/blog'
import type { PostCategory } from '@/types/blog'

usePageMeta(pages.blog)

type Filter = 'all' | PostCategory

const route = useRoute()
const router = useRouter()
const { data: posts, isPending, isError, isRefetching, refetch } = usePostsQuery()

/** Topics that actually have posts, in the order they first appear (newest first). */
const topics = computed<Filter[]>(() => ['all', ...new Set((posts.value ?? []).map((post) => post.category))])

/** Synced to `?topic=` so any filtered view is a shareable link. */
const active = computed<Filter>({
  get: () => topics.value.find((topic) => topic === route.query.topic) ?? 'all',
  set: (value) => void router.replace({ query: value === 'all' ? {} : { topic: value } }),
})

const visible = computed(() => (posts.value ?? []).filter((post) => active.value === 'all' || post.category === active.value))
const lead = computed(() => visible.value[0])
const rest = computed(() => visible.value.slice(1))
const count = (topic: Filter) => (posts.value ?? []).filter((post) => topic === 'all' || post.category === topic).length
const label = (topic: Filter) => (topic === 'all' ? 'All' : categoryLabel[topic])
</script>

<template>
  <div>
    <PageHero
      label="(Blog)"
      :title="'Field notes on\n*AI & the craft.*'"
      description="Editors, agents, local models, token economics and design tools — researched, referenced and tested on real projects."
    />

    <section class="container-page pb-(--space-section)" aria-label="Articles">
      <FadeIn :delay="0.4" :y="12">
        <div class="no-scrollbar -mx-(--gutter) flex gap-7 overflow-x-auto border-b border-border px-(--gutter)" role="group" aria-label="Filter articles by topic">
          <button
            v-for="topic in topics"
            :key="topic"
            type="button"
            class="relative flex min-h-12 shrink-0 items-center gap-1.5 text-sm font-medium transition-colors"
            :class="active === topic ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'"
            :aria-pressed="active === topic"
            @click="active = topic"
          >
            {{ label(topic) }}
            <span class="text-label tabular opacity-60">{{ padIndex(count(topic)) }}</span>
            <motion.span v-if="active === topic" layout-id="blog-filter" class="absolute inset-x-0 -bottom-px h-0.5 bg-primary" :transition="spring.layout" />
          </button>
        </div>
      </FadeIn>

      <div class="mt-14">
        <PostGridSkeleton v-if="isPending" />
        <ErrorState v-else-if="isError" :retrying="isRefetching" @retry="refetch()" />
        <EmptyState v-else-if="!lead" :icon="NewspaperIcon" title="Nothing here yet" description="No articles on this topic right now.">
          <Button variant="outline" size="lg" @click="active = 'all'">Show all articles</Button>
        </EmptyState>

        <template v-else>
          <AnimatePresence mode="wait">
            <motion.div
              :key="lead.slug"
              :initial="{ opacity: 0, y: 30 }"
              :animate="{ opacity: 1, y: 0 }"
              :exit="{ opacity: 0, y: -10 }"
              :transition="{ duration: 0.6, ease: ease.outQuint }"
            >
              <PostCard :post="lead" featured />
            </motion.div>
          </AnimatePresence>

          <ul v-if="rest.length" class="mt-20 grid grid-cols-1 gap-x-6 gap-y-16 border-t border-border pt-16 md:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence mode="popLayout">
              <motion.li
                v-for="(post, index) in rest"
                :key="post.slug"
                layout
                :initial="{ opacity: 0, y: 40 }"
                :animate="{ opacity: 1, y: 0 }"
                :exit="{ opacity: 0, scale: 0.96 }"
                :transition="{ duration: 0.6, delay: index * 0.05, ease: ease.outQuint }"
              >
                <PostCard :post="post" heading-level="h3" />
              </motion.li>
            </AnimatePresence>
          </ul>
        </template>
      </div>
    </section>
  </div>
</template>
