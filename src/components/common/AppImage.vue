<script setup lang="ts">
import { ImageOffIcon } from '@lucide/vue'
import { onMounted, ref, useTemplateRef } from 'vue'

import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/** Image with a skeleton while loading, a soft settle on arrival and a designed failure. */
const props = withDefaults(
  defineProps<{ src: string; alt: string; eager?: boolean; class?: string; imgClass?: string }>(),
  { eager: false, class: undefined, imgClass: undefined },
)

const img = useTemplateRef<HTMLImageElement>('img')
const status = ref<'loading' | 'loaded' | 'error'>('loading')

// A cached image can finish before the load listener is attached.
onMounted(() => {
  if (img.value?.complete && img.value.naturalWidth > 0) status.value = 'loaded'
})
</script>

<template>
  <div :class="cn('relative overflow-hidden bg-muted', props.class)">
    <Skeleton v-if="status === 'loading'" class="absolute inset-0 rounded-none" />
    <img
      ref="img"
      :src="src"
      :alt="alt"
      :loading="eager ? 'eager' : 'lazy'"
      :fetchpriority="eager ? 'high' : 'auto'"
      decoding="async"
      :class="
        cn(
          'size-full object-cover transition-[opacity,scale] duration-700 ease-out-quint',
          status === 'loaded' ? 'scale-100 opacity-100' : 'scale-[1.03] opacity-0',
          imgClass,
        )
      "
      @load="status = 'loaded'"
      @error="status = 'error'"
    />
    <div
      v-if="status === 'error'"
      class="absolute inset-0 grid place-items-center gap-2 text-muted-foreground"
      role="img"
      :aria-label="`${alt} (image unavailable)`"
    >
      <ImageOffIcon class="size-6" aria-hidden="true" />
    </div>
  </div>
</template>
