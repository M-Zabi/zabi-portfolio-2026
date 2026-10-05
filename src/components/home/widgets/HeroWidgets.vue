<script setup lang="ts">
import ControllerWidget from './ControllerWidget.vue'
import MusicWidget from './MusicWidget.vue'
import ProverbWidget from './ProverbWidget.vue'
import WeatherWidget from './WeatherWidget.vue'

/**
 * The hero's bento of live mini widgets. Phones: music across the top, the controller down the
 * left, weather and proverb stacked beside it. Wider: the controller holds the left column and
 * music spans the top right.
 */
</script>

<template>
  <div
    data-hero-widgets
    class="grid grid-cols-2 gap-2.5 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)] sm:grid-rows-[repeat(2,7rem)]"
  >
    <ControllerWidget :delay="0.7" class="row-span-2 min-h-60 sm:min-h-0" />
    <MusicWidget :delay="0.6" class="order-first col-span-2 sm:order-none" />
    <WeatherWidget :delay="0.78" class="min-h-28 sm:min-h-0" />
    <ProverbWidget :delay="0.86" class="min-h-32 sm:min-h-0" />
  </div>
</template>
