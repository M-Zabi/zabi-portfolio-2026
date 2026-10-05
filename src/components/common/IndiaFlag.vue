<script setup lang="ts">
/**
 * The flag of India, drawn to the official 3:2 proportions and colours: saffron, white and
 * India green, with the navy 24-spoke Ashoka Chakra (¾ of the white band's height). Drawn as
 * SVG because flag emoji render as plain letters on Windows.
 */
const spokes = Array.from({ length: 24 }, (_, index) => {
  const angle = (index * Math.PI) / 12
  const [x, y] = [Math.cos(angle), Math.sin(angle)]
  return `M${(x * 14).toFixed(2)} ${(y * 14).toFixed(2)}L${(x * 69).toFixed(2)} ${(y * 69).toFixed(2)}`
}).join('')
</script>

<template>
  <svg viewBox="0 0 900 600" class="aspect-[3/2] rounded-[2px] shadow-[0_0_0_1px_rgb(0_0_0/0.12)]" aria-hidden="true">
    <rect width="900" height="200" fill="#FF9933" />
    <rect y="200" width="900" height="200" fill="#FFFFFF" />
    <rect y="400" width="900" height="200" fill="#138808" />
    <g transform="translate(450 300)" fill="none" stroke="#000080">
      <circle r="70" stroke-width="10" />
      <path :d="spokes" stroke-width="5" />
      <circle r="14" fill="#000080" stroke="none" />
    </g>
  </svg>
</template>
