<script setup lang="ts">
import { CheckIcon, LinkIcon, MessageCircleIcon, Share2Icon } from '@lucide/vue'
import { useClipboard, useShare } from '@vueuse/core'
import { AnimatePresence, motion } from 'motion-v'
import { toast } from 'vue-sonner'

import AiOrb from '@/components/assistant/AiOrb.vue'
import { ease } from '@/lib/motion'

import HeartButton from './HeartButton.vue'

/**
 * The article's actions in two shapes: a vertical rail beside the text on large screens, and
 * a floating pill on phones that appears once reading starts and steps aside at the end.
 */
const props = defineProps<{
  layout: 'rail' | 'bar'
  visible?: boolean
  hearted: boolean
  hearts: number
  comments: number
  title: string
  url: string
  summarizing: boolean
}>()

const emit = defineEmits<{ heart: [hearted: boolean]; comments: []; summarize: [] }>()

const { copy, copied } = useClipboard({ copiedDuring: 2000, legacy: true })
const { share, isSupported: canShare } = useShare()

async function onShare() {
  if (canShare.value) {
    try {
      await share({ title: props.title, url: props.url })
    } catch {
      // Dismissed.
    }
    return
  }
  try {
    await copy(props.url)
    toast.success('Link copied')
  } catch {
    toast.error('Couldn’t copy the link')
  }
}

const iconButton =
  'relative grid size-11 place-items-center rounded-full transition-colors duration-200 hover:bg-muted active:scale-95'
</script>

<template>
  <!-- Rail -->
  <div v-if="layout === 'rail'" class="flex flex-col items-center gap-3" role="group" aria-label="Article actions">
    <HeartButton :hearted="hearted" :count="hearts" @toggle="emit('heart', $event)" />
    <button type="button" class="flex flex-col items-center gap-1" :aria-label="`Open comments (${comments})`" @click="emit('comments')">
      <span :class="iconButton"><MessageCircleIcon class="size-[1.3rem]" aria-hidden="true" /></span>
      <span class="tabular text-xs font-medium" aria-hidden="true">{{ comments }}</span>
    </button>
    <button type="button" :class="iconButton" :aria-label="copied ? 'Link copied' : canShare ? 'Share' : 'Copy link'" @click="onShare">
      <CheckIcon v-if="copied" class="size-[1.15rem]" aria-hidden="true" />
      <Share2Icon v-else-if="canShare" class="size-[1.15rem]" aria-hidden="true" />
      <LinkIcon v-else class="size-[1.15rem]" aria-hidden="true" />
    </button>
    <span class="my-1 h-px w-6 bg-border" aria-hidden="true" />
    <button type="button" :class="iconButton" :aria-label="summarizing ? 'Close AI summary' : 'Summarize with AI'" :aria-pressed="summarizing" @click="emit('summarize')">
      <AiOrb class="size-6" :state="summarizing ? 'speaking' : 'idle'" />
    </button>
  </div>

  <!-- Floating bar -->
  <AnimatePresence v-else>
    <motion.div
      v-if="visible"
      class="fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 flex justify-center px-4 lg:hidden"
      :initial="{ y: 96, opacity: 0 }"
      :animate="{ y: 0, opacity: 1 }"
      :exit="{ y: 96, opacity: 0 }"
      :transition="{ duration: 0.5, ease: ease.outExpo }"
    >
      <div class="flex items-center gap-1 rounded-full border border-border bg-background/85 p-1 shadow-[0_20px_50px_-20px_rgb(0_0_0/0.5)] backdrop-blur-xl" role="group" aria-label="Article actions">
        <HeartButton layout="inline" :hearted="hearted" :count="hearts" @toggle="emit('heart', $event)" />
        <button type="button" class="flex h-11 items-center gap-2 rounded-full px-3 hover:bg-muted" :aria-label="`Open comments (${comments})`" @click="emit('comments')">
          <MessageCircleIcon class="size-5" aria-hidden="true" />
          <span class="tabular text-xs font-medium" aria-hidden="true">{{ comments }}</span>
        </button>
        <button type="button" :class="iconButton" :aria-label="canShare ? 'Share' : 'Copy link'" @click="onShare">
          <Share2Icon class="size-[1.15rem]" aria-hidden="true" />
        </button>
        <button
          type="button"
          class="flex h-11 items-center gap-2 rounded-full bg-ink pr-4 pl-1.5 text-xs font-semibold text-paper"
          :aria-pressed="summarizing"
          @click="emit('summarize')"
        >
          <AiOrb class="size-8" :state="summarizing ? 'speaking' : 'idle'" />
          Summary
        </button>
      </div>
    </motion.div>
  </AnimatePresence>
</template>
