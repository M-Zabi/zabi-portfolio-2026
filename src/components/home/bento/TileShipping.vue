<script setup lang="ts">
import { site } from '@/config/site'

import BentoTile from './BentoTile.vue'

const destinations = site.shippedTo
</script>

<template>
  <BentoTile tone="mint" :delay="0.12">
    <p class="text-label opacity-70">(E) Shipped to</p>
    <div class="mt-auto flex flex-col gap-6 pt-10 lg:flex-row lg:items-end lg:justify-between">
      <h3 class="max-w-[16ch] font-display text-display-sm">Both app stores, every desktop, the whole web.</h3>
      <ul class="flex max-w-xl flex-wrap gap-2 lg:justify-end">
        <li
          v-for="destination in destinations"
          :key="destination"
          class="rounded-full border border-mint-foreground/30 px-4 py-2 font-medium transition-colors duration-200 hover:bg-mint-foreground hover:text-mint"
        >
          {{ destination }}
        </li>
      </ul>
    </div>
  </BentoTile>
</template>
