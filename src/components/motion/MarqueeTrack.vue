<script setup lang="ts">
/** Seamless CSS marquee. The duplicate copy is hidden from assistive tech. */
withDefaults(defineProps<{ duration?: number; reverse?: boolean; pauseOnHover?: boolean }>(), {
  duration: 32,
  reverse: false,
  pauseOnHover: true,
})
</script>

<template>
  <div class="group/marquee flex overflow-hidden" :style="{ '--marquee-duration': `${duration}s` }">
    <div
      class="animate-marquee flex w-max shrink-0"
      :class="[
        reverse && '[animation-direction:reverse]',
        pauseOnHover && 'group-hover/marquee:[animation-play-state:paused]',
      ]"
    >
      <div class="flex shrink-0 items-center"><slot /></div>
      <div class="flex shrink-0 items-center" aria-hidden="true"><slot /></div>
    </div>
  </div>
</template>
