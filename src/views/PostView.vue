<script setup lang="ts">
import { SearchXIcon } from '@lucide/vue'
import { computed, nextTick, ref, useTemplateRef } from 'vue'
import { useRoute } from 'vue-router'
import { toast } from 'vue-sonner'

import AiSummary from '@/components/blog/AiSummary.vue'
import AuthorCard from '@/components/blog/AuthorCard.vue'
import CommentsDrawer from '@/components/blog/CommentsDrawer.vue'
import PostActions from '@/components/blog/PostActions.vue'
import PostBody from '@/components/blog/PostBody.vue'
import PostCard from '@/components/blog/PostCard.vue'
import PostHero from '@/components/blog/PostHero.vue'
import PostReferences from '@/components/blog/PostReferences.vue'
import PostToc from '@/components/blog/PostToc.vue'
import ReadingProgress from '@/components/blog/ReadingProgress.vue'
import ArrowLink from '@/components/common/ArrowLink.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import FadeIn from '@/components/motion/FadeIn.vue'
import PostSkeleton from '@/components/skeletons/PostSkeleton.vue'
import { getLenis } from '@/composables/useLenis'
import { useActiveHeading } from '@/composables/useActiveHeading'
import { usePageMeta } from '@/composables/usePageMeta'
import { useReadingProgress } from '@/composables/useReadingProgress'
import { pages, postPage } from '@/config/seo'
import { site } from '@/config/site'
import { readingMinutes, tableOfContents, wordCount } from '@/lib/blog'
import { useEngagementQuery, useHeartMutation, usePostQuery, useRelatedPostsQuery } from '@/queries/blog'

const props = defineProps<{ slug: string }>()

const route = useRoute()
const { data: post, isPending, isError, isRefetching, refetch } = usePostQuery(() => props.slug)
const { data: related } = useRelatedPostsQuery(() => props.slug)
const { data: engagement, isPending: engagementPending } = useEngagementQuery(() => props.slug)
const heart = useHeartMutation(() => props.slug)

usePageMeta(() =>
  post.value
    ? postPage(post.value)
    : isPending.value
      ? { title: 'Article', description: pages.blog.description }
      : { ...pages.notFound, noindex: true },
)

const minutes = computed(() => (post.value ? readingMinutes(post.value) : 1))
const words = computed(() => (post.value ? wordCount(post.value) : 0))
const toc = computed(() =>
  post.value ? [...tableOfContents(post.value), { id: 'references', text: 'References' }] : [],
)
const url = computed(() =>
  typeof window === 'undefined' ? `${site.url}${route.path}` : `${window.location.origin}${route.path}`,
)

const article = useTemplateRef<HTMLElement>('article')
const { progress, minutesLeft } = useReadingProgress(article, minutes)
const active = useActiveHeading(computed(() => toc.value.map((entry) => entry.id)))

const summaryOpen = ref(false)
const commentsOpen = ref(false)
const barVisible = computed(() => progress.value > 0.04 && progress.value < 0.97 && !commentsOpen.value)

async function toggleSummary() {
  summaryOpen.value = !summaryOpen.value
  if (!summaryOpen.value) return
  await nextTick()
  // Bring the panel into view if it opened from the rail, far below.
  const panel = document.getElementById('ai-summary')
  if (panel && panel.getBoundingClientRect().top < 0) getLenis()?.scrollTo(panel, { offset: -110 })
}

function onHeart(hearted: boolean) {
  heart.mutate(hearted, {
    onError: () => toast.error('Couldn’t save your heart', { description: 'Please try again in a moment.' }),
  })
}
</script>

