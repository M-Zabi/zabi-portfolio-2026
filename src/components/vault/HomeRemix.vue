<script setup lang="ts">
import { useHomeBaseOverride } from '@/composables/useHomeBase'
import type { HomeRemixPage } from '@/types/vault'
import HomeView from '@/views/HomeView.vue'

/** The landing page with a private headline and home town, for as long as it is mounted. */
const props = defineProps<{ page: HomeRemixPage }>()

useHomeBaseOverride(props.page.home)
</script>

<template>
  <HomeView embedded :hero="{ lines: page.heroLines, words: page.words }" />
</template>
