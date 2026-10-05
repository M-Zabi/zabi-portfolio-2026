<script setup lang="ts">
import { type MotionValue, motion, useTransform } from 'motion-v'

const props = defineProps<{
  progress: MotionValue<number>
  range: [start: number, end: number]
}>()

const opacity = useTransform(props.progress, props.range, [0.14, 1])
</script>

<template>
  <motion.span :style="{ opacity }"><slot /></motion.span>
</template>
