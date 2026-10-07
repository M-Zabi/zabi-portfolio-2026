<script setup lang="ts">
import {
  ArrowLeftIcon,
  ArrowUpIcon,
  CornerDownLeftIcon,
  DownloadIcon,
  LoaderIcon,
  PencilIcon,
  RotateCcwIcon,
} from '@lucide/vue'
import { AnimatePresence, motion, useReducedMotion } from 'motion-v'
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, useTemplateRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'

import { site } from '@/config/site'
import {
  type Answers,
  type AssistantMode,
  closingLines,
  type FlowStep,
  flows,
  validateAnswer,
} from '@/lib/assistant'
import { ease, spring } from '@/lib/motion'
import { sleep } from '@/lib/utils'
import type { ContactPayload, ResumeRequestPayload } from '@/lib/validators/contact'
import { ContactRequestError, downloadResume, requestResume, resumeAvailable, submitContact } from '@/services/contact'

import AiOrb from './AiOrb.vue'
import AssistantOrb from './AssistantOrb.vue'
import type { OrbState } from './orb-scene'

/**
 * A conversational form. The assistant asks one question at a time (typed out, with a
 * thinking pause), validates each answer with the same schema the submit service uses,
 * lets the visitor go back or edit from a review card, and then sends the brief — or, in
 * résumé mode, records who asked and hands the file over.
 */

interface Message {
  id: number
  from: 'assistant' | 'user'
  text: string
  /** What is visible so far while the assistant "types". */
  shown: string
  stepId?: string
  skipped?: boolean
}

type Phase = 'typing' | 'awaiting' | 'review' | 'sending' | 'done'

const route = useRoute()
const router = useRouter()
const reducedMotion = useReducedMotion()

const mode = ref<AssistantMode>(route.query.intent === 'resume' ? 'resume' : 'project')
const flow = computed(() => flows[mode.value])
const answers = reactive<Answers>({})
const messages = ref<Message[]>([])
const stepIndex = ref(0)
const editing = ref<string | null>(null)
const phase = ref<Phase>('typing')
const thinking = ref(false)
const draft = ref('')
const error = ref<string | null>(null)
const flash = ref<OrbState | null>(null)
const resumeMissing = ref(false)

const orb = useTemplateRef<InstanceType<typeof AssistantOrb>>('orb')
const scroller = useTemplateRef<HTMLElement>('scroller')
const field = useTemplateRef<HTMLInputElement | HTMLTextAreaElement>('field')

let messageId = 0
/** Bumped whenever the script restarts; stale typing loops notice and stop. */
let run = 0

const currentStep = computed<FlowStep | undefined>(() =>
  editing.value ? flow.value.steps.find((step) => step.id === editing.value) : flow.value.steps[stepIndex.value],
)
const answered = computed(() => flow.value.steps.filter((step) => step.id in answers).length)
const total = computed(() => flow.value.steps.length)

const orbState = computed<OrbState>(() => {
  if (flash.value) return flash.value
  switch (phase.value) {
    case 'typing':
      return thinking.value ? 'thinking' : 'speaking'
    case 'sending':
      return 'thinking'
    case 'done':
      return 'success'
    case 'awaiting':
      return draft.value ? 'listening' : 'idle'
    default:
      return 'idle'
  }
})

const statusLabel = computed(() => {
  switch (orbState.value) {
    case 'speaking':
      return 'Speaking'
    case 'thinking':
      return phase.value === 'sending' ? 'Sending' : 'Thinking'
    case 'listening':
      return 'Listening'
    case 'success':
      return mode.value === 'resume' ? 'Unlocked' : 'Sent'
    case 'error':
      return 'Hmm'
    default:
      return phase.value === 'review' ? 'Ready to send' : 'Your turn'
  }
})

// ───────────── Script ─────────────

async function scrollToEnd() {
  await nextTick()
  const element = scroller.value
  if (element) element.scrollTo({ top: element.scrollHeight, behavior: reducedMotion.value ? 'auto' : 'smooth' })
}

