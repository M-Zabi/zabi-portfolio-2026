<script setup lang="ts">
import { CheckIcon, CopyIcon, RotateCcwIcon, XIcon } from '@lucide/vue'
import { useClipboard } from '@vueuse/core'
import { AnimatePresence, motion, useReducedMotion } from 'motion-v'
import { computed, onBeforeUnmount, ref, watch } from 'vue'

import AiOrb from '@/components/assistant/AiOrb.vue'
import { ease } from '@/lib/motion'
import { sleep } from '@/lib/utils'
import { isLiveSummary, parseSummary, streamSummary } from '@/services/summary'
import type { Post } from '@/types/blog'

/**
 * "Summarize with AI": a short reading pass, then the summary streams in token by token —
 * the lead paragraph first, then each key point as it completes.
 */
const props = defineProps<{ post: Post; words: number }>()
const open = defineModel<boolean>('open', { required: true })

type Phase = 'reading' | 'writing' | 'done' | 'error'
const phase = ref<Phase>('reading')
const text = ref('')
const reducedMotion = useReducedMotion()
const live = isLiveSummary()
let controller: AbortController | null = null

const parsed = computed(() => parseSummary(text.value))
const status = computed(() => {
  switch (phase.value) {
    case 'reading':
      return `Reading ${props.words.toLocaleString('en-US')} words…`
    case 'writing':
      return 'Writing…'
    case 'done':
      return `${parsed.value.points.length} key points · ~${Math.max(1, Math.round(text.value.split(/\s+/).length / 238))} min read`
    default:
      return 'Couldn’t summarise right now'
  }
})

async function run() {
  controller?.abort()
  controller = new AbortController()
  const { signal } = controller
  text.value = ''
  phase.value = 'reading'
  try {
    if (!reducedMotion.value) await sleep(live ? 0 : 1100)
    if (signal.aborted) return
    phase.value = 'writing'
    for await (const chunk of streamSummary(props.post, { signal, pace: reducedMotion.value ? 0 : 1 })) {
      if (signal.aborted) return
      text.value += chunk
    }
    if (!signal.aborted) phase.value = 'done'
  } catch (error) {
    if (!signal.aborted) phase.value = 'error'
    if (import.meta.env.DEV) console.warn('[AiSummary]', error)
  }
}

watch(
  open,
  (value) => {
    if (value) void run()
    else controller?.abort()
  },
  { immediate: true },
)

onBeforeUnmount(() => controller?.abort())

const { copy, copied } = useClipboard({ copiedDuring: 1800, legacy: true })
const copySummary = () =>
  copy(`${parsed.value.tldr}\n\n${parsed.value.points.map((point) => `• ${point}`).join('\n')}\n\n— ${props.post.title}`)
</script>

