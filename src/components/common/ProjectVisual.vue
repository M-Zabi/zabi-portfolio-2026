<script setup lang="ts">
import { computed } from 'vue'

import { blockClass, brandVar } from '@/lib/brand'
import { cn } from '@/lib/utils'
import type { Project } from '@/types/content'

import AppImage from './AppImage.vue'

/**
 * Project artwork. Uses `project.cover` when provided; otherwise renders a device
 * composition (phones, browser or desktop window) in the project's brand colour, so the
 * portfolio looks finished before real screenshots exist.
 *
 * Reads `--parallax` from an ancestor (the carousel sets it) to drift the devices.
 */
const props = withDefaults(defineProps<{ project: Project; class?: string; eager?: boolean }>(), {
  class: undefined,
  eager: false,
})

const tint = computed(() => brandVar(props.project.color))
const screenStyle = computed(() => ({
  '--tint': tint.value,
  '--tint-soft': `color-mix(in oklch, ${tint.value} 35%, var(--paper))`,
  '--tint-strong': `color-mix(in oklch, ${tint.value} 80%, var(--ink))`,
}))
const label = computed(() => `${props.project.title} — ${props.project.category} interface preview`)
</script>

<template>
  <div
    :class="cn('group/visual grain relative isolate aspect-[4/3] overflow-hidden', blockClass[project.color], props.class)"
    :style="screenStyle"
    role="img"
    :aria-label="label"
  >
    <AppImage v-if="project.cover" :src="project.cover" :alt="label" :eager="eager" class="absolute inset-0" />

    <template v-else>
      <span
        class="pointer-events-none absolute -bottom-[0.2em] -left-[0.04em] font-display text-[clamp(4rem,14vw,12rem)] leading-none font-bold whitespace-nowrap opacity-[0.09] [font-stretch:125%]"
        aria-hidden="true"
      >
        {{ project.title }}
      </span>

      <div class="device-stage absolute inset-0 grid place-items-center" aria-hidden="true">
        <!-- Two phones -->
        <!-- Explicit width + height: phones size from height × aspect, which collapses in a shrink-to-fit box. -->
        <div v-if="project.visual === 'phone'" class="flex h-[76%] w-[64%] translate-y-[6%] items-end justify-center gap-[6%]">
          <div
            v-for="(phone, index) in 2"
            :key="phone"
            class="aspect-[9/19] h-full w-auto shrink-0 rounded-[14%/6.6%] bg-ink p-[3%] shadow-[0_30px_60px_-20px_rgb(0_0_0/0.5)] transition-transform duration-1000 ease-out-expo"
            :class="
              index === 0
                ? 'z-10 -rotate-6 group-hover/visual:-translate-y-[3%] group-hover/visual:-rotate-8'
                : 'h-[88%] rotate-5 group-hover/visual:translate-y-[2%] group-hover/visual:rotate-7'
            "
          >
            <div class="flex size-full flex-col gap-[4%] overflow-hidden rounded-[11%/5.2%] bg-paper p-[8%]">
              <div class="mx-auto h-[3%] w-[34%] shrink-0 rounded-full bg-ink" />
              <div class="mt-[6%] h-[5%] w-[62%] shrink-0 rounded-sm bg-ink/85" />
              <div class="h-[2.5%] w-[82%] shrink-0 rounded-sm bg-ink/20" />
              <div v-if="index === 0" class="relative flex-1 overflow-hidden rounded-[10%] bg-(--tint-soft)">
                <svg viewBox="0 0 100 60" preserveAspectRatio="none" class="absolute inset-x-0 bottom-0 h-3/4 w-full">
                  <path d="M0 48 C 18 40, 26 14, 44 22 S 72 6, 100 12 L 100 60 L 0 60 Z" fill="var(--tint)" />
                  <path
                    d="M0 48 C 18 40, 26 14, 44 22 S 72 6, 100 12"
                    fill="none"
                    stroke="var(--ink)"
                    stroke-width="1.6"
                    vector-effect="non-scaling-stroke"
                  />
                </svg>
              </div>
              <div v-else class="grid flex-1 grid-cols-2 gap-[6%]">
                <div v-for="tile in 4" :key="tile" class="rounded-[14%]" :class="tile === 1 ? 'bg-(--tint)' : 'bg-ink/8'" />
              </div>
              <div class="grid shrink-0 grid-cols-3 gap-[6%]">
                <div v-for="tile in 3" :key="tile" class="aspect-square rounded-[22%] bg-ink/8" />
              </div>
              <div class="h-[7%] shrink-0 rounded-full bg-ink" />
            </div>
          </div>
        </div>

        <!-- Browser -->
        <div
          v-else-if="project.visual === 'browser'"
          class="w-[84%] translate-y-[8%] overflow-hidden rounded-[1.6%/2.6%] bg-paper shadow-[0_40px_80px_-30px_rgb(0_0_0/0.55)] ring-1 ring-ink/10 transition-transform duration-1000 ease-out-expo group-hover/visual:translate-y-[4%]"
        >
          <div class="flex h-7 items-center gap-1.5 border-b border-ink/10 bg-ink/[0.04] px-3 sm:h-8">
            <span class="size-2 rounded-full bg-ink/20" />
            <span class="size-2 rounded-full bg-ink/20" />
            <span class="size-2 rounded-full bg-ink/20" />
            <span class="mx-auto h-3 w-2/5 rounded-full bg-ink/8" />
          </div>
          <div class="grid aspect-[16/9] grid-cols-[22%_1fr]">
            <div class="flex flex-col gap-[7%] border-r border-ink/10 p-[10%]">
              <div class="h-[5%] w-3/4 rounded-sm bg-ink/80" />
              <div v-for="row in 5" :key="row" class="h-[3.5%] rounded-sm" :class="row === 2 ? 'bg-(--tint) w-full' : 'w-4/5 bg-ink/12'" />
            </div>
            <div class="flex flex-col gap-[4%] p-[4%]">
              <div class="grid grid-cols-3 gap-[3%]">
                <div v-for="tile in 3" :key="tile" class="flex h-[3.2vw] max-h-16 min-h-8 flex-col justify-center gap-1 rounded-md px-[8%]" :class="tile === 1 ? 'bg-(--tint)' : 'bg-ink/[0.05]'">
                  <span class="h-1 w-1/3 rounded-full bg-ink/30" />
                  <span class="h-1.5 w-2/3 rounded-full bg-ink/80" />
                </div>
              </div>
              <div class="relative flex-1 overflow-hidden rounded-md bg-ink/[0.03]">
                <svg viewBox="0 0 100 50" preserveAspectRatio="none" class="absolute inset-0 size-full">
                  <path d="M0 40 C 14 36, 22 18, 36 24 S 58 34, 70 18 S 90 8, 100 10 L 100 50 L 0 50 Z" fill="var(--tint-soft)" />
                  <path
                    d="M0 40 C 14 36, 22 18, 36 24 S 58 34, 70 18 S 90 8, 100 10"
                    fill="none"
                    stroke="var(--tint-strong)"
                    stroke-width="1.6"
                    vector-effect="non-scaling-stroke"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- Desktop window -->
        <div
          v-else
          class="w-[82%] translate-y-[6%] overflow-hidden rounded-[1.4%/2.2%] bg-ink text-paper shadow-[0_40px_80px_-30px_rgb(0_0_0/0.6)] transition-transform duration-1000 ease-out-expo group-hover/visual:translate-y-[2%]"
        >
          <div class="flex h-7 items-center gap-1.5 px-3 sm:h-8">
            <span class="size-2.5 rounded-full bg-ember" />
            <span class="size-2.5 rounded-full bg-volt" />
            <span class="size-2.5 rounded-full bg-mint" />
            <span class="mx-auto h-1.5 w-1/5 rounded-full bg-paper/15" />
          </div>
          <div class="grid aspect-[16/9.5] grid-cols-[24%_1fr] border-t border-paper/10">
            <div class="flex flex-col gap-[8%] border-r border-paper/10 p-[9%]">
              <div v-for="row in 6" :key="row" class="flex items-center gap-[10%]">
                <span class="size-2 shrink-0 rounded-sm" :class="row === 1 ? 'bg-(--tint)' : 'bg-paper/20'" />
                <span class="h-1.5 flex-1 rounded-full" :class="row === 1 ? 'bg-paper/70' : 'bg-paper/15'" />
              </div>
            </div>
            <div class="relative overflow-hidden">
              <svg viewBox="0 0 100 60" class="absolute inset-0 size-full" fill="none">
                <path d="M24 18 C 40 18, 40 34, 56 34" stroke="var(--tint)" stroke-width="0.7" />
                <path d="M24 44 C 40 44, 40 34, 56 34" stroke="currentColor" stroke-opacity="0.3" stroke-width="0.7" />
                <path d="M72 34 C 80 34, 80 22, 88 22" stroke="var(--tint)" stroke-width="0.7" />
              </svg>
              <div class="absolute top-[22%] left-[8%] h-[16%] w-[18%] rounded-md bg-paper/10 ring-1 ring-paper/15" />
              <div class="absolute top-[64%] left-[8%] h-[16%] w-[18%] rounded-md bg-paper/10 ring-1 ring-paper/15" />
              <div class="absolute top-[47%] left-[54%] h-[18%] w-[22%] rounded-md bg-(--tint) ring-1 ring-paper/20" />
              <div class="absolute top-[28%] left-[86%] h-[16%] w-[12%] rounded-md bg-paper/10 ring-1 ring-paper/15" />
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.device-stage {
  translate: var(--parallax, 0%) 0;
  transition: translate 0.1s linear;
}
</style>
