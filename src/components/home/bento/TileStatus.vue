<script setup lang="ts">
import LocalTime from '@/components/common/LocalTime.vue'
import StatusDot from '@/components/common/StatusDot.vue'
import { useLocalTime } from '@/composables/useLocalTime'
import { site } from '@/config/site'

import BentoTile from './BentoTile.vue'

const { zone } = useLocalTime()
</script>

<template>
  <BentoTile :delay="0.12">
    <div class="flex items-center justify-between gap-4">
      <p class="text-label text-muted-foreground">(C) Right now</p>
      <span class="text-label inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5">
        <StatusDot />
        {{ site.availability.open ? 'Available' : 'Booked' }}
      </span>
    </div>
    <div class="mt-auto flex flex-wrap items-end justify-between gap-6 pt-10">
      <div>
        <p class="font-display text-display-md"><LocalTime :show-zone="false" /></p>
        <p class="text-label mt-3 text-muted-foreground">{{ zone }} · {{ site.location }}</p>
      </div>
      <p class="max-w-[22ch] text-sm text-muted-foreground sm:text-right">
        {{ site.availability.label }}. {{ site.replyTime }}.
      </p>
    </div>
  </BentoTile>
</template>
