<script setup lang="ts">
import SectionHeading from '@/components/common/SectionHeading.vue'

import TileMomentum from './bento/TileMomentum.vue'
import TilePlatforms from './bento/TilePlatforms.vue'
import TileShipping from './bento/TileShipping.vue'
import TileStack from './bento/TileStack.vue'
import TileStatus from './bento/TileStatus.vue'
import TileWorkflow from './bento/TileWorkflow.vue'
</script>

<template>
  <section class="section-y relative z-10" aria-labelledby="capabilities-title">
    <div class="container-page">
      <SectionHeading
        index="04"
        label="Capabilities"
        title-id="capabilities-title"
        :title="'Built to be *felt,*\nnot just seen.'"
        description="Product engineering across the whole stack, with the interaction layer treated as a first-class feature."
      />

      <div class="mt-14 grid auto-rows-[minmax(16rem,auto)] grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-12 lg:[grid-auto-flow:dense]">
        <TileMomentum class="md:col-span-2 lg:col-span-7 lg:row-span-2" />
        <TileStack class="lg:col-span-5" />
        <TileStatus class="lg:col-span-5" />
        <TilePlatforms class="md:row-span-2 lg:col-span-4" />
        <TileShipping class="lg:col-span-8" />
        <TileWorkflow class="lg:col-span-8" />
      </div>
    </div>
  </section>
</template>
