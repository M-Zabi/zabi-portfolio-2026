<script setup lang="ts">
import { Skeleton } from '@/components/ui/skeleton'
</script>

<template>
  <div aria-busy="true" aria-label="Loading articles">
    <div class="grid items-center gap-8 lg:grid-cols-12 lg:gap-12">
      <Skeleton class="aspect-[4/3] rounded-3xl lg:col-span-7 lg:aspect-[16/11]" />
      <div class="space-y-4 lg:col-span-5">
        <Skeleton class="h-3 w-40" />
        <Skeleton class="h-16 w-full" />
        <Skeleton class="h-5 w-4/5" />
      </div>
    </div>
    <div class="mt-20 grid gap-x-6 gap-y-14 md:grid-cols-2 xl:grid-cols-3">
      <div v-for="index in 3" :key="index">
        <Skeleton class="aspect-[4/3] rounded-3xl" />
        <Skeleton class="mt-5 h-3 w-32" />
        <Skeleton class="mt-3 h-8 w-full" />
        <Skeleton class="mt-3 h-4 w-3/4" />
      </div>
    </div>
  </div>
</template>
