<script setup lang="ts">
import { Skeleton } from '@/components/ui/skeleton'
</script>

<template>
  <div class="flex gap-6 overflow-hidden" aria-busy="true" aria-label="Loading selected work">
    <div v-for="index in 3" :key="index" class="w-[86%] shrink-0 sm:w-[64%] lg:w-[44%]">
      <Skeleton class="aspect-[4/3] w-full rounded-2xl" />
      <Skeleton class="mt-5 h-3 w-1/3" />
      <Skeleton class="mt-3 h-8 w-1/2" />
    </div>
  </div>
</template>
