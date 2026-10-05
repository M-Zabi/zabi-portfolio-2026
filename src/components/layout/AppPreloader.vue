<script setup lang="ts">
import { useRafFn } from '@vueuse/core'
import { animate, AnimatePresence, motion, stagger, useReducedMotion } from 'motion-v'
import { computed, onMounted, ref, useTemplateRef } from 'vue'

import { site } from '@/config/site'
import { ease } from '@/lib/motion'
import { sleep } from '@/lib/utils'
import { useBootStore } from '@/stores/boot'

import AppMark from './AppMark.vue'

/**
 * 0 → 100% preloader.
 *
 * The count follows *real* work registered in the boot store (fonts, first route, the
 * WebGL scene), eased so it never jumps, and capped by a minimum duration so the
 * sequence always reads. It never runs backwards when new work registers late.
 */
const boot = useBootStore()
const reducedMotion = useReducedMotion()

const root = useTemplateRef<HTMLElement>('root')
const visible = ref(true)
const display = ref(0)
const startedAt = performance.now()
// The full sequence plays once per session; reloads and deep links get a quicker count.
const SEEN_KEY = 'zabi-preloader-seen'
const seen = (() => {
  try {
    return sessionStorage.getItem(SEEN_KEY) === '1'
  } catch {
    return false
  }
})()
const minDuration = reducedMotion.value ? 600 : seen ? 900 : 2400
let exiting = false

const percent = computed(() => Math.round(display.value * 100))
const digits = computed(() => String(percent.value).padStart(3, '0').split('').map(Number))

const statuses = ['Booting runtime', 'Compiling shaders', 'Tuning springs', 'Aligning pixels', 'Ready']
const status = computed(
  () => statuses[Math.min(statuses.length - 1, Math.floor(display.value * (statuses.length - 1)))]!,
)

const year = new Date().getFullYear()

const { pause } = useRafFn(({ delta }) => {
  const elapsed = performance.now() - startedAt
  const target = Math.min(boot.progress, elapsed / minDuration)
  const next = display.value + (target - display.value) * (1 - Math.exp(-delta / 170))
  display.value = Math.max(display.value, next)

  if (boot.progress >= 1 && target >= 1 && 1 - display.value < 0.004) {
    display.value = 1
    pause()
    void exit()
  }
})

onMounted(() => {
  if (!root.value || reducedMotion.value) return
  animate(
    root.value.querySelectorAll('[data-item]'),
    { transform: ['translateY(110%)', 'translateY(0%)'] },
    { duration: 1, delay: stagger(0.08, { startDelay: 0.1 }), ease: ease.outQuint },
  )
})

async function exit() {
  if (exiting || !root.value) return
  exiting = true
  await sleep(220)

  if (reducedMotion.value) {
    boot.beginReveal()
    await animate(root.value, { opacity: 0 }, { duration: 0.35 }).finished
    return done()
  }

  // 1 · copy and counter leave upward
  await animate(
    root.value.querySelectorAll('[data-item]'),
    { transform: ['translateY(0%)', 'translateY(-110%)'] },
    { duration: 0.65, delay: stagger(0.04), ease: ease.inOutQuart },
  ).finished

  // 2 · two curtain layers lift; the hero starts revealing underneath
  const lift = { transform: ['translateY(0%)', 'translateY(-100%)'] }
  const front = animate(root.value.querySelectorAll('[data-col="front"]'), lift, {
    duration: 0.95,
    delay: stagger(0.06),
    ease: ease.inOutQuart,
  })
  const back = animate(root.value.querySelectorAll('[data-col="back"]'), lift, {
    duration: 0.95,
    delay: stagger(0.06, { startDelay: 0.16 }),
    ease: ease.inOutQuart,
  })
  setTimeout(() => boot.beginReveal(), 520)
  await Promise.all([front.finished, back.finished])
  done()
}

function done() {
  try {
    sessionStorage.setItem(SEEN_KEY, '1')
  } catch {
    // Storage blocked — the full sequence simply plays again next time.
  }
  boot.beginReveal()
  boot.finish()
  visible.value = false
}
</script>

<template>
  <div
    v-if="visible"
    ref="root"
    class="fixed inset-0 z-[100] cursor-progress select-none"
    role="progressbar"
    aria-label="Loading portfolio"
    aria-valuemin="0"
    aria-valuemax="100"
    :aria-valuenow="percent"
  >
    <div class="absolute inset-0 flex" aria-hidden="true">
      <div v-for="index in 5" :key="index" data-col="back" class="-mr-px h-full flex-1 bg-ember" />
    </div>
    <div class="absolute inset-0 flex" aria-hidden="true">
      <div v-for="index in 5" :key="index" data-col="front" class="-mr-px h-full flex-1 bg-ink" />
    </div>

    <div class="absolute inset-0 flex flex-col justify-between p-(--gutter) text-paper" aria-hidden="true">
      <div class="flex items-start justify-between gap-6 pt-3">
        <div class="overflow-hidden">
          <div data-item class="pre-item flex items-center gap-3">
            <AppMark class="h-5 text-ember" />
            <span class="font-display text-lg font-bold tracking-tight uppercase [font-stretch:118%]">
              {{ site.name }}
            </span>
          </div>
        </div>
        <div class="overflow-hidden text-right">
          <p data-item class="pre-item text-label opacity-60">
            Portfolio © {{ year }}<br />{{ site.shortRole }}
          </p>
        </div>
      </div>

      <div class="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div class="overflow-hidden">
          <div data-item class="pre-item counter flex font-display tabular">
            <span v-for="(digit, index) in digits" :key="index" class="reel">
              <span class="reel-strip" :style="{ transform: `translateY(${-digit * 10}%)` }">
                <span v-for="n in 10" :key="n">{{ n - 1 }}</span>
              </span>
            </span>
            <span class="percent">%</span>
          </div>
        </div>

        <div class="overflow-hidden pb-[1.4vw]">
          <div data-item class="pre-item text-label flex items-center gap-3 text-paper/70">
            <span class="inline-block size-1.5 rounded-full bg-ember" />
            <AnimatePresence mode="wait" :initial="false">
              <motion.span
                :key="status"
                :initial="{ opacity: 0, y: 8 }"
                :animate="{ opacity: 1, y: 0 }"
                :exit="{ opacity: 0, y: -8 }"
                :transition="{ duration: 0.25, ease: ease.outQuint }"
              >
                {{ status }}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div class="absolute inset-x-0 bottom-0 h-1 origin-left bg-ember" :style="{ transform: `scaleX(${display})` }" />
    </div>
  </div>
</template>

<style scoped>
.pre-item {
  transform: translateY(110%);
}

@media (prefers-reduced-motion: reduce) {
  .pre-item {
    transform: none;
  }
}

.counter {
  font-size: clamp(6.5rem, 2rem + 21vw, 21rem);
  font-weight: 700;
  font-stretch: 112%;
  line-height: 0.8;
  letter-spacing: -0.06em;
}

.reel {
  display: inline-block;
  height: 0.8em;
  overflow: hidden;
}

.reel-strip {
  display: flex;
  flex-direction: column;
  transition: transform 0.7s var(--ease-out-expo);
}

.reel-strip > span {
  height: 0.8em;
  line-height: 0.8;
}

.percent {
  margin-left: 0.06em;
  font-size: 0.28em;
  line-height: 1;
  color: var(--ember);
}
</style>