/** Types the assistant's lines one by one. Resolves false if the script was restarted meanwhile. */
async function say(lines: string[], stepId?: string): Promise<boolean> {
  const id = run
  phase.value = 'typing'
  for (const line of lines) {
    thinking.value = true
    void scrollToEnd()
    if (!reducedMotion.value) await sleep(380 + Math.min(line.length * 4, 520))
    if (id !== run) return false
    thinking.value = false

    const message: Message = { id: ++messageId, from: 'assistant', text: line, shown: reducedMotion.value ? line : '', stepId }
    messages.value.push(message)
    const live = messages.value.at(-1)!
    void scrollToEnd()

    if (!reducedMotion.value) {
      const step = line.length > 120 ? 3 : 2
      for (let index = 0; index < line.length; index += step) {
        if (id !== run) return false
        live.shown = line.slice(0, index + step)
        await sleep(/[.,—?!]/.test(line[index] ?? '') ? 60 : 14)
      }
    }
    live.shown = line
  }
  return id === run
}

async function ask() {
  const step = currentStep.value
  if (!step) return review()
  const prompt = step.prompt(answers)
  const lines = editing.value ? [`Sure — ${prompt.at(-1)!.charAt(0).toLowerCase()}${prompt.at(-1)!.slice(1)}`] : prompt
  if (!(await say(lines, step.id))) return
  draft.value = editing.value ? (answers[step.id] ?? '') : ''
  error.value = null
  phase.value = 'awaiting'
  await nextTick()
  field.value?.focus({ preventScroll: true })
}

async function review() {
  editing.value = null
  if (!(await say(flow.value.review(answers)))) return
  phase.value = 'review'
  void scrollToEnd()
}

function start() {
  run++
  messages.value = []
  for (const key of Object.keys(answers)) delete answers[key]
  stepIndex.value = 0
  editing.value = null
  draft.value = ''
  error.value = null
  resumeMissing.value = false
  void ask()
}

function flashOrb(state: OrbState, ms = 1100) {
  flash.value = state
  setTimeout(() => {
    if (flash.value === state) flash.value = null
  }, ms)
}

async function answer(value: string, skipped = false) {
  const step = currentStep.value
  if (!step || phase.value !== 'awaiting') return

  const problem = skipped ? null : validateAnswer(step, value)
  if (problem) {
    error.value = problem
    flashOrb('error')
    orb.value?.pulse(1)
    return
  }

  error.value = null
  answers[step.id] = skipped ? '' : value.trim()
  messages.value.push({
    id: ++messageId,
    from: 'user',
    text: skipped ? 'Skipped' : value.trim(),
    shown: skipped ? 'Skipped' : value.trim(),
    stepId: step.id,
    skipped,
  })
  draft.value = ''
  orb.value?.pulse(0.8)

  if (editing.value) {
    editing.value = null
    stepIndex.value = total.value
    return review()
  }
  stepIndex.value += 1
  return stepIndex.value >= total.value ? review() : ask()
}

/** Steps back one question, removing it from the transcript as if it was never answered. */
function back() {
  if (stepIndex.value === 0 || editing.value || phase.value !== 'awaiting') return
  run++
  const previous = flow.value.steps[stepIndex.value - 1]!
  const cut = messages.value.findIndex((message) => message.stepId === previous.id)
  if (cut >= 0) messages.value.splice(cut)
  delete answers[previous.id]
  stepIndex.value -= 1
  void ask()
}

function edit(stepId: string) {
  if (phase.value !== 'review') return
  editing.value = stepId
  void ask()
}

function switchMode(next: AssistantMode) {
  if (next === mode.value || phase.value === 'sending') return
  mode.value = next
  void router.replace({ query: next === 'resume' ? { intent: 'resume' } : {} })
}

// ───────────── Sending ─────────────

async function send() {
  if (phase.value !== 'review') return
  phase.value = 'sending'
  try {
    if (mode.value === 'project') {
      const channel = await submitContact({ ...(answers as unknown as ContactPayload), website: honeypot.value })
      phase.value = 'done'
      await say(closingLines('project', answers, channel))
      phase.value = 'done'
      if (channel === 'api') toast.success('Brief sent', { description: site.replyTime })
    } else {
      const [available] = await Promise.all([
        resumeAvailable(),
        requestResume({ ...(answers as unknown as ResumeRequestPayload), website: honeypot.value }),
      ])
      phase.value = 'done'
      if (available) {
        downloadResume()
        await say(closingLines('resume', answers, 'download'))
      } else {
        resumeMissing.value = true
        await say([
          'Small snag: the latest résumé isn’t uploaded yet.',
          `Email ${site.email} and Zabi will send it straight over — your details are saved above.`,
        ])
      }
      phase.value = 'done'
    }
  } catch (reason) {
    phase.value = 'review'
    flashOrb('error', 1400)
    const message = reason instanceof ContactRequestError ? reason.message : `Something went wrong. Please try again, or email ${site.email}.`
    toast.error(mode.value === 'resume' ? 'Couldn’t unlock the résumé' : 'Brief not sent', { description: message })
  }
}

