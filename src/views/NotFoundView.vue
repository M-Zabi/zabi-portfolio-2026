<script setup lang="ts">
import { ShuffleIcon } from '@lucide/vue'
import { AnimatePresence, motion } from 'motion-v'
import { computed, ref, useTemplateRef } from 'vue'
import { useRoute } from 'vue-router'

import ArrowLink from '@/components/common/ArrowLink.vue'
import FadeIn from '@/components/motion/FadeIn.vue'
import RevealText from '@/components/motion/RevealText.vue'
import MemeCard from '@/components/not-found/MemeCard.vue'
import { buttonVariants } from '@/components/ui/button'
import { usePageMeta } from '@/composables/usePageMeta'
import { pages } from '@/config/seo'
import { memes } from '@/content/memes'
import { ease } from '@/lib/motion'
import { pickIndex } from '@/lib/random'

usePageMeta({ ...pages.notFound, noindex: true })

const route = useRoute()

/** A random meme stands in for the "0" of 404; shuffling never repeats the one on screen. */
const index = ref(pickIndex(memes.length))
const meme = computed(() => memes[index.value]!)
const count = (value: number) => String(value).padStart(2, '0')

const shuffleButton = useTemplateRef<HTMLButtonElement>('shuffleButton')

function shuffle() {
  index.value = pickIndex(memes.length, index.value)
}

/** The card's own buttons leave with the card, so focus moves to the shuffle button first. */
function shuffleFromCard() {
  shuffleButton.value?.focus()
  shuffle()
}
</script>

<template>
  <section class="container-page pb-20 lg:pb-24">
    <div class="flex min-h-svh flex-col pt-(--header-h)">
      <FadeIn
        :y="10"
        class="flex items-center justify-between gap-6 border-b border-border py-5 text-label text-muted-foreground"
      >
        <p class="shrink-0">(404) Lost in transit</p>
        <p class="hidden min-w-0 truncate sm:block">
          <span aria-hidden="true">GET </span><span class="sr-only">Requested path: </span
          >{{ route.path }}
        </p>
      </FadeIn>

      <div class="flex flex-1 items-center justify-center py-12 lg:py-16">
        <!-- The 4s share the card's grid row, so they centre on the card rather than card + caption. -->
        <figure
          class="grid w-full justify-items-center gap-y-6 lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-x-[2.5vw]"
        >
          <FadeIn
            :delay="0.05"
            :y="48"
            class="four hidden lg:block lg:justify-self-end"
            aria-hidden="true"
          >
            4
          </FadeIn>

          <FadeIn :delay="0.15" :y="32" class="meme-width">
            <div aria-live="polite">
              <AnimatePresence mode="wait" :initial="false">
                <motion.div
                  :key="meme.id"
                  class="relative"
                  :initial="{ opacity: 0, y: -28, rotate: -9 }"
                  :animate="{ opacity: 1, y: 0, rotate: -2 }"
                  :exit="{ opacity: 0, x: 72, rotate: 10 }"
                  :while-hover="{ rotate: 0 }"
                  :transition="{ duration: 0.3, ease: ease.outQuint }"
                >
                  <MemeCard :meme="meme" @shuffle="shuffleFromCard" />
                  <span class="tape" aria-hidden="true" />
                </motion.div>
              </AnimatePresence>
            </div>
          </FadeIn>

          <FadeIn
            :delay="0.25"
            :y="48"
            class="four hidden lg:block lg:justify-self-start"
            aria-hidden="true"
          >
            4
          </FadeIn>

          <FadeIn
            as="figcaption"
            :delay="0.3"
            :y="12"
            class="meme-width flex items-center justify-between gap-6 lg:col-start-2"
          >
            <!-- Two fixed lines, so a long meme name never reflows the row and nudges the card. -->
            <span class="min-w-0 text-label text-muted-foreground tabular">
              <span class="block">Meme {{ count(index + 1) }} / {{ count(memes.length) }}</span>
              <span class="block truncate text-foreground">{{ meme.name }}</span>
            </span>
            <button
              ref="shuffleButton"
              type="button"
              :class="buttonVariants({ variant: 'outline', size: 'pill' })"
              class="shrink-0 border-foreground/20 font-mono [font-stretch:90%]"
              @click="shuffle"
            >
              <ShuffleIcon aria-hidden="true" />
              Another one
            </button>
          </FadeIn>
        </figure>
      </div>
    </div>

    <div class="grid gap-x-10 gap-y-8 border-t border-border pt-10 lg:grid-cols-12 lg:pt-14">
      <h1 class="font-display text-display-md lg:col-span-7">
        <RevealText :text="'This page took\na *different route.*'" />
      </h1>
      <div class="flex flex-col gap-8 lg:col-span-5 lg:pt-2">
        <FadeIn as="p" :delay="0.2" class="max-w-[40ch] text-lead text-muted-foreground">
          The link may be old or mistyped, or the page has moved. Everything else is right where you
          left it.
        </FadeIn>
        <FadeIn :delay="0.3" class="flex flex-wrap gap-x-6 gap-y-2">
          <ArrowLink to="/" label="Back home" />
          <ArrowLink to="/work" label="See the work" />
        </FadeIn>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* The two 4s of "404"; the meme card is the 0. Sized so a 4 stands about as tall as the card. */
.four {
  font-family: var(--font-display);
  font-size: clamp(22rem, 40vw, 40rem);
  font-weight: 760;
  font-stretch: 80%;
  line-height: 0.74;
  user-select: none;
}

.meme-width {
  width: min(100%, 30rem);
}

@media (width >= 64rem) {
  .meme-width {
    width: clamp(18rem, 30vw, 30rem);
  }
}

/* A strip of tape holding the card to the page. */
.tape {
  position: absolute;
  top: -0.9rem;
  left: 50%;
  width: 7.5rem;
  height: 1.9rem;
  translate: -50% 0;
  rotate: 3deg;
  background: color-mix(in oklch, var(--paper) 62%, transparent);
  box-shadow: 0 0 0 1px color-mix(in oklch, var(--ink) 8%, transparent);
  pointer-events: none;
}
</style>
