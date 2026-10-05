<script setup lang="ts">
import { LoaderIcon, RotateCcwIcon, TriangleAlertIcon } from '@lucide/vue'

import { Button } from '@/components/ui/button'

/** Plain explanation plus a retry that keeps its label while pending. */
withDefaults(
  defineProps<{ title?: string; description?: string; retrying?: boolean }>(),
  {
    title: 'This didn’t load',
    description: 'Something went wrong on the way here. It’s usually a blip — try again.',
    retrying: false,
  },
)

defineEmits<{ retry: [] }>()
</script>

<template>
  <div role="alert" class="flex flex-col items-start gap-5 rounded-3xl border border-destructive/30 bg-destructive/5 p-8 sm:p-12">
    <span class="grid size-12 place-items-center rounded-full bg-destructive/10 text-destructive" aria-hidden="true">
      <TriangleAlertIcon class="size-5" />
    </span>
    <div>
      <h2 class="font-display text-display-sm">{{ title }}</h2>
      <p class="mt-2 max-w-[48ch] text-muted-foreground">{{ description }}</p>
    </div>
    <Button variant="outline" size="lg" :disabled="retrying" @click="$emit('retry')">
      <LoaderIcon v-if="retrying" class="animate-spin" aria-hidden="true" />
      <RotateCcwIcon v-else aria-hidden="true" />
      Try again
    </Button>
  </div>
</template>