// ───────────── Input ─────────────

const honeypot = ref('')

function onInput() {
  orb.value?.pulse(0.22)
  if (error.value) error.value = null
}

function onKeydown(event: KeyboardEvent) {
  const step = currentStep.value
  if (!step) return
  const submit = step.kind === 'textarea' ? event.key === 'Enter' && (event.metaKey || event.ctrlKey) : event.key === 'Enter'
  if (submit) {
    event.preventDefault()
    void answer(draft.value)
  }
}

/** Number keys pick an option when a choice question is waiting. */
function onWindowKeydown(event: KeyboardEvent) {
  const step = currentStep.value
  if (phase.value !== 'awaiting' || step?.kind !== 'choice' || event.metaKey || event.ctrlKey || event.altKey) return
  if ((event.target as HTMLElement | null)?.closest('input, textarea')) return
  const option = step.options?.[Number(event.key) - 1]
  if (option) void answer(option)
}

onMounted(() => {
  window.addEventListener('keydown', onWindowKeydown)
  start()
})
onBeforeUnmount(() => {
  run++
  window.removeEventListener('keydown', onWindowKeydown)
})

watch(mode, start)
watch(
  () => route.query.intent,
  (intent) => {
    const next = intent === 'resume' ? 'resume' : 'project'
    if (next !== mode.value) mode.value = next
  },
)

const reviewRows = computed(() =>
  flow.value.steps.map((step) => ({ id: step.id, label: step.label, value: answers[step.id] || '—' })),
)
const promptLabel = computed(() => currentStep.value?.prompt(answers).at(-1) ?? '')
</script>