<template>
  <AnimatePresence>
    <motion.section
      v-if="open"
      key="summary"
      class="overflow-hidden"
      aria-labelledby="ai-summary-title"
      :initial="{ height: 0, opacity: 0 }"
      :animate="{ height: 'auto', opacity: 1 }"
      :exit="{ height: 0, opacity: 0 }"
      :transition="{ duration: 0.55, ease: ease.outExpo }"
    >
      <div class="ai-frame relative rounded-[1.75rem] p-px" :data-phase="phase">
        <div class="relative rounded-[calc(1.75rem-1px)] bg-card p-5 sm:p-7">
          <header class="flex items-start justify-between gap-4">
            <div class="flex items-center gap-3.5">
              <AiOrb class="size-10" :state="phase === 'done' ? 'idle' : phase === 'error' ? 'error' : phase === 'reading' ? 'thinking' : 'speaking'" />
              <div>
                <h2 id="ai-summary-title" class="font-display text-lg font-semibold tracking-tight">AI summary</h2>
                <p class="text-label mt-0.5 text-muted-foreground" aria-live="polite">{{ status }}</p>
              </div>
            </div>
            <button
              type="button"
              class="grid size-10 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Close summary"
              @click="open = false"
            >
              <XIcon class="size-4" aria-hidden="true" />
            </button>
          </header>

          <!-- Reading pass: lines scanned by a light bar -->
          <div v-if="phase === 'reading'" class="scan mt-6 space-y-3" aria-hidden="true">
            <span v-for="width in [92, 100, 84, 96, 70]" :key="width" class="block h-3 rounded-full bg-muted" :style="{ width: `${width}%` }" />
          </div>

          <div v-else-if="phase === 'error'" class="mt-6 flex flex-wrap items-center gap-4">
            <p class="text-muted-foreground">The summariser didn’t respond. The article is all there below.</p>
            <button type="button" class="inline-flex h-10 items-center gap-2 rounded-full border border-border px-4 text-sm font-medium hover:bg-muted" @click="run">
              <RotateCcwIcon class="size-4" aria-hidden="true" /> Try again
            </button>
          </div>

          <div v-else class="mt-6">
            <p class="max-w-[62ch] text-[1.0625rem] leading-relaxed text-foreground">
              {{ parsed.tldr }}<span v-if="phase === 'writing' && !parsed.points.length" class="caret" aria-hidden="true" />
            </p>
            <ul v-if="parsed.points.length" class="mt-5 space-y-3">
              <motion.li
                v-for="(point, index) in parsed.points"
                :key="index"
                class="relative pl-8 text-[0.9375rem] leading-relaxed text-muted-foreground"
                :initial="{ opacity: 0, x: -8 }"
                :animate="{ opacity: 1, x: 0 }"
                :transition="{ duration: 0.4, ease: ease.outQuint }"
              >
                <span class="text-label tabular absolute top-[0.2rem] left-0 text-[0.625rem] text-foreground">{{ String(index + 1).padStart(2, '0') }}</span>
                {{ point }}<span v-if="phase === 'writing' && index === parsed.points.length - 1" class="caret" aria-hidden="true" />
              </motion.li>
            </ul>

            <footer v-if="phase === 'done'" class="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
              <p class="text-xs text-muted-foreground">
                {{ live ? 'Generated live by a language model.' : 'Summary generated with AI.' }} It can miss nuance — the article is the source of truth.
              </p>
              <div class="flex gap-2">
                <button type="button" class="inline-flex h-9 items-center gap-2 rounded-full border border-border px-3.5 text-xs font-semibold hover:bg-muted" @click="run">
                  <RotateCcwIcon class="size-3.5" aria-hidden="true" /> Replay
                </button>
                <button type="button" class="inline-flex h-9 items-center gap-2 rounded-full bg-foreground px-3.5 text-xs font-semibold text-background hover:bg-foreground/85" @click="copySummary">
                  <CheckIcon v-if="copied" class="size-3.5" aria-hidden="true" />
                  <CopyIcon v-else class="size-3.5" aria-hidden="true" />
                  {{ copied ? 'Copied' : 'Copy' }}
                </button>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </motion.section>
  </AnimatePresence>
</template>

<style scoped>
.ai-frame {
  isolation: isolate;
  background: var(--border);
}

.ai-frame::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  border-radius: inherit;
  padding: 1.5px;
  background: conic-gradient(from var(--angle), var(--ember), var(--volt), var(--mint), var(--cobalt), var(--blush), var(--ember));
  -webkit-mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  animation: frame-spin 4s linear infinite;
  opacity: 0.9;
}

.ai-frame[data-phase='done']::before {
  animation-duration: 14s;
  opacity: 0.55;
}

@property --angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}

@keyframes frame-spin {
  to {
    --angle: 360deg;
  }
}

.scan {
  position: relative;
  overflow: hidden;
  mask-image: linear-gradient(to bottom, #000 60%, transparent);
}

.scan::after {
  content: '';
  position: absolute;
  inset: -20% 0;
  height: 30%;
  background: linear-gradient(to bottom, transparent, color-mix(in oklch, var(--primary) 30%, transparent), transparent);
  animation: scan 1.1s var(--ease-in-out-quart) infinite;
}

@keyframes scan {
  from {
    transform: translateY(-60%);
  }
  to {
    transform: translateY(420%);
  }
}

.caret {
  display: inline-block;
  width: 0.5em;
  height: 1.05em;
  margin-left: 0.15em;
  vertical-align: -0.15em;
  border-radius: 2px;
  background: var(--primary);
  animation: caret 0.9s steps(1) infinite;
}

@keyframes caret {
  50% {
    opacity: 0;
  }
}
</style>
