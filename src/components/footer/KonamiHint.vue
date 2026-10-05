<script setup lang="ts">
import { TrophyIcon } from '@lucide/vue'
import { h } from 'vue'
import { toast } from 'vue-sonner'

import { KONAMI_CODE, useKonamiCode } from '@/composables/useKonamiCode'

/**
 * A nod for PC gamers: the Konami code, printed small. Each key lights up as it's typed;
 * finishing it unlocks an achievement.
 */
const glyphs: Record<(typeof KONAMI_CODE)[number], string> = {
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→',
  b: 'B',
  a: 'A',
}

const AchievementIcon = () => h(TrophyIcon, { class: 'size-4 text-primary' })

const { progress } = useKonamiCode(() => {
  toast('Achievement unlocked', {
    description: 'Old school — you know the code. +30 lives.',
    icon: AchievementIcon,
  })
})
</script>

<template>
  <span class="inline-flex items-center gap-[0.35em]" title="You know what to do">
    <span class="sr-only">Konami code: up, up, down, down, left, right, left, right, B, A</span>
    <span
      v-for="(key, index) in KONAMI_CODE"
      :key="index"
      class="inline-block transition-[color,transform] duration-300 ease-out-expo"
      :class="index < progress ? '-translate-y-0.5 text-volt' : 'opacity-70'"
      aria-hidden="true"
    >
      {{ glyphs[key] }}
    </span>
  </span>
</template>