<template>
  <div class="grid gap-6 lg:grid-cols-12 lg:gap-8">
    <!-- Orb stage -->
    <div class="lg:col-span-5">
      <div class="orb-stage relative overflow-hidden rounded-[2rem] border border-border lg:sticky lg:top-28">
        <div class="relative mx-auto aspect-[16/10] w-full sm:aspect-[16/9] lg:aspect-square">
          <AssistantOrb ref="orb" :state="orbState" />
        </div>
        <div class="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5">
          <p class="text-label flex items-center gap-2.5 rounded-full border border-border bg-background/80 px-3 py-2 backdrop-blur-md" aria-live="polite">
            <span class="status-dot size-2 rounded-full" :data-state="orbState" aria-hidden="true" />
            {{ statusLabel }}
          </p>
          <p class="text-label tabular rounded-full border border-border bg-background/80 px-3 py-2 backdrop-blur-md">
            {{ Math.min(answered, total) }} / {{ total }}
          </p>
        </div>
      </div>
    </div>

    <!-- Conversation -->
    <section
      class="flex h-[min(46rem,78svh)] flex-col overflow-hidden rounded-[2rem] border border-border bg-card lg:col-span-7"
      aria-label="Conversation with Zabi’s assistant"
    >
      <header class="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
        <div class="flex rounded-full bg-muted p-1" role="tablist" aria-label="What do you need?">
          <button
            v-for="option in ([['project', 'Start a project'], ['resume', 'Get my résumé']] as const)"
            :key="option[0]"
            type="button"
            role="tab"
            class="relative h-9 rounded-full px-4 text-[0.8125rem] font-semibold transition-colors"
            :class="mode === option[0] ? 'text-background' : 'text-muted-foreground hover:text-foreground'"
            :aria-selected="mode === option[0]"
            @click="switchMode(option[0])"
          >
            <motion.span v-if="mode === option[0]" layout-id="assistant-mode" class="absolute inset-0 rounded-full bg-foreground" :transition="spring.layout" />
            <span class="relative">{{ option[1] }}</span>
          </button>
        </div>
        <div class="flex items-center gap-1.5" aria-hidden="true">
          <span
            v-for="(step, index) in flow.steps"
            :key="step.id"
            class="h-1.5 rounded-full transition-all duration-500 ease-out-expo"
            :class="step.id in answers ? 'w-5 bg-foreground' : index === stepIndex && phase !== 'review' && phase !== 'done' ? 'w-5 bg-primary' : 'w-1.5 bg-border'"
          />
        </div>
      </header>

      <!-- Transcript -->
      <div ref="scroller" class="flex-1 overflow-y-auto overscroll-contain px-4 py-6 sm:px-6" data-lenis-prevent role="log" aria-live="polite" aria-relevant="additions">
        <ol class="flex flex-col gap-3">
          <template v-for="message in messages" :key="message.id">
            <motion.li
              v-if="message.from === 'assistant'"
              class="flex max-w-[88%] items-end gap-2.5"
              :initial="{ opacity: 0, y: 10 }"
              :animate="{ opacity: 1, y: 0 }"
              :transition="{ duration: 0.35, ease: ease.outQuint }"
            >
              <AiOrb class="mb-1 size-6 shrink-0" />
              <p class="rounded-2xl rounded-bl-md bg-muted px-4 py-2.5 text-[0.9375rem] leading-relaxed">
                <span class="sr-only">{{ message.text }}</span>
                <span aria-hidden="true">{{ message.shown }}</span>
              </p>
            </motion.li>
            <motion.li
              v-else
              class="ml-auto flex max-w-[82%] items-center gap-2"
              :initial="{ opacity: 0, y: 10, scale: 0.96 }"
              :animate="{ opacity: 1, y: 0, scale: 1 }"
              :transition="spring.snappy"
            >
              <p
                class="rounded-2xl rounded-br-md px-4 py-2.5 text-[0.9375rem] leading-relaxed break-words whitespace-pre-line"
                :class="message.skipped ? 'border border-dashed border-border text-muted-foreground italic' : 'bg-foreground text-background'"
              >
                {{ message.text }}
              </p>
            </motion.li>
          </template>

          <!-- Thinking dots -->
          <li v-if="thinking" class="flex items-end gap-2.5" aria-hidden="true">
            <AiOrb class="mb-1 size-6 shrink-0" state="thinking" />
            <span class="flex gap-1 rounded-2xl rounded-bl-md bg-muted px-4 py-3.5">
              <span v-for="dot in 3" :key="dot" class="dot size-1.5 rounded-full bg-muted-foreground" :style="{ animationDelay: `${dot * 0.14}s` }" />
            </span>
          </li>

          <!-- Review card -->
          <motion.li
            v-if="phase === 'review' || (phase === 'sending' && !editing)"
            class="mt-2 ml-8 rounded-3xl border border-border bg-background p-4 sm:p-5"
            :initial="{ opacity: 0, y: 16 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.45, ease: ease.outQuint }"
          >
            <dl class="divide-y divide-border">
              <div v-for="row in reviewRows" :key="row.id" class="flex items-start gap-3 py-2.5 first:pt-0">
                <dt class="text-label w-24 shrink-0 pt-1 text-muted-foreground">{{ row.label }}</dt>
                <dd class="min-w-0 flex-1 text-sm leading-relaxed break-words" :class="row.id === 'message' && 'line-clamp-4 whitespace-pre-line'">{{ row.value }}</dd>
                <button
                  type="button"
                  class="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
                  :aria-label="`Edit ${row.label.toLowerCase()}`"
                  :disabled="phase !== 'review'"
                  @click="edit(row.id)"
                >
                  <PencilIcon class="size-3.5" aria-hidden="true" />
                </button>
              </div>
            </dl>
            <div class="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                class="inline-flex h-12 items-center gap-2.5 rounded-full bg-foreground pr-6 pl-2 text-sm font-semibold text-background transition-[background-color,transform] hover:bg-foreground/85 active:scale-[0.98] disabled:opacity-70"
                :disabled="phase !== 'review'"
                @click="send"
              >
                <span class="grid size-8 place-items-center rounded-full bg-background/15">
                  <LoaderIcon v-if="phase === 'sending'" class="size-4 animate-spin" aria-hidden="true" />
                  <DownloadIcon v-else-if="mode === 'resume'" class="size-4" aria-hidden="true" />
                  <ArrowUpIcon v-else class="size-4" aria-hidden="true" />
                </span>
                {{ phase === 'sending' ? (mode === 'resume' ? 'Unlocking…' : 'Sending…') : flow.submitLabel }}
              </button>
              <button type="button" class="inline-flex h-12 items-center gap-2 rounded-full px-4 text-sm font-medium text-muted-foreground hover:text-foreground" :disabled="phase !== 'review'" @click="start">
                <RotateCcwIcon class="size-4" aria-hidden="true" /> Start over
              </button>
            </div>
          </motion.li>

          <!-- Done -->
          <motion.li
            v-if="phase === 'done' && !thinking"
            class="mt-2 ml-8 flex flex-wrap gap-3"
            :initial="{ opacity: 0, y: 12 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.45, delay: 0.2, ease: ease.outQuint }"
          >
            <template v-if="mode === 'resume'">
              <button
                v-if="!resumeMissing"
                type="button"
                class="inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-semibold text-background hover:bg-foreground/85"
                @click="downloadResume"
              >
                <DownloadIcon class="size-4" aria-hidden="true" /> Download again
              </button>
              <a
                v-else
                :href="`mailto:${site.email}?subject=${encodeURIComponent('Résumé request')}`"
                class="inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-semibold text-background hover:bg-foreground/85"
              >Email Zabi</a>
              <button type="button" class="inline-flex h-11 items-center rounded-full border border-border px-5 text-sm font-semibold hover:bg-muted" @click="switchMode('project')">
                Start a project instead
              </button>
            </template>
            <template v-else>
              <button type="button" class="inline-flex h-11 items-center gap-2 rounded-full border border-border px-5 text-sm font-semibold hover:bg-muted" @click="start">
                <RotateCcwIcon class="size-4" aria-hidden="true" /> New brief
              </button>
              <RouterLink to="/blog" class="inline-flex h-11 items-center rounded-full border border-border px-5 text-sm font-semibold hover:bg-muted">
                Read the blog meanwhile
              </RouterLink>
            </template>
          </motion.li>
        </ol>
      </div>

      <!-- Composer -->
      <footer class="border-t border-border bg-background/50 px-3 pt-3 pb-3 sm:px-4">
        <AnimatePresence mode="wait" :initial="false">
          <motion.div
            v-if="phase === 'awaiting' && currentStep"
            :key="currentStep.id + (editing ?? '')"
            :initial="{ opacity: 0, y: 8 }"
            :animate="{ opacity: 1, y: 0 }"
            :exit="{ opacity: 0, y: -6 }"
            :transition="{ duration: 0.25, ease: ease.outQuint }"
          >
            <!-- Choices -->
            <div v-if="currentStep.kind === 'choice'" class="grid gap-2 sm:grid-cols-2" role="group" :aria-label="promptLabel">
              <button
                v-for="(option, index) in currentStep.options"
                :key="option"
                type="button"
                class="group/choice flex min-h-12 items-center gap-3 rounded-2xl border border-border bg-card px-3.5 py-2 text-left text-sm font-medium transition-[border-color,background-color,transform] duration-200 hover:border-foreground hover:bg-muted active:scale-[0.98]"
                :class="answers[currentStep.id] === option && 'border-foreground'"
                @click="answer(option)"
                @pointerenter="orb?.pulse(0.15)"
              >
                <kbd class="text-label grid size-6 shrink-0 place-items-center rounded-md border border-border text-muted-foreground transition-colors group-hover/choice:border-foreground group-hover/choice:text-foreground">{{ index + 1 }}</kbd>
                {{ option }}
              </button>
            </div>

            <!-- Text / email / brief -->
            <form v-else class="relative" novalidate @submit.prevent="answer(draft)">
              <label :for="`assistant-${currentStep.id}`" class="sr-only">{{ promptLabel }}</label>
              <textarea
                v-if="currentStep.kind === 'textarea'"
                :id="`assistant-${currentStep.id}`"
                ref="field"
                v-model="draft"
                :name="currentStep.id"
                rows="3"
                :maxlength="currentStep.maxLength"
                :placeholder="currentStep.placeholder"
                class="block max-h-52 min-h-28 w-full resize-none rounded-2xl border border-input bg-card py-3 pr-16 pl-4 text-base leading-relaxed outline-none field-sizing-content placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
                :aria-invalid="Boolean(error)"
                aria-describedby="assistant-hint"
                @input="onInput"
                @keydown="onKeydown"
              />
              <input
                v-else
                :id="`assistant-${currentStep.id}`"
                ref="field"
                v-model="draft"
                :name="currentStep.id"
                :type="currentStep.kind === 'email' ? 'email' : 'text'"
                :inputmode="currentStep.inputmode"
                :autocomplete="currentStep.autocomplete"
                :maxlength="currentStep.maxLength"
                :placeholder="currentStep.placeholder"
                enterkeyhint="send"
                class="block h-14 w-full rounded-2xl border border-input bg-card pr-16 pl-4 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
                :aria-invalid="Boolean(error)"
                aria-describedby="assistant-hint"
                @input="onInput"
                @keydown="onKeydown"
              />
              <button
                type="submit"
                class="absolute right-2 grid size-10 place-items-center rounded-full bg-foreground text-background transition-[transform,opacity] hover:scale-105 active:scale-95 disabled:opacity-30"
                :class="currentStep.kind === 'textarea' ? 'bottom-2' : 'top-2'"
                :disabled="!draft.trim()"
                aria-label="Send answer"
              >
                <ArrowUpIcon class="size-4" aria-hidden="true" />
              </button>
            </form>

            <div id="assistant-hint" class="mt-2 flex min-h-6 items-center justify-between gap-3 px-1 text-xs">
              <p v-if="error" role="alert" class="font-medium text-destructive">{{ error }}</p>
              <p v-else class="flex items-center gap-1.5 text-muted-foreground">
                <template v-if="currentStep.kind === 'choice'">Pick one — or press <kbd class="font-mono">1</kbd>–<kbd class="font-mono">{{ currentStep.options?.length }}</kbd></template>
                <template v-else-if="currentStep.kind === 'textarea'">
                  <span class="tabular">{{ draft.length }} / {{ currentStep.maxLength }}</span> · <kbd class="font-mono">Ctrl</kbd> + <kbd class="font-mono">Enter</kbd> to send
                </template>
                <template v-else><CornerDownLeftIcon class="size-3" aria-hidden="true" /> Enter to send</template>
              </p>
              <span class="flex items-center gap-1">
                <button
                  v-if="currentStep.optional"
                  type="button"
                  class="rounded-full px-3 py-1.5 font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                  @click="answer('', true)"
                >
                  Skip
                </button>
                <button
                  v-if="stepIndex > 0 && !editing"
                  type="button"
                  class="inline-flex items-center gap-1 rounded-full px-3 py-1.5 font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                  @click="back"
                >
                  <ArrowLeftIcon class="size-3" aria-hidden="true" /> Back
                </button>
              </span>
            </div>
          </motion.div>

          <motion.p
            v-else
            key="idle"
            class="flex h-[5.25rem] items-center justify-center gap-2 text-sm text-muted-foreground"
            :initial="{ opacity: 0 }"
            :animate="{ opacity: 1 }"
            :exit="{ opacity: 0 }"
          >
            <template v-if="phase === 'review'">Check the brief above, then send it.</template>
            <template v-else-if="phase === 'sending'">One moment…</template>
            <template v-else-if="phase === 'done'">
              Prefer email? <a :href="`mailto:${site.email}`" class="font-medium text-foreground underline underline-offset-4">{{ site.email }}</a>
            </template>
            <template v-else>Zabi’s assistant is typing…</template>
          </motion.p>
        </AnimatePresence>

        <!-- Honeypot: invisible to people, irresistible to bots. -->
        <div class="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
          <label for="assistant-website">Website</label>
          <input id="assistant-website" v-model="honeypot" name="website" tabindex="-1" autocomplete="off" />
        </div>
      </footer>
    </section>
  </div>
