<script setup lang="ts">
import { useIntervalFn } from '@vueuse/core'
import { useInView, useReducedMotion } from 'motion-v'
import { computed, ref, useTemplateRef, watch } from 'vue'

import { site } from '@/config/site'
import { padIndex } from '@/lib/utils'

import BentoTile from './BentoTile.vue'

const steps = [
  { title: 'Discover', body: 'The job, the users, the constraint that matters.' },
  { title: 'Prototype', body: 'Clickable flows and motion studies in days.' },
  { title: 'Build', body: 'Typed, tested, shipped behind flags.' },
  { title: 'Refine', body: 'Measure, polish, hand over cleanly.' },
]

const root = useTemplateRef<HTMLElement>('root')
const inView = useInView(root, { amount: 0.4 })
const reducedMotion = useReducedMotion()
const active = ref(steps.length - 1)

const { pause, resume } = useIntervalFn(() => (active.value = (active.value + 1) % steps.length), 1800, {
  immediate: false,
})

watch(
  [inView, reducedMotion],
  ([visible, reduced]) => {
    if (visible && !reduced) {
      active.value = 0
      resume()
    } else {
      pause()
      if (reduced) active.value = steps.length - 1
    }
  },
  { immediate: true },
)

const progress = computed(() => active.value / (steps.length - 1))
</script>

<template>
  <BentoTile :delay="0.16">
    <div ref="root" class="flex h-full flex-col">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <p class="text-label text-muted-foreground">(F) Workflow</p>
        <p class="text-label text-muted-foreground">Typical engagement · {{ site.typicalEngagement }}</p>
      </div>

      <ol class="relative mt-auto grid grid-cols-2 gap-x-6 gap-y-8 pt-10 sm:grid-cols-4">
        <span class="absolute top-[calc(2.5rem+0.75rem)] right-3 left-3 hidden h-px bg-border sm:block" aria-hidden="true">
          <span
            class="absolute inset-0 origin-left bg-primary transition-transform duration-700 ease-out-quint"
            :style="{ transform: `scaleX(${progress})` }"
          />
        </span>
        <li v-for="(step, index) in steps" :key="step.title" :aria-current="index === active ? 'step' : undefined">
          <span
            class="relative z-10 grid size-6 place-items-center rounded-full border text-[0.625rem] font-semibold tabular transition-colors duration-300"
            :class="
              index <= active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground'
            "
          >
            {{ padIndex(index + 1) }}
          </span>
          <p class="mt-4 font-display text-xl font-semibold tracking-tight">{{ step.title }}</p>
          <p class="mt-1 text-sm text-muted-foreground">{{ step.body }}</p>
        </li>
      </ol>
    </div>
  </BentoTile>
</template>
