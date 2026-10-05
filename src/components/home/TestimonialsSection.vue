<script setup lang="ts">
import { ArrowRightIcon } from '@lucide/vue'
import { useDocumentVisibility, useIntervalFn } from '@vueuse/core'
import { AnimatePresence, motion, useInView, useReducedMotion } from 'motion-v'
import { computed, ref, useTemplateRef, watch } from 'vue'

import FadeIn from '@/components/motion/FadeIn.vue'
import RevealText from '@/components/motion/RevealText.vue'
import { Button } from '@/components/ui/button'
import { site } from '@/config/site'
import { testimonials } from '@/content/profile'
import { blockClass } from '@/lib/brand'
import { ease } from '@/lib/motion'

const AUTOPLAY_MS = 6500

const root = useTemplateRef<HTMLElement>('root')
const inView = useInView(root, { amount: 0.4 })
const reducedMotion = useReducedMotion()
const visibility = useDocumentVisibility()

const index = ref(0)
const interacting = ref(false)
const userChose = ref(false)
const current = computed(() => testimonials[index.value]!)

const autoplay = computed(
  () => inView.value && !interacting.value && !userChose.value && !reducedMotion.value && visibility.value === 'visible',
)

const { pause, resume } = useIntervalFn(() => (index.value = (index.value + 1) % testimonials.length), AUTOPLAY_MS, {
  immediate: false,
})
watch(autoplay, (value) => (value ? resume() : pause()), { immediate: true })

function select(next: number) {
  index.value = (next + testimonials.length) % testimonials.length
  userChose.value = true
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowRight') select(index.value + 1)
  else if (event.key === 'ArrowLeft') select(index.value - 1)
  else return
  event.preventDefault()
  ;(event.currentTarget as HTMLElement).querySelector<HTMLElement>('[aria-selected="true"]')?.focus()
}

const initials = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
</script>

<template>
  <section
    ref="root"
    class="grain relative z-10 overflow-hidden bg-volt text-volt-foreground"
    aria-labelledby="testimonials-title"
    @pointerenter="interacting = true"
    @pointerleave="interacting = false"
    @focusin="interacting = true"
    @focusout="interacting = false"
  >
    <!-- Drifting wordmark columns, after the reference's patterned field. -->
    <div class="pointer-events-none absolute inset-0 flex justify-center gap-[3vw] opacity-[0.07]" aria-hidden="true">
      <!-- writing-mode goes on each word: on the flex column it would rotate the stacking axis too. -->
      <div
        v-for="column in 9"
        :key="column"
        class="flex shrink-0 flex-col gap-[0.15em] font-display text-[9rem] leading-[0.82] font-extrabold uppercase [font-stretch:125%]"
        :class="column % 2 ? 'drift-up' : 'drift-down'"
      >
        <span v-for="n in 8" :key="n" class="[writing-mode:vertical-rl]" :class="{ 'rotate-180': column % 2 === 1 }">
          {{ site.name }}
        </span>
      </div>
    </div>

    <div class="section-y container-page relative flex flex-col items-center text-center">
      <h2 id="testimonials-title" class="font-display text-[clamp(2rem,1.4rem+2.6vw,3.5rem)] leading-[1.02] font-semibold tracking-[-0.035em]">
        <RevealText :text="'Don’t take my word for it.\nTake theirs.'" emphasis-class="" />
      </h2>

      <FadeIn :delay="0.15" class="mt-10">
        <div role="tablist" aria-label="Testimonials" class="flex items-center gap-3" @keydown="onKeydown">
          <button
            v-for="(item, itemIndex) in testimonials"
            :key="item.id"
            type="button"
            role="tab"
            :id="`testimonial-tab-${item.id}`"
            :aria-selected="itemIndex === index"
            :aria-controls="`testimonial-panel`"
            :tabindex="itemIndex === index ? 0 : -1"
            :aria-label="`${item.name}, ${item.company}`"
            class="relative grid size-11 place-items-center rounded-full transition-[scale,filter] duration-500 ease-out-expo"
            :class="itemIndex === index ? 'scale-125' : 'scale-90 grayscale-[0.6] hover:scale-100'"
            @click="select(itemIndex)"
          >
            <span
              class="grid size-full place-items-center rounded-full font-display text-sm font-bold ring-2 ring-volt"
              :class="blockClass[item.color]"
            >
              {{ initials(item.name) }}
            </span>
            <svg
              v-if="itemIndex === index && autoplay"
              :key="`ring-${index}`"
              class="ring-progress pointer-events-none absolute -inset-1 size-[calc(100%+0.5rem)] -rotate-90"
              viewBox="0 0 40 40"
              aria-hidden="true"
              :style="{ '--duration': `${AUTOPLAY_MS}ms` }"
            >
              <circle cx="20" cy="20" r="18.5" fill="none" stroke="currentColor" stroke-width="1.5" pathLength="1" />
            </svg>
          </button>
        </div>
      </FadeIn>

      <div
        id="testimonial-panel"
        role="tabpanel"
        :aria-labelledby="`testimonial-tab-${current.id}`"
        :aria-live="autoplay ? 'off' : 'polite'"
        class="mt-10 grid min-h-[17rem] w-full max-w-3xl place-items-start justify-items-center sm:min-h-[15rem]"
      >
        <AnimatePresence mode="wait" :initial="false">
          <motion.figure
            :key="current.id"
            class="col-start-1 row-start-1 flex flex-col items-center"
            :initial="{ opacity: 0, y: 18, filter: 'blur(8px)' }"
            :animate="{ opacity: 1, y: 0, filter: 'blur(0px)' }"
            :exit="{ opacity: 0, y: -14, filter: 'blur(8px)' }"
            :transition="{ duration: 0.55, ease: ease.outQuint }"
          >
            <blockquote class="text-[clamp(1.25rem,1.05rem+0.9vw,1.75rem)] leading-snug text-balance">
              “{{ current.quote }}”
            </blockquote>
            <figcaption class="mt-8">
              <span class="block font-display text-xl font-extrabold tracking-tight uppercase [font-stretch:125%]">
                {{ current.name }}
              </span>
              <span class="mt-1 block text-sm opacity-75">{{ current.role }}, {{ current.company }}</span>
            </figcaption>
          </motion.figure>
        </AnimatePresence>
      </div>

      <!-- The volt block is identical in both themes, so the CTA uses its on-colour, not theme ink. -->
      <Button
        v-if="current.projectSlug"
        as-child
        size="pill"
        class="mt-4 bg-volt-foreground text-volt shadow-[0_18px_40px_-18px_rgb(0_0_0/0.6)] hover:bg-volt-foreground/85"
      >
        <RouterLink :to="{ name: 'project', params: { slug: current.projectSlug } }">
          Read the case study
          <ArrowRightIcon aria-hidden="true" />
        </RouterLink>
      </Button>
    </div>
  </section>
</template>

<style scoped>
.drift-up {
  animation: drift 48s linear infinite alternate;
}

.drift-down {
  animation: drift 48s linear infinite alternate-reverse;
}

@keyframes drift {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(-30%);
  }
}

.ring-progress circle {
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  animation: ring var(--duration) linear forwards;
}

@keyframes ring {
  to {
    stroke-dashoffset: 0;
  }
}
</style>
