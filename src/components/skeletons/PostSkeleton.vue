<script setup lang="ts">
import { Skeleton } from '@/components/ui/skeleton'
</script>

<template>
  <div aria-busy="true" aria-label="Loading article">
    <div class="relative">
      <div class="absolute inset-x-0 top-0 bottom-[30%] bg-muted lg:bottom-0 lg:left-[44%]" />
      <div class="container-page relative grid gap-10 pt-[calc(var(--header-h)+2rem)] pb-14 lg:grid-cols-12 lg:pt-[calc(var(--header-h)+4.5rem)] lg:pb-24">
        <Skeleton class="aspect-[4/3] rounded-3xl lg:col-span-6" />
        <div class="order-first space-y-5 lg:order-none lg:col-span-5 lg:col-start-8 lg:self-center">
          <Skeleton class="h-3 w-28 bg-background/50" />
          <Skeleton class="h-14 w-full bg-background/50" />
          <Skeleton class="h-14 w-4/5 bg-background/50" />
          <Skeleton class="h-5 w-3/4 bg-background/50" />
          <Skeleton class="h-12 w-56 rounded-full bg-background/50" />
        </div>
      </div>
    </div>
    <div class="container-page grid pt-14 lg:grid-cols-12">
      <div class="space-y-4 lg:col-span-7 lg:col-start-3">
        <Skeleton v-for="width in [100, 96, 100, 88, 94, 72]" :key="width" class="h-5" :style="{ width: `${width}%` }" />
      </div>
    </div>
  </div>
</template>
