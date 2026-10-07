<script setup lang="ts">
import { EyeIcon, EyeOffIcon, LoaderIcon, LockIcon } from '@lucide/vue'
import { useIntervalFn } from '@vueuse/core'
import { animate, AnimatePresence, motion, useReducedMotion } from 'motion-v'
import { computed, nextTick, onMounted, ref, shallowRef, useTemplateRef } from 'vue'

import FadeIn from '@/components/motion/FadeIn.vue'
import RevealText from '@/components/motion/RevealText.vue'
import { getLenis } from '@/composables/useLenis'
import { usePageMeta } from '@/composables/usePageMeta'
import { ease, spring } from '@/lib/motion'
import { sleep } from '@/lib/utils'
import { openVault, type SealedVault, VaultLockedError } from '@/lib/vault'
import { useTransitionStore } from '@/stores/transition'
import type { VaultPage } from '@/types/vault'

import HomeRemix from './HomeRemix.vue'

/**
 * A locked door. The password decrypts the page in the browser (see lib/vault.ts); nothing is
 * sent anywhere. Success opens the shackle, drops the route curtain with the page's own label
 * and reveals what was behind it. Nothing is remembered: every visit and every reload starts
 * locked again.
 *
 * Every `:animate` target below keeps the same keys in every phase — motion-v throws
 * (`getBaseTarget is not a function`) when a key disappears between states.
 */
const props = defineProps<{ sealed: SealedVault }>()

type Phase = 'idle' | 'verifying' | 'wrong' | 'cooldown' | 'opening'

const MAX_TRIES = 3
const COOLDOWN_SECONDS = 15

const page = shallowRef<VaultPage | null>(null)
const phase = ref<Phase>('idle')
const password = ref('')
const reveal = ref(false)
const tries = ref(0)
const cooldown = ref(0)
const message = ref('')

const reducedMotion = useReducedMotion()
const transition = useTransitionStore()
const input = useTemplateRef<HTMLInputElement>('input')
const form = useTemplateRef<HTMLFormElement>('form')

usePageMeta(() =>
  page.value?.kind === 'home-remix'
    ? { title: page.value.curtain, description: 'Private.', noindex: true }
    : { title: 'Private', description: 'Nothing to see here.', noindex: true },
)

const misses = ['Not quite.', 'Nope — try again.', 'Warm. Not hot.', 'That’s not it either.']
const busy = computed(() => phase.value === 'verifying' || phase.value === 'opening' || phase.value === 'cooldown')
const dots = computed(() => Array.from(password.value, (_, index) => index))

const { pause: stopCooldown, resume: startCooldown } = useIntervalFn(
  () => {
    cooldown.value -= 1
    if (cooldown.value > 0) return
    stopCooldown()
    phase.value = 'idle'
    tries.value = 0
    message.value = 'Okay — go again.'
    void nextTick(() => input.value?.focus())
  },
  1000,
  { immediate: false },
)

async function unlock() {
  if (busy.value || !password.value) return
  phase.value = 'verifying'
  message.value = 'Deriving the key…'
  try {
    // Both run together: the minimum keeps the moment readable on fast machines.
    const [opened] = await Promise.all([
      openVault<VaultPage>(props.sealed, password.value),
      reducedMotion.value ? Promise.resolve() : sleep(650),
    ])
    await open(opened)
  } catch (error) {
    if (!(error instanceof VaultLockedError)) {
      phase.value = 'idle'
      message.value = 'This browser can’t open it. Try a newer one over HTTPS.'
      return
    }
    tries.value += 1
    password.value = ''
    if (tries.value >= MAX_TRIES) {
      phase.value = 'cooldown'
      cooldown.value = COOLDOWN_SECONDS
      message.value = ''
      startCooldown()
    } else {
      phase.value = 'wrong'
      message.value = misses[(tries.value - 1) % misses.length]!
      if (!reducedMotion.value && form.value) {
        animate(form.value, { x: [0, -14, 12, -8, 6, -3, 0] }, { duration: 0.5, ease: 'easeInOut' })
      }
      await nextTick()
      input.value?.focus()
    }
  }
}

async function open(opened: VaultPage) {
  phase.value = 'opening'
  message.value = 'Unlocked.'
  if (!reducedMotion.value) await sleep(650)

  // The site's own route curtain carries the page in, labelled by the page itself.
  const lenis = getLenis()
  lenis?.stop()
  await transition.cover(opened.curtain)
  page.value = opened
  await nextTick()
  window.scrollTo(0, 0)
  lenis?.scrollTo(0, { immediate: true, force: true })
  lenis?.resize()
  lenis?.start()
  await transition.reveal()
}

