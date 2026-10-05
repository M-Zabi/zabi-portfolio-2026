<script setup lang="ts">
import MarqueeTrack from '@/components/motion/MarqueeTrack.vue'
import { marqueeStack } from '@/content/profile'

import BentoTile from './BentoTile.vue'

const reversed = [...marqueeStack].reverse()
</script>

<template>
  <BentoTile tone="volt" :delay="0.06">
    <p class="text-label opacity-70">(B) Daily drivers</p>
    <ul class="sr-only">
      <li v-for="item in marqueeStack" :key="item">{{ item }}</li>
    </ul>
    <div class="-mx-6 mt-auto flex flex-col gap-1 pt-10 sm:-mx-8" aria-hidden="true">
      <MarqueeTrack :duration="30">
        <span
          v-for="item in marqueeStack"
          :key="item"
          class="flex items-center gap-5 pr-5 font-display text-[clamp(1.75rem,1.2rem+1.6vw,2.6rem)] font-semibold tracking-[-0.03em]"
        >
          {{ item }}<span class="opacity-30">/</span>
        </span>
      </MarqueeTrack>
      <MarqueeTrack :duration="36" reverse>
        <span
          v-for="item in reversed"
          :key="item"
          class="flex items-center gap-5 pr-5 font-display text-[clamp(1.75rem,1.2rem+1.6vw,2.6rem)] font-semibold tracking-[-0.03em] text-transparent [-webkit-text-stroke:1px_var(--volt-foreground)]"
        >
          {{ item }}<span class="opacity-30">/</span>
        </span>
      </MarqueeTrack>
    </div>
  </BentoTile>
</template>
