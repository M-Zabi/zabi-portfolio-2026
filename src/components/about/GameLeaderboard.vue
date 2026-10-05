<script setup lang="ts">
import { useInView } from 'motion-v'
import { computed, useTemplateRef } from 'vue'

import StatusDot from '@/components/common/StatusDot.vue'
import FadeIn from '@/components/motion/FadeIn.vue'
import { usePageReady } from '@/composables/usePageReady'
import { games } from '@/content/profile'
import { brandVar } from '@/lib/brand'
import { padIndex } from '@/lib/utils'

/**
 * Most-played games as a leaderboard. Each row's bottom edge is a bar sized by hours played
 * that draws in on scroll; on hover the bar floods the whole row in the game's colour.
 */
const ranked = [...games].sort((a, b) => b.hours - a.hours)
const most = ranked[0]?.hours ?? 1
const total = games.reduce((sum, game) => sum + game.hours, 0)
const formatHours = new Intl.NumberFormat('en').format

const list = useTemplateRef<HTMLElement>('list')
const inView = useInView(list, { once: true, margin: '0px 0px -10% 0px' })
const pageReady = usePageReady()
const filled = computed(() => pageReady.value && inView.value)
</script>

<template>
  <div>
    <p class="text-label flex justify-between border-b border-border pb-3 text-muted-foreground">
      <span>(Most played)</span>
      <span>Hours</span>
    </p>

    <ol ref="list" :data-filled="filled || undefined">
      <li
        v-for="(game, index) in ranked"
        :key="game.title"
        class="game-row relative border-b border-border"
        :style="{
          '--tone': brandVar(game.color),
          '--tone-on': `var(--${game.color}-foreground)`,
          '--share': game.hours / most,
          '--index': index,
        }"
      >
        <span class="game-flood" aria-hidden="true" />
        <span class="game-bar" aria-hidden="true" />

        <FadeIn
          :delay="index * 0.05"
          :y="16"
          class="game-content relative grid grid-cols-[2rem_1fr_auto] items-baseline gap-x-4 py-5 sm:grid-cols-[2.5rem_1fr_auto] md:px-4"
        >
          <span class="text-label tabular text-muted-foreground">{{ padIndex(index + 1) }}</span>
          <div>
            <h3 class="flex flex-wrap items-center gap-x-3 gap-y-2 font-display text-xl font-semibold tracking-tight sm:text-2xl">
              {{ game.title }}
              <span
                v-if="game.current"
                class="text-label inline-flex items-center gap-2 rounded-full border border-current/20 px-2.5 py-1"
              >
                <StatusDot />
                Now playing
              </span>
            </h3>
            <p class="mt-1 text-sm text-muted-foreground">{{ game.genre }}</p>
          </div>
          <p class="font-display text-xl font-semibold tabular sm:text-2xl">
            {{ formatHours(game.hours) }}<span class="sr-only"> hours</span>
          </p>
        </FadeIn>
      </li>
    </ol>

    <p class="text-label mt-4 flex justify-between gap-4 text-muted-foreground">
      <span>Total logged</span>
      <span class="tabular">{{ formatHours(total) }} h — and counting</span>
    </p>
  </div>
</template>

<style scoped>
/* Hours bar along the row's bottom edge — draws in, staggered, once the list is on screen. */
.game-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  width: calc(var(--share) * 100%);
  background: var(--tone);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 1.1s var(--ease-out-expo) calc(var(--index) * 70ms + 150ms);
}

[data-filled] .game-bar {
  transform: scaleX(1);
}

/*
 * Hover flood: starts clipped to exactly the bar's shape, then opens to the whole row.
 * It turns visible instantly on enter and only after the clip has closed on leave.
 */
.game-flood {
  position: absolute;
  inset: 0;
  background: var(--tone);
  opacity: 0;
  clip-path: inset(calc(100% - 3px) calc(100% - var(--share) * 100%) 0 0);
  transition:
    clip-path 0.55s var(--ease-out-expo),
    opacity 0s linear 0.55s;
}

.game-content,
.game-content :deep(*) {
  transition: color 0.3s var(--ease-out-quint);
}

@media (hover: hover) {
  .game-row:hover .game-flood {
    opacity: 1;
    clip-path: inset(0);
    transition:
      clip-path 0.55s var(--ease-out-expo),
      opacity 0s;
  }

  .game-row:hover .game-content,
  .game-row:hover .game-content :deep(*) {
    color: var(--tone-on);
  }
}
</style>