async function lock() {
  const lenis = getLenis()
  lenis?.stop()
  await transition.cover('Locked')
  page.value = null
  password.value = ''
  tries.value = 0
  phase.value = 'idle'
  message.value = ''
  await nextTick()
  lenis?.scrollTo(0, { immediate: true, force: true })
  lenis?.resize()
  lenis?.start()
  await transition.reveal()
  input.value?.focus()
}

function onInput() {
  if (phase.value === 'wrong') {
    phase.value = 'idle'
    message.value = ''
  }
}

onMounted(() => setTimeout(() => input.value?.focus({ preventScroll: true }), 900))
</script>

<template>
  <template v-if="page">
    <HomeRemix v-if="page.kind === 'home-remix'" :page="page" />
    <button
      type="button"
      class="text-label fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 z-40 inline-flex h-10 items-center gap-2 rounded-full border border-border bg-background/80 px-4 backdrop-blur-md transition-colors hover:bg-muted"
      @click="lock"
    >
      <LockIcon class="size-3.5" aria-hidden="true" />
      Lock
    </button>
  </template>

  <section v-else class="vault relative isolate flex min-h-svh items-center overflow-hidden pt-(--header-h)" aria-labelledby="vault-title">
    <div class="vault-grid pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />

    <div class="container-page grid items-center gap-14 py-16 lg:grid-cols-12">
      <div class="lg:col-span-6">
        <FadeIn as="p" :y="10" class="text-label text-muted-foreground">(Private)</FadeIn>
        <h1 id="vault-title" class="mt-6 font-display text-display-lg">
          <RevealText :text="'You found\na *door.*'" trigger="ready" />
        </h1>
        <FadeIn as="p" :delay="0.35" class="mt-8 max-w-[38ch] text-lead text-muted-foreground">
          It’s locked. If you know the word, you know the way in.
        </FadeIn>
      </div>

      <div class="flex flex-col items-center lg:col-span-5 lg:col-start-8">
        <!-- The lock -->
        <FadeIn :delay="0.2" :y="24" class="relative grid size-56 place-items-center sm:size-64">
          <svg viewBox="0 0 200 200" class="orbits absolute inset-0 size-full" :data-phase="phase" aria-hidden="true">
            <circle cx="100" cy="100" r="96" class="fill-none stroke-border" stroke-width="1" />
            <circle cx="100" cy="100" r="80" class="orbit-dash fill-none stroke-foreground/25" stroke-width="1.5" stroke-dasharray="3 9" />
            <circle cx="100" cy="4" r="3.5" class="orbit-sat fill-primary" />
          </svg>

          <motion.div
            class="lock-block grain relative grid size-32 place-items-center rounded-[2.25rem] sm:size-36"
            :data-phase="phase"
            :animate="
              phase === 'opening'
                ? { scale: [1, 1.1, 1], rotate: [0, -4, 0] }
                : phase === 'verifying'
                  ? { scale: [1, 0.96, 1], rotate: 0 }
                  : { scale: 1, rotate: 0 }
            "
            :transition="phase === 'verifying' ? { duration: 0.9, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.6, ease: ease.outQuint }"
          >
            <svg viewBox="0 0 64 64" class="relative size-16 overflow-visible" aria-hidden="true">
              <motion.path
                d="M20 29 V20 a12 12 0 0 1 24 0 V29"
                fill="none"
                stroke="currentColor"
                stroke-width="5"
                stroke-linecap="round"
                :style="{ transformOrigin: '100% 100%' }"
                :animate="
                  phase === 'opening'
                    ? { y: -9, rotate: 28 }
                    : phase === 'verifying'
                      ? { y: [0, -3, 0], rotate: 0 }
                      : { y: 0, rotate: 0 }
                "
                :transition="
                  phase === 'verifying'
                    ? { duration: 0.45, repeat: Infinity, ease: 'easeInOut' }
                    : phase === 'opening'
                      ? spring.soft
                      : spring.snappy
                "
              />
              <rect x="12" y="28" width="40" height="30" rx="8" fill="currentColor" />
              <circle cx="32" cy="41" r="4" class="keyhole" />
              <rect x="30.5" y="43" width="3" height="7" rx="1.5" class="keyhole" />
            </svg>
          </motion.div>
        </FadeIn>

        <!-- The form -->
        <FadeIn :delay="0.45" class="mt-10 w-full max-w-md">
          <form ref="form" novalidate @submit.prevent="unlock">
            <label for="vault-password" class="sr-only">Password</label>
            <div class="field relative flex h-16 items-center gap-3 rounded-full border bg-card pr-2 pl-6" :data-phase="phase">
              <span class="field-ring pointer-events-none absolute -inset-px rounded-full" aria-hidden="true" />
              <div class="relative min-w-0 flex-1">
                <input
                  id="vault-password"
                  ref="input"
                  v-model="password"
                  :type="reveal ? 'text' : 'password'"
                  name="password"
                  autocomplete="current-password"
                  autocapitalize="off"
                  spellcheck="false"
                  :disabled="busy"
                  :aria-invalid="phase === 'wrong'"
                  aria-describedby="vault-status"
                  :placeholder="phase === 'cooldown' ? '' : 'The word'"
                  class="w-full bg-transparent py-2 text-lg outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
                  :class="!reveal && password ? 'text-transparent caret-transparent' : ''"
                  @input="onInput"
                />
                <!-- Custom dots that pop in as you type (the real input sits underneath). -->
                <span v-if="!reveal && password" class="pointer-events-none absolute inset-y-0 left-0 flex items-center gap-1.5 overflow-hidden" aria-hidden="true">
                  <AnimatePresence :initial="false">
                    <motion.span
                      v-for="dot in dots"
                      :key="dot"
                      class="size-2.5 shrink-0 rounded-full bg-foreground"
                      :initial="{ scale: 0, y: 6 }"
                      :animate="{ scale: 1, y: 0 }"
                      :exit="{ scale: 0, opacity: 0 }"
                      :transition="spring.snappy"
                    />
                  </AnimatePresence>
                  <span class="dots-caret ml-0.5 h-6 w-0.5 rounded-full bg-primary" />
                </span>
              </div>
              <button
                type="button"
                class="grid size-11 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                :aria-label="reveal ? 'Hide password' : 'Show password'"
                :aria-pressed="reveal"
                :disabled="busy"
                @click="reveal = !reveal"
              >
                <EyeOffIcon v-if="reveal" class="size-[1.15rem]" aria-hidden="true" />
                <EyeIcon v-else class="size-[1.15rem]" aria-hidden="true" />
              </button>
              <button
                type="submit"
                class="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-full bg-foreground text-background transition-[transform,opacity] duration-200 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
                :disabled="busy || !password"
                aria-label="Unlock"
              >
                <AnimatePresence mode="popLayout" :initial="false">
                  <motion.span
                    :key="phase === 'verifying' ? 'busy' : phase === 'opening' ? 'open' : 'go'"
                    class="grid place-items-center"
                    :initial="{ y: 18, opacity: 0 }"
                    :animate="{ y: 0, opacity: 1 }"
                    :exit="{ y: -18, opacity: 0 }"
                    :transition="spring.snappy"
                  >
                    <LoaderIcon v-if="phase === 'verifying'" class="size-5 animate-spin" aria-hidden="true" />
                    <svg v-else-if="phase === 'opening'" viewBox="0 0 24 24" class="size-5 fill-none stroke-current" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <path d="M5 12.5l4.5 4.5L19 7.5" class="tick" />
                    </svg>
                    <svg v-else viewBox="0 0 24 24" class="size-5 fill-none stroke-current" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </motion.span>
                </AnimatePresence>
              </button>
            </div>

            <div id="vault-status" class="mt-4 flex min-h-6 items-center justify-center gap-2 text-sm" aria-live="polite">
              <template v-if="phase === 'cooldown'">
                <svg viewBox="0 0 20 20" class="size-5 -rotate-90" aria-hidden="true">
                  <circle cx="10" cy="10" r="8" class="fill-none stroke-border" stroke-width="2" />
                  <circle
                    cx="10"
                    cy="10"
                    r="8"
                    class="fill-none stroke-primary transition-[stroke-dashoffset] duration-1000 ease-linear"
                    stroke-width="2"
                    :stroke-dasharray="50.27"
                    :stroke-dashoffset="50.27 * (1 - cooldown / COOLDOWN_SECONDS)"
                  />
                </svg>
                <span class="text-muted-foreground">Too many tries. Breathe — <span class="tabular font-medium text-foreground">{{ cooldown }}s</span></span>
              </template>
              <motion.span
                v-else-if="message"
                :key="message"
                :class="phase === 'wrong' ? 'font-medium text-destructive' : phase === 'opening' ? 'font-medium text-success' : 'text-muted-foreground'"
                :initial="{ opacity: 0, y: 6 }"
                :animate="{ opacity: 1, y: 0 }"
                :transition="{ duration: 0.3, ease: ease.outQuint }"
              >
                {{ message }}
              </motion.span>
              <span v-else class="text-label text-muted-foreground">Decrypted in your browser · nothing is sent</span>
            </div>
          </form>
        </FadeIn>
      </div>
    </div>
  </section>
