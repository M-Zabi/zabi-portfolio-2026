<script setup lang="ts">
import { CheckIcon, CopyIcon } from '@lucide/vue'
import { useClipboard } from '@vueuse/core'
import { AnimatePresence, motion } from 'motion-v'
import { computed } from 'vue'
import { toast } from 'vue-sonner'

import { languageLabel, tokenizeLines } from '@/lib/highlight'
import { spring } from '@/lib/motion'

import InlineText from './InlineText.vue'

const props = defineProps<{ code: string; lang: string; filename?: string; caption?: string }>()

const lines = computed(() => tokenizeLines(props.code, props.lang))
const gutter = computed(() => String(lines.value.length).length)
const showNumbers = computed(() => lines.value.length > 3)

const { copy, copied, isSupported } = useClipboard({ copiedDuring: 1800, legacy: true })

async function onCopy() {
  try {
    await copy(props.code)
  } catch {
    toast.error('Couldn’t copy', { description: 'Select the code and copy it manually.' })
  }
}
</script>

<template>
  <figure class="code-block not-prose">
    <div class="overflow-hidden rounded-2xl bg-(--code-bg) text-(--code-fg) ring-1 ring-foreground/10">
      <figcaption class="flex h-11 items-center justify-between gap-4 border-b border-white/8 pr-2 pl-4">
        <span class="flex min-w-0 items-center gap-3">
          <span class="flex gap-1.5" aria-hidden="true">
            <span class="size-2.5 rounded-full bg-white/15" />
            <span class="size-2.5 rounded-full bg-white/15" />
            <span class="size-2.5 rounded-full bg-white/15" />
          </span>
          <span class="truncate font-mono text-xs text-(--code-muted)">{{ filename ?? languageLabel(lang) }}</span>
        </span>
        <span class="flex items-center gap-2">
          <span v-if="filename" class="text-label hidden text-(--code-muted) sm:inline">{{ languageLabel(lang) }}</span>
          <button
            v-if="isSupported"
            type="button"
            class="relative grid size-9 place-items-center rounded-lg text-(--code-muted) transition-colors hover:bg-white/8 hover:text-(--code-fg)"
            :aria-label="copied ? 'Copied' : 'Copy code'"
            @click="onCopy"
          >
            <AnimatePresence mode="popLayout" :initial="false">
              <motion.span
                :key="copied ? 'done' : 'copy'"
                class="grid place-items-center"
                :initial="{ scale: 0.4, opacity: 0, rotate: -30 }"
                :animate="{ scale: 1, opacity: 1, rotate: 0 }"
                :exit="{ scale: 0.4, opacity: 0 }"
                :transition="spring.snappy"
              >
                <CheckIcon v-if="copied" class="size-4 text-(--code-string)" aria-hidden="true" />
                <CopyIcon v-else class="size-4" aria-hidden="true" />
              </motion.span>
            </AnimatePresence>
          </button>
          <span class="sr-only" aria-live="polite">{{ copied ? 'Code copied to clipboard' : '' }}</span>
        </span>
      </figcaption>

      <div class="code-scroll overflow-x-auto overscroll-x-contain py-4" tabindex="0" :aria-label="`${languageLabel(lang)} code`">
        <pre class="min-w-max font-mono text-[0.8125rem] leading-[1.7]"><code><span
          v-for="(line, index) in lines"
          :key="index"
          class="code-line block pr-6"
          :class="showNumbers ? 'pl-0' : 'pl-5'"
        ><span
            v-if="showNumbers"
            class="mr-5 inline-block border-r border-white/8 pr-4 pl-4 text-right text-(--code-muted) opacity-60 select-none"
            :style="{ width: `calc(${gutter}ch + 2.25rem)` }"
            aria-hidden="true"
          >{{ index + 1 }}</span><span
            v-for="(token, tokenIndex) in line"
            :key="tokenIndex"
            :class="`tok-${token.kind}`"
          >{{ token.value }}</span><template v-if="!line.length">{{ ' ' }}</template></span></code></pre>
      </div>
    </div>
    <p v-if="caption" class="mt-3 text-sm leading-relaxed text-muted-foreground"><InlineText :text="caption" /></p>
  </figure>
</template>

<style scoped>
.code-line:hover {
  background: rgb(255 255 255 / 0.035);
}

.tok-comment {
  color: var(--code-muted);
  font-style: italic;
}
.tok-string {
  color: var(--code-string);
}
.tok-keyword,
.tok-heading {
  color: var(--code-keyword);
}
.tok-heading {
  font-weight: 600;
}
.tok-number,
.tok-variable {
  color: var(--code-number);
}
.tok-function {
  color: var(--code-function);
}
.tok-type {
  color: var(--code-type);
}
.tok-property,
.tok-flag {
  color: var(--code-property);
}
.tok-punctuation {
  color: color-mix(in oklch, var(--code-fg) 62%, transparent);
}

.code-scroll {
  scrollbar-width: thin;
  scrollbar-color: rgb(255 255 255 / 0.2) transparent;
}

.code-scroll:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: -2px;
}
</style>
