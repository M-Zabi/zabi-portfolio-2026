<script setup lang="ts">
import { computed } from 'vue'

import BentoTile from '@/components/home/bento/BentoTile.vue'
import { Skeleton } from '@/components/ui/skeleton'
import { site } from '@/config/site'
import { describeWeather } from '@/lib/weather'
import { useWeatherQuery } from '@/queries/weather'

import WeatherGlyph from './WeatherGlyph.vue'

/** Hero tile: live conditions in the home city (shares the footer's cached forecast). */
defineProps<{ delay?: number }>()

const { data: weather, isError } = useWeatherQuery()
const report = computed(() => (weather.value ? describeWeather(weather.value.code) : null))
const degrees = (value: number) => `${Math.round(value)}°`
</script>

<template>
  <BentoTile :delay="delay" content-class="justify-between rounded-2xl p-3 sm:p-3 xl:p-4">
    <div class="flex items-start justify-between gap-2">
      <p class="text-label truncate pt-0.5 text-muted-foreground">{{ site.home.city }}</p>
      <WeatherGlyph
        v-if="weather && report"
        :sky="report.sky"
        :day="weather.isDay"
        class="-mt-1.5 -mr-1.5 size-9 shrink-0 text-muted-foreground xl:size-10"
      />
    </div>

    <div v-if="weather && report">
      <p class="font-display text-[1.9rem] leading-none font-semibold tabular">{{ degrees(weather.temperature) }}</p>
      <p class="mt-1.5 truncate text-xs text-muted-foreground">
        {{ report.label }}
        <span class="tabular" aria-hidden="true">· H {{ degrees(weather.high) }} L {{ degrees(weather.low) }}</span>
        <span class="sr-only">, high {{ degrees(weather.high) }}, low {{ degrees(weather.low) }}</span>
      </p>
    </div>
    <p v-else-if="isError" class="text-xs text-muted-foreground">Forecast offline.</p>
    <div v-else class="space-y-2" aria-hidden="true">
      <Skeleton class="h-7 w-14 motion-reduce:animate-none" />
      <Skeleton class="h-3 w-20 motion-reduce:animate-none" />
    </div>
  </BentoTile>
</template>
