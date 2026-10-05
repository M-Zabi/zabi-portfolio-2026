<script setup lang="ts">
import { Skeleton } from '@/components/ui/skeleton'

withDefaults(defineProps<{ count?: number }>(), { count: 4 })
</script>

<template>
  <div class="grid gap-x-6 gap-y-16 md:grid-cols-2" aria-busy="true" aria-label="Loading projects">
    <div v-for="index in count" :key="index">
      <Skeleton class="aspect-[4/3] w-full rounded-2xl" />
      <div class="mt-5 flex items-start justify-between gap-6">
        <div class="flex-1 space-y-3">
          <Skeleton class="h-3 w-1/3" />
          <Skeleton class="h-8 w-1/2" />
          <Skeleton class="h-4 w-4/5" />
        </div>
        <Skeleton class="size-12 rounded-full" />
      </div>
    </div>
  </div>
</template>