</template>

<style scoped>
.vault-grid {
  background:
    radial-gradient(45% 50% at 75% 50%, color-mix(in oklch, var(--ember) 14%, transparent), transparent 70%),
    linear-gradient(to right, color-mix(in oklch, var(--foreground) 5%, transparent) 1px, transparent 1px) 0 0 / 48px 48px,
    linear-gradient(to bottom, color-mix(in oklch, var(--foreground) 5%, transparent) 1px, transparent 1px) 0 0 / 48px 48px;
  mask-image: radial-gradient(ellipse at 70% 50%, #000 10%, transparent 75%);
}

/* ───── Lock ───── */

.lock-block {
  background: var(--ember);
  color: var(--ember-foreground);
  box-shadow: 0 40px 80px -30px color-mix(in oklch, var(--ember) 70%, transparent);
  transition:
    background-color 0.4s,
    color 0.4s,
    box-shadow 0.4s;
}

.lock-block[data-phase='wrong'] {
  background: var(--destructive);
  color: oklch(0.99 0 0);
}

.lock-block[data-phase='opening'] {
  background: var(--mint);
  color: var(--mint-foreground);
  box-shadow: 0 40px 90px -24px color-mix(in oklch, var(--mint) 80%, transparent);
}

.lock-block[data-phase='cooldown'] {
  background: var(--muted);
  color: var(--muted-foreground);
}

.keyhole {
  fill: var(--ember);
  transition: fill 0.4s;
}
.lock-block[data-phase='wrong'] .keyhole {
  fill: var(--destructive);
}
.lock-block[data-phase='opening'] .keyhole {
  fill: var(--mint);
}
.lock-block[data-phase='cooldown'] .keyhole {
  fill: var(--muted);
}

.orbits {
  animation: orbit 24s linear infinite;
}
.orbits[data-phase='verifying'] {
  animation-duration: 1.6s;
}
.orbits[data-phase='opening'] {
  animation-duration: 0.9s;
}
.orbit-dash {
  transform-origin: center;
  animation: orbit 40s linear infinite reverse;
}

@keyframes orbit {
  to {
    transform: rotate(360deg);
  }
}

/* ───── Field ───── */

.field {
  border-color: var(--input);
  transition:
    border-color 0.25s,
    box-shadow 0.25s;
}

.field:focus-within {
  border-color: var(--ring);
  box-shadow: 0 0 0 4px color-mix(in oklch, var(--ring) 22%, transparent);
}

.field[data-phase='wrong'] {
  border-color: var(--destructive);
  box-shadow: 0 0 0 4px color-mix(in oklch, var(--destructive) 18%, transparent);
}

.field[data-phase='opening'] {
  border-color: var(--success);
}

/* A light runs round the field while the key is derived. */
.field-ring {
  padding: 1.5px;
  opacity: 0;
  background: conic-gradient(from var(--angle), transparent 0deg, var(--ember) 60deg, var(--volt) 120deg, transparent 180deg);
  -webkit-mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  transition: opacity 0.3s;
}

.field[data-phase='verifying'] .field-ring {
  opacity: 1;
  animation: ring-spin 1.1s linear infinite;
}

@property --angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}

@keyframes ring-spin {
  to {
    --angle: 360deg;
  }
}

.dots-caret {
  animation: caret 1s steps(1) infinite;
}

@keyframes caret {
  50% {
    opacity: 0;
  }
}

.tick {
  stroke-dasharray: 24;
  stroke-dashoffset: 24;
  animation: tick 0.45s var(--ease-out-quint) 0.1s forwards;
}

@keyframes tick {
  to {
    stroke-dashoffset: 0;
  }
}
</style>
