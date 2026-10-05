<script setup lang="ts">
import { markPieces, markViewBox } from '@/lib/mark'

/**
 * The MZ monogram as SVG. Size it with a height class; the width follows the viewBox.
 *
 * - `explode`: strokes drift apart while an ancestor `group/mark` is hovered.
 * - `spread`: a static drift multiplier (0 = assembled), e.g. the scattered 404 mark.
 */
const props = withDefaults(defineProps<{ explode?: boolean; spread?: number }>(), {
  explode: false,
  spread: 0,
})

/** Static class strings so Tailwind can see them; one per stroke, in markPieces order. */
const explodeClasses = [
  'group-hover/mark:-translate-x-[4px] group-hover/mark:translate-y-[4px]',
  'group-hover/mark:-translate-x-[3px] group-hover/mark:-translate-y-[4px]',
  'group-hover/mark:-translate-x-[1px] group-hover/mark:translate-y-[4px]',
  'group-hover/mark:-translate-x-[1px] group-hover/mark:-translate-y-[5px]',
  'group-hover/mark:translate-x-[3px] group-hover/mark:-translate-y-[1px]',
  'group-hover/mark:translate-x-[5px] group-hover/mark:translate-y-[4px]',
]

const spreadStyle = (drift: readonly [number, number]) =>
  props.spread ? { translate: `${drift[0] * props.spread}px ${drift[1] * props.spread}px` } : undefined
</script>

<template>
  <svg :viewBox="markViewBox" class="overflow-visible" fill="currentColor" aria-hidden="true">
    <path
      v-for="(piece, index) in markPieces"
      :key="piece.id"
      :d="piece.d"
      class="transition-[translate] duration-700 ease-out-expo"
      :class="explode && explodeClasses[index]"
      :style="spreadStyle(piece.drift)"
    />
  </svg>
</template>
