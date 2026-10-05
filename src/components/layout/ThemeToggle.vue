<script setup lang="ts">
import { MoonIcon, SunIcon } from '@lucide/vue'
import { AnimatePresence, motion } from 'motion-v'

import { useTheme } from '@/composables/useTheme'
import { spring } from '@/lib/motion'
import { cn } from '@/lib/utils'

const props = defineProps<{ class?: string }>()

const { isDark, toggle } = useTheme()

function onClick(event: MouseEvent) {
  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  void toggle({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
}
</script>

<template>
  <button
    type="button"
    :class="
      cn(
        'relative grid size-11 place-items-center overflow-hidden rounded-full border border-border bg-background/80 text-foreground backdrop-blur-md transition-colors duration-200 hover:bg-accent',
        props.class,
      )
    "
    :aria-label="isDark ? 'Switch to light theme' : 'Switch to dark theme'"
    :aria-pressed="isDark"
    @click="onClick"
  >
    <AnimatePresence :initial="false" mode="popLayout">
      <motion.span
        :key="isDark ? 'moon' : 'sun'"
        class="col-start-1 row-start-1 grid place-items-center"
        :initial="{ y: 18, rotate: -60, opacity: 0 }"
        :animate="{ y: 0, rotate: 0, opacity: 1 }"
        :exit="{ y: -18, rotate: 60, opacity: 0 }"
        :transition="spring.snappy"
      >
        <MoonIcon v-if="isDark" class="size-4" />
        <SunIcon v-else class="size-4" />
      </motion.span>
    </AnimatePresence>
  </button>
</template>
