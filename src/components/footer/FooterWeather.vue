<script setup lang="ts">
import {
  CloudDrizzleIcon,
  CloudFogIcon,
  CloudIcon,
  CloudLightningIcon,
  CloudMoonIcon,
  CloudMoonRainIcon,
  CloudRainIcon,
  CloudSnowIcon,
  CloudSunIcon,
  CloudSunRainIcon,
  MoonIcon,
  SunIcon,
} from '@lucide/vue'
import { type Component, computed } from 'vue'

import { Skeleton } from '@/components/ui/skeleton'
import { site } from '@/config/site'
import { describeWeather, type Sky } from '@/lib/weather'
import { useWeatherQuery } from '@/queries/weather'

/** Mini weather report for the home city: temperature, sky and today's high / low. */
const { data: weather, isError } = useWeatherQuery()

const icons: Record<Sky, [day: Component, night: Component]> = {
  clear: [SunIcon, MoonIcon],
  partly: [CloudSunIcon, CloudMoonIcon],
  cloudy: [CloudIcon, CloudIcon],
  fog: [CloudFogIcon, CloudFogIcon],
  drizzle: [CloudDrizzleIcon, CloudDrizzleIcon],
  rain: [CloudRainIcon, CloudRainIcon],
  showers: [CloudSunRainIcon, CloudMoonRainIcon],
  snow: [CloudSnowIcon, CloudSnowIcon],
  storm: [CloudLightningIcon, CloudLightningIcon],
}

const report = computed(() => {
  if (!weather.value) return null
  const { label, sky } = describeWeather(weather.value.code)
  return { label, icon: icons[sky][weather.value.isDay ? 0 : 1] }
})

const degrees = (value: number) => `${Math.round(value)}°`
</script>

<template>
  <div>
    <p class="text-label opacity-60">Weather · {{ site.home.city }}</p>

    <div v-if="weather && report" class="mt-3">
      <p class="flex items-center gap-2.5 font-display text-2xl font-semibold">
        <component
          :is="report.icon"
          class="size-6 shrink-0 text-volt"
          :stroke-width="1.75"
          aria-hidden="true"
        />
        <span class="tabular">{{ degrees(weather.temperature) }}C</span>
      </p>
      <p class="mt-1.5 text-sm font-medium opacity-80">
        {{ report.label }} ·
        <span class="tabular" aria-hidden="true"
          >H {{ degrees(weather.high) }} L {{ degrees(weather.low) }}</span
        >
        <span class="sr-only"
          >high {{ degrees(weather.high) }}, low {{ degrees(weather.low) }}</span
        >
      </p>
    </div>

    <p v-else-if="isError" class="mt-3 text-sm font-medium opacity-70">
      The forecast is offline right now.
    </p>

    <div v-else class="mt-3 space-y-2.5" aria-hidden="true">
      <Skeleton class="h-7 w-24 bg-paper/15 motion-reduce:animate-none" />
      <Skeleton class="h-4 w-36 bg-paper/10 motion-reduce:animate-none" />
    </div>
  </div>
</template>
