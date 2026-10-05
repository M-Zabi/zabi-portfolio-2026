<script setup lang="ts">
import { AnimatePresence, motion } from 'motion-v'
import { computed, ref } from 'vue'

import { ease, spring } from '@/lib/motion'

import BentoTile from './BentoTile.vue'

type Platform = 'Web' | 'iOS' | 'Android' | 'macOS' | 'Windows'

const platforms: { name: Platform; shell: string; device: 'browser' | 'phone' | 'window' }[] = [
  { name: 'Web', shell: 'Vue · React', device: 'browser' },
  { name: 'iOS', shell: 'React Native', device: 'phone' },
  { name: 'Android', shell: 'React Native', device: 'phone' },
  { name: 'macOS', shell: 'Tauri', device: 'window' },
  { name: 'Windows', shell: 'Electron', device: 'window' },
]

const active = ref<Platform>('iOS')
const current = computed(() => platforms.find((platform) => platform.name === active.value)!)
</script>

<template>
  <BentoTile tone="cobalt" :delay="0.08">
    <p class="text-label opacity-70">(D) One codebase</p>

    <div class="mt-5 flex flex-wrap gap-1 rounded-2xl bg-cobalt-foreground/10 p-1" role="group" aria-label="Preview a platform">
      <button
        v-for="platform in platforms"
        :key="platform.name"
        type="button"
        class="relative min-h-10 flex-1 rounded-xl px-3 text-sm font-medium transition-colors duration-200"
        :class="active === platform.name ? 'text-cobalt' : 'hover:bg-cobalt-foreground/10'"
        :aria-pressed="active === platform.name"
        @click="active = platform.name"
      >
        <motion.span
          v-if="active === platform.name"
          layout-id="platform-pill"
          class="absolute inset-0 rounded-xl bg-cobalt-foreground"
          :transition="spring.snappy"
        />
        <span class="relative">{{ platform.name }}</span>
      </button>
    </div>

    <div class="relative mt-6 grid min-h-[15rem] flex-1 place-items-center" aria-hidden="true">
      <AnimatePresence mode="popLayout" :initial="false">
        <motion.div
          :key="current.device"
          class="col-start-1 row-start-1"
          :initial="{ opacity: 0, scale: 0.86, y: 16 }"
          :animate="{ opacity: 1, scale: 1, y: 0 }"
          :exit="{ opacity: 0, scale: 0.92, y: -12 }"
          :transition="{ duration: 0.5, ease: ease.outQuint }"
        >
          <div
            v-if="current.device === 'phone'"
            class="flex h-56 w-28 flex-col gap-2 rounded-[1.6rem] border-2 border-cobalt-foreground/80 p-3"
          >
            <span class="mx-auto h-1.5 w-8 rounded-full bg-cobalt-foreground/70" />
            <span class="mt-2 h-3 w-3/4 rounded-sm bg-cobalt-foreground/80" />
            <span class="h-1.5 w-full rounded-sm bg-cobalt-foreground/25" />
            <span class="flex-1 rounded-xl bg-cobalt-foreground/15" />
            <span class="h-6 rounded-full bg-cobalt-foreground/80" />
          </div>
          <div
            v-else
            class="flex aspect-[16/10.5] w-[min(17rem,62vw)] flex-col overflow-hidden rounded-lg border-2 border-cobalt-foreground/80"
          >
            <span class="flex h-5 items-center gap-1 border-b-2 border-cobalt-foreground/30 px-2">
              <span v-for="dot in 3" :key="dot" class="size-1.5 rounded-full bg-cobalt-foreground/60" />
              <span v-if="current.device === 'browser'" class="mx-auto h-1.5 w-1/3 rounded-full bg-cobalt-foreground/30" />
            </span>
            <span class="grid flex-1 grid-cols-[30%_1fr] gap-2 p-2">
              <span class="rounded bg-cobalt-foreground/15" />
              <span class="flex flex-col gap-2">
                <span class="h-2 w-2/3 rounded-sm bg-cobalt-foreground/80" />
                <span class="flex-1 rounded bg-cobalt-foreground/15" />
              </span>
            </span>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>

    <div class="mt-6">
      <p class="text-label opacity-70" aria-live="polite">{{ current.name }} — {{ current.shell }}</p>
      <h3 class="mt-3 font-display text-display-sm">One codebase, every screen.</h3>
      <p class="mt-3 opacity-80">
        A shared TypeScript core with native shells — React Native on phones, Tauri or Electron on desktops.
      </p>
    </div>
  </BentoTile>
</template>
