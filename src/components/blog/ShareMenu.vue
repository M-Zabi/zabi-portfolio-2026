<script setup lang="ts">
import { CheckIcon, LinkIcon, Share2Icon } from '@lucide/vue'
import { useClipboard, useShare } from '@vueuse/core'
import { AnimatePresence, motion } from 'motion-v'
import { computed } from 'vue'
import { siBluesky, siX } from 'simple-icons'
import { toast } from 'vue-sonner'

import { spring } from '@/lib/motion'
import { cn } from '@/lib/utils'

/**
 * Share row: X, LinkedIn, Bluesky, copy link, and the system share sheet where the browser
 * has one. `tone` matches the surface it sits on (a brand block or the page).
 */
const props = withDefaults(
  defineProps<{ title: string; url: string; text?: string; tone?: 'page' | 'block'; compact?: boolean; class?: string }>(),
  { text: undefined, tone: 'page', compact: false, class: undefined },
)

const { copy, copied } = useClipboard({ copiedDuring: 2000, legacy: true })
const { share, isSupported: canShare } = useShare()

const encoded = computed(() => ({ url: encodeURIComponent(props.url), title: encodeURIComponent(props.title) }))
const links = computed(() => [
  { label: 'Post', name: 'X', href: `https://x.com/intent/post?text=${encoded.value.title}&url=${encoded.value.url}`, icon: siX.path },
  {
    label: 'Share',
    name: 'LinkedIn',
    href: `https://www.linkedin.com/sharing/share-offsite/?url=${encoded.value.url}`,
    icon: null,
  },
  {
    label: 'Post',
    name: 'Bluesky',
    href: `https://bsky.app/intent/compose?text=${encodeURIComponent(`${props.title} ${props.url}`)}`,
    icon: siBluesky.path,
  },
])

async function copyLink() {
  try {
    await copy(props.url)
    toast.success('Link copied', { description: 'Paste it anywhere.' })
  } catch {
    toast.error('Couldn’t copy the link')
  }
}

async function nativeShare() {
  try {
    await share({ title: props.title, text: props.text, url: props.url })
  } catch {
    // Dismissing the sheet rejects; nothing to report.
  }
}

const pill = computed(() =>
  cn(
    'inline-flex h-10 items-center gap-2 rounded-full border px-3.5 text-[0.8125rem] font-semibold transition-[background-color,color,border-color,transform] duration-200 active:scale-95',
    props.tone === 'block'
      ? 'border-current/30 hover:border-current hover:bg-current/10'
      : 'border-border bg-background hover:border-foreground/40 hover:bg-muted',
  ),
)
</script>

<template>
  <ul :class="cn('flex flex-wrap items-center gap-2', props.class)" aria-label="Share this article">
    <li v-for="link in links" :key="link.name">
      <a
        :href="link.href"
        target="_blank"
        rel="noopener noreferrer"
        :class="pill"
        :aria-label="`Share on ${link.name} (opens in a new tab)`"
      >
        <svg v-if="link.icon" viewBox="0 0 24 24" class="size-3.5 fill-current" aria-hidden="true"><path :d="link.icon" /></svg>
        <svg v-else viewBox="0 0 24 24" class="size-3.5 fill-none stroke-current" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
          <rect width="4" height="12" x="2" y="9" />
          <circle cx="4" cy="4" r="2" />
        </svg>
        <span v-if="!compact">{{ link.label }}</span>
      </a>
    </li>
    <li>
      <button type="button" :class="pill" :aria-label="copied ? 'Link copied' : 'Copy link'" @click="copyLink">
        <span class="relative grid size-3.5 place-items-center">
          <AnimatePresence mode="popLayout" :initial="false">
            <motion.span
              :key="copied ? 'ok' : 'link'"
              class="grid place-items-center"
              :initial="{ scale: 0.3, opacity: 0, rotate: -45 }"
              :animate="{ scale: 1, opacity: 1, rotate: 0 }"
              :exit="{ scale: 0.3, opacity: 0 }"
              :transition="spring.snappy"
            >
              <CheckIcon v-if="copied" class="size-3.5" aria-hidden="true" />
              <LinkIcon v-else class="size-3.5" aria-hidden="true" />
            </motion.span>
          </AnimatePresence>
        </span>
        <span v-if="!compact">{{ copied ? 'Copied' : 'Copy' }}</span>
      </button>
    </li>
    <li v-if="canShare">
      <button type="button" :class="pill" aria-label="More sharing options" @click="nativeShare">
        <Share2Icon class="size-3.5" aria-hidden="true" />
        <span v-if="!compact">More</span>
      </button>
    </li>
  </ul>
</template>