</template>

<style scoped>
.orb-stage {
  background:
    radial-gradient(60% 55% at 50% 45%, color-mix(in oklch, var(--ember) 12%, transparent), transparent 70%),
    linear-gradient(var(--card), var(--background));
}

.orb-stage::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(to right, color-mix(in oklch, var(--foreground) 6%, transparent) 1px, transparent 1px),
    linear-gradient(to bottom, color-mix(in oklch, var(--foreground) 6%, transparent) 1px, transparent 1px);
  background-size: 40px 40px;
  mask-image: radial-gradient(circle at 50% 45%, #000 0%, transparent 70%);
  pointer-events: none;
}

.status-dot {
  background: var(--muted-foreground);
}
.status-dot[data-state='speaking'],
.status-dot[data-state='listening'] {
  background: var(--ember);
  animation: status-pulse 0.9s ease-in-out infinite;
}
.status-dot[data-state='thinking'] {
  background: var(--cobalt);
  animation: status-pulse 0.5s ease-in-out infinite;
}
.status-dot[data-state='success'] {
  background: var(--success);
}
.status-dot[data-state='error'] {
  background: var(--destructive);
}

@keyframes status-pulse {
  50% {
    opacity: 0.35;
    transform: scale(0.7);
  }
}

.dot {
  animation: dot-bounce 1s var(--ease-in-out-quart) infinite;
}

@keyframes dot-bounce {
  0%,
  60%,
  100% {
    transform: translateY(0);
    opacity: 0.45;
  }
  30% {
    transform: translateY(-4px);
    opacity: 1;
  }
}
</style>