<template>
  <PostSkeleton v-if="isPending" />

  <div v-else-if="isError" class="container-page pt-[calc(var(--header-h)+6rem)] pb-(--space-section)">
    <ErrorState :retrying="isRefetching" @retry="refetch()" />
  </div>

  <div v-else-if="!post" class="container-page pt-[calc(var(--header-h)+6rem)] pb-(--space-section)">
    <EmptyState :icon="SearchXIcon" title="Article not found" description="That post doesn’t exist — or it has moved.">
      <ArrowLink to="/blog" label="Browse all articles" />
    </EmptyState>
  </div>

  <div v-else>
    <ReadingProgress :progress="progress" :color="post.color" />

    <article ref="article">
      <PostHero :post="post" :minutes="minutes" :words="words" :url="url" :summarizing="summaryOpen" @summarize="toggleSummary" />

      <div id="ai-summary" class="container-page [scroll-margin-top:7rem]">
        <div class="lg:grid lg:grid-cols-12">
          <div class="lg:col-span-8 lg:col-start-3" :class="summaryOpen && 'pt-10'">
            <AiSummary v-model:open="summaryOpen" :post="post" :words="words" />
          </div>
        </div>
      </div>

      <div class="container-page grid gap-10 pt-14 pb-(--space-section) lg:grid-cols-12 lg:gap-8 lg:pt-20">
        <aside class="hidden lg:col-span-1 lg:block">
          <div class="sticky top-28">
            <PostActions
              layout="rail"
              :hearted="engagement?.hearted ?? false"
              :hearts="engagement?.hearts ?? 0"
              :comments="engagement?.comments.length ?? 0"
              :title="post.title"
              :url="url"
              :summarizing="summaryOpen"
              @heart="onHeart"
              @comments="commentsOpen = true"
              @summarize="toggleSummary"
            />
          </div>
        </aside>

        <div class="min-w-0 lg:col-span-7 lg:col-start-3">
          <PostBody :blocks="post.body" :references="post.references" />

          <FadeIn class="mt-14">
            <ul class="flex flex-wrap gap-2" aria-label="Tags">
              <li v-for="tag in post.tags" :key="tag" class="rounded-full border border-border px-3.5 py-1.5 text-sm text-muted-foreground">#{{ tag }}</li>
            </ul>
          </FadeIn>

          <div class="mt-14">
            <PostReferences :references="post.references" />
          </div>

          <FadeIn class="mt-16">
            <button
              type="button"
              class="group/discuss flex w-full items-center justify-between gap-6 rounded-3xl border border-border p-6 text-left transition-colors duration-300 hover:border-foreground/40 hover:bg-muted/50 sm:p-8"
              @click="commentsOpen = true"
            >
              <span>
                <span class="text-label block text-muted-foreground">Discussion</span>
                <span class="mt-2 block font-display text-2xl font-semibold tracking-tight">
                  {{ engagement?.comments.length ? `Read ${engagement.comments.length} ${engagement.comments.length === 1 ? 'comment' : 'comments'}` : 'Be the first to comment' }}
                </span>
                <span class="mt-1 block text-sm text-muted-foreground">Questions, corrections and better links are all welcome.</span>
              </span>
              <span class="grid size-14 shrink-0 place-items-center rounded-full bg-foreground text-background transition-transform duration-500 ease-out-expo group-hover/discuss:rotate-[-8deg] group-hover/discuss:scale-105">
                <svg viewBox="0 0 24 24" class="size-6 fill-none stroke-current" stroke-width="1.8" aria-hidden="true"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" stroke-linejoin="round" /></svg>
              </span>
            </button>
          </FadeIn>

          <FadeIn class="mt-8">
            <AuthorCard />
          </FadeIn>
        </div>

        <aside class="hidden lg:col-span-3 lg:col-start-10 lg:block">
          <div class="sticky top-28">
            <PostToc :entries="toc" :active="active" :progress="progress" :minutes-left="minutesLeft" :color="post.color" />
          </div>
        </aside>
      </div>
    </article>

    <section v-if="related?.length" class="border-t border-border" aria-labelledby="related-title">
      <div class="section-y container-page">
        <div class="flex flex-wrap items-end justify-between gap-6">
          <h2 id="related-title" class="font-display text-display-sm">Keep reading</h2>
          <ArrowLink to="/blog" label="All articles" />
        </div>
        <ul class="mt-12 grid gap-x-6 gap-y-14 md:grid-cols-2">
          <li v-for="item in related" :key="item.slug">
            <FadeIn><PostCard :post="item" heading-level="h3" /></FadeIn>
          </li>
        </ul>
      </div>
    </section>

    <PostActions
      layout="bar"
      :visible="barVisible"
      :hearted="engagement?.hearted ?? false"
      :hearts="engagement?.hearts ?? 0"
      :comments="engagement?.comments.length ?? 0"
      :title="post.title"
      :url="url"
      :summarizing="summaryOpen"
      @heart="onHeart"
      @comments="commentsOpen = true"
      @summarize="toggleSummary"
    />

    <CommentsDrawer
      v-model:open="commentsOpen"
      :slug="post.slug"
      :title="post.title"
      :comments="engagement?.comments ?? []"
      :shared="engagement?.shared ?? false"
      :loading="engagementPending"
    />
  </div>
</template>
