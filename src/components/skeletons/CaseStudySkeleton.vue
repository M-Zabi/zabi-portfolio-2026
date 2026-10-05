<script setup lang="ts">
import { Skeleton } from '@/components/ui/skeleton'
</script>

<template>
  <div
    class="container-page pt-[calc(var(--header-h)+clamp(3rem,2rem+6vw,8rem))] pb-24"
    aria-busy="true"
    aria-label="Loading case study"
  >
    <Skeleton class="h-3 w-40" />
    <Skeleton class="mt-8 h-[clamp(3rem,8vw,9rem)] w-3/4" />
    <Skeleton class="mt-8 h-6 w-full max-w-2xl" />
    <Skeleton class="mt-3 h-6 w-2/3 max-w-xl" />

    <div class="mt-14 grid grid-cols-2 gap-6 border-y border-border py-8 lg:grid-cols-4">
      <div v-for="index in 4" :key="index" class="space-y-3">
        <Skeleton class="h-3 w-16" />
        <Skeleton class="h-5 w-32" />
      </div>
    </div>

    <Skeleton class="mt-14 aspect-[16/9] w-full rounded-3xl" />
  </div>
</template>
