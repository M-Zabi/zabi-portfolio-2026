<script setup lang="ts">
import { computed } from 'vue'

/**
 * Hover "roll": the label slides up and a copy rolls in from below, letter by letter.
 * Triggered by any ancestor with the `roll-trigger` class (hover or keyboard focus).
 */
const props = defineProps<{ text: string }>()
const chars = computed(() => Array.from(props.text).map((char) => (char === ' ' ? ' ' : char)))
</script>

<template>
  <span class="roll relative inline-flex overflow-hidden">
    <span class="sr-only">{{ text }}</span>
    <span aria-hidden="true" class="roll-layer roll-layer-current inline-flex">
      <span v-for="(char, index) in chars" :key="index" class="roll-char" :style="{ '--i': index }">{{
        char
      }}</span>
    </span>
    <span aria-hidden="true" class="roll-layer roll-layer-next absolute inset-0 inline-flex">
      <span v-for="(char, index) in chars" :key="index" class="roll-char" :style="{ '--i': index }">{{
        char
      }}</span>
    </span>
  </span>
</template>

<!--
  Deliberately unscoped: the trigger is an ancestor in another component. Vue's scoped
  `:global(.a) .b` compiles to just `.a` (it drops the descendant part), which silently broke
  this effect — so these rules use their own `roll-` namespace instead.
-->
<style>
.roll-char {
  display: inline-block;
  transition: transform 0.6s var(--ease-out-quint);
  transition-delay: calc(var(--i) * 14ms);
}

.roll-layer-next .roll-char {
  transform: translateY(108%);
}

@media (hover: hover) {
  .roll-trigger:hover .roll-layer-current .roll-char {
    transform: translateY(-108%);
  }

  .roll-trigger:hover .roll-layer-next .roll-char {
    transform: translateY(0);
  }
}

.roll-trigger:focus-visible .roll-layer-current .roll-char {
  transform: translateY(-108%);
}

.roll-trigger:focus-visible .roll-layer-next .roll-char {
  transform: translateY(0);
}
</style>
