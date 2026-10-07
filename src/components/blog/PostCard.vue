<script setup lang="ts">
import { ArrowUpRightIcon } from '@lucide/vue'
import { computed } from 'vue'

import { categoryLabel, readingMinutes } from '@/lib/blog'
import { cn } from '@/lib/utils'
import type { Post } from '@/types/blog'

import PostCover from './PostCover.vue'
import PostMeta from './PostMeta.vue'

const props = withDefaults(defineProps<{ post: Post; featured?: boolean; headingLevel?: 'h2' | 'h3' }>(), {
  featured: false,
  headingLevel: 'h2',
})

const minutes = computed(() => readingMinutes(props.post))
</script>

<template>
  <RouterLink
    :to="{ name: 'post', params: { slug: post.slug } }"
    class="group/card block rounded-3xl focus-visible:outline-offset-8"
    :class="featured && 'grid items-center gap-8 lg:grid-cols-12 lg:gap-12'"
    draggable="false"
  >
    <div class="relative overflow-hidden rounded-3xl" :class="featured && 'lg:col-span-7'">
      <PostCover
        :kind="post.cover"
        :color="post.color"
        :class="cn('aspect-[4/3] transition-transform duration-[1200ms] ease-out-expo group-hover/card:scale-[1.03]', featured && 'lg:aspect-[16/11]')"
      />
      <span class="text-label absolute top-4 left-4 rounded-full bg-background/90 px-3 py-1.5 text-foreground backdrop-blur-md">
        {{ categoryLabel[post.category] }}
      </span>
      <span
        v-if="featured"
        class="text-label absolute top-4 right-4 rounded-full bg-ink px-3 py-1.5 text-paper"
      >
        Latest
      </span>
    </div>

    <div :class="featured ? 'lg:col-span-5' : 'mt-5'">
      <PostMeta :date="post.publishedAt" :minutes="minutes" class="text-muted-foreground" />
      <component
        :is="headingLevel"
        class="mt-3 font-display tracking-tight"
        :class="featured ? 'text-display-md' : 'text-[clamp(1.4rem,1.15rem+0.8vw,1.85rem)] leading-[1.1] font-semibold'"
      >
        <span class="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_2px] bg-left-bottom bg-no-repeat transition-[background-size] duration-500 ease-out-expo group-hover/card:bg-[length:100%_2px]">{{ post.title }}</span>
      </component>
      <p class="mt-3 max-w-[52ch] text-muted-foreground" :class="featured && 'text-lead'">{{ featured ? post.dek : post.excerpt }}</p>
      <span
        class="mt-6 inline-flex items-center gap-2 text-sm font-semibold"
        aria-hidden="true"
      >
        Read article
        <span class="grid size-8 place-items-center rounded-full border border-border transition-colors duration-300 group-hover/card:border-foreground group-hover/card:bg-foreground group-hover/card:text-background">
          <ArrowUpRightIcon class="size-4 transition-transform duration-500 ease-out-expo group-hover/card:rotate-45" />
        </span>
      </span>
    </div>
  </RouterLink>
</template>
