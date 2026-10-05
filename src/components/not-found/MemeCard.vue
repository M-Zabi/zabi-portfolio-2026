<script setup lang="ts">
import {
  BrainIcon,
  CoffeeIcon,
  FlameIcon,
  HandIcon,
  MinusIcon,
  PointerIcon,
  SquareIcon,
  TriangleAlertIcon,
  XIcon,
} from '@lucide/vue'
import { RouterLink } from 'vue-router'

import type { Meme } from '@/content/memes'

/**
 * One meme, drawn in the site's colour blocks. Every size is in container units, so the
 * card scales as a single piece from a phone to the desktop stage. "Two buttons" and the
 * error dialog have working buttons: they go home or shuffle to another meme.
 */
defineProps<{ meme: Meme }>()
const emit = defineEmits<{ shuffle: [] }>()

const surface: Record<Meme['format'], string> = {
  drake: 'bg-volt text-volt-foreground',
  nobody: 'bg-paper text-ink ring-1 ring-ink/15 ring-inset',
  brain: 'bg-cobalt text-cobalt-foreground',
  buttons: 'bg-blush text-blush-foreground',
  dialog: 'bg-mint text-mint-foreground',
  fine: 'bg-ember text-ember-foreground',
  sign: 'bg-ink text-paper',
}

/** Brighter panel, bigger brain. */
const brainPanels = [
  'bg-ink/30',
  'bg-ink/10',
  'bg-cobalt-foreground/20',
  'bg-volt text-volt-foreground shadow-[inset_0_0_8cqw_var(--paper)]',
]

/** Flame sizes (cqw) along the bottom of "This is fine". */
const flames = [13, 18, 15, 21, 16, 19, 14]
</script>

<template>
  <div
    class="grain @container aspect-square w-full overflow-hidden rounded-[1.25rem]"
    :class="surface[meme.format]"
  >
    <!-- Drakeposting -->
    <div v-if="meme.format === 'drake'" class="grid h-full grid-rows-2">
      <div class="grid grid-cols-[42%_1fr] border-b border-volt-foreground/15">
        <div class="grid place-items-center bg-volt-foreground/[0.07]">
          <HandIcon class="size-[18cqw] -rotate-12" :stroke-width="1.4" aria-hidden="true" />
        </div>
        <p
          class="self-center px-[6cqw] font-display text-[6.6cqw] leading-[1.08] text-balance opacity-70"
        >
          <span class="sr-only">No: </span>{{ meme.nope }}
        </p>
      </div>
      <div class="grid grid-cols-[42%_1fr]">
        <div class="grid place-items-center bg-volt-foreground/[0.07]">
          <PointerIcon class="size-[18cqw] rotate-90" :stroke-width="1.4" aria-hidden="true" />
        </div>
        <p
          class="self-center px-[6cqw] font-display text-[6.6cqw] leading-[1.08] font-bold text-balance"
        >
          <span class="sr-only">Yes: </span>{{ meme.yep }}
        </p>
      </div>
    </div>

    <!-- Nobody: -->
    <div v-else-if="meme.format === 'nobody'" class="flex h-full flex-col p-[7cqw]">
      <p class="font-mono text-[3.2cqw] tracking-[0.06em] uppercase opacity-60">
        Overheard on the internet
      </p>
      <div class="mt-auto space-y-[1.5cqw] font-display text-[6.4cqw] leading-[1.15]">
        <p v-for="line in meme.lines" :key="line">{{ line }}</p>
      </div>
      <p
        class="mt-[1cqw] font-display text-[36cqw] leading-[0.8] font-extrabold tracking-[-0.06em] [font-stretch:85%]"
      >
        {{ meme.punchline }}
      </p>
    </div>

    <!-- Expanding brain -->
    <ol v-else-if="meme.format === 'brain'" class="grid h-full grid-rows-4">
      <li
        v-for="(step, index) in meme.steps"
        :key="step"
        class="grid grid-cols-[1fr_32%] border-cobalt-foreground/15 not-last:border-b"
      >
        <p
          class="self-center px-[6cqw] font-display text-[5.8cqw] leading-[1.1]"
          :style="{ fontWeight: 340 + index * 150 }"
        >
          {{ step }}
        </p>
        <div class="grid place-items-center" :class="brainPanels[index]">
          <BrainIcon
            class="size-[11cqw]"
            :style="{ scale: 0.75 + index * 0.15 }"
            :stroke-width="1.5"
            aria-hidden="true"
          />
        </div>
      </li>
    </ol>

    <!-- Two buttons -->
    <div v-else-if="meme.format === 'buttons'" class="flex h-full flex-col p-[7cqw]">
      <div class="flex flex-1 items-center justify-center gap-[10cqw]">
        <RouterLink to="/" class="press -rotate-6">
          <span class="press-cap" aria-hidden="true" />
          <span class="press-label">{{ meme.left }}</span>
        </RouterLink>
        <button type="button" class="press rotate-6" @click="emit('shuffle')">
          <span class="press-cap" aria-hidden="true" />
          <span class="press-label">{{ meme.right }}</span>
        </button>
      </div>
      <p class="font-display text-[7.4cqw] leading-[1.05]">{{ meme.caption }}</p>
      <p class="mt-[1.5cqw] font-mono text-[3.2cqw] tracking-[0.06em] uppercase opacity-70">
        {{ meme.aside }}
      </p>
    </div>

    <!-- Task failed successfully -->
    <div v-else-if="meme.format === 'dialog'" class="grid h-full place-items-center p-[8cqw]">
      <div
        class="w-full overflow-hidden rounded-[1.6cqw] bg-paper text-ink shadow-[2cqw_2cqw_0_var(--ink)] ring-[0.5cqw] ring-ink"
      >
        <div class="flex items-center justify-between bg-ink px-[3.5cqw] py-[2.2cqw] text-paper">
          <span class="font-mono text-[3.2cqw] tracking-[0.04em]">{{ meme.title }}</span>
          <span class="flex items-center gap-[1.8cqw]" aria-hidden="true">
            <MinusIcon class="size-[3.6cqw]" :stroke-width="2.5" />
            <SquareIcon class="size-[3.2cqw]" :stroke-width="2.5" />
            <XIcon class="size-[3.6cqw]" :stroke-width="2.5" />
          </span>
        </div>
        <div class="flex gap-[4cqw] p-[5.5cqw]">
          <TriangleAlertIcon
            class="size-[13cqw] shrink-0 fill-volt"
            :stroke-width="1.6"
            aria-hidden="true"
          />
          <div>
            <p class="font-display text-[6.6cqw] leading-[1.08]">{{ meme.message }}</p>
            <p class="mt-[2.5cqw] font-mono text-[3.2cqw] opacity-70">{{ meme.detail }}</p>
          </div>
        </div>
        <div class="flex justify-end px-[5.5cqw] pb-[5.5cqw]">
          <button
            type="button"
            class="dialog-ok min-h-11 min-w-[24cqw] rounded-[1cqw] bg-paper px-[4cqw] font-mono text-[3.4cqw] tracking-[0.06em] ring-[0.5cqw] ring-ink"
            aria-label="OK, show another meme"
            @click="emit('shuffle')"
          >
            OK
          </button>
        </div>
      </div>
    </div>

    <!-- This is fine -->
    <div v-else-if="meme.format === 'fine'" class="flex h-full flex-col p-[7cqw]">
      <p class="font-mono text-[3.2cqw] tracking-[0.06em] uppercase">{{ meme.status }}</p>
      <div class="flex flex-1 items-center gap-[5cqw]">
        <span
          class="grid size-[22cqw] shrink-0 place-items-center rounded-full bg-paper text-ink ring-[0.5cqw] ring-ink"
        >
          <CoffeeIcon class="size-[11cqw]" :stroke-width="1.6" aria-hidden="true" />
        </span>
        <p
          class="bubble relative rounded-[3cqw] bg-paper px-[5cqw] py-[3.6cqw] font-display text-[8.4cqw] leading-none font-semibold text-ink ring-[0.5cqw] ring-ink"
        >
          {{ meme.quote }}
        </p>
      </div>
      <div class="-mx-[2cqw] -mb-[3cqw] flex items-end justify-center" aria-hidden="true">
        <FlameIcon
          v-for="(size, index) in flames"
          :key="index"
          class="flame -mx-[1.4cqw] shrink-0 fill-volt"
          :style="{
            width: `${size}cqw`,
            height: `${size}cqw`,
            animationDelay: `${index * -0.37}s`,
          }"
          :stroke-width="1.5"
        />
      </div>
    </div>

    <!-- Change my mind -->
    <div v-else class="flex h-full flex-col justify-end p-[7cqw]">
      <div
        class="mx-auto w-[90%] -rotate-2 rounded-[1.2cqw] bg-paper p-[6cqw] text-ink shadow-[0_1.6cqw_0_oklch(0_0_0/0.35)]"
      >
        <p class="font-display text-[6.4cqw] leading-[1.1] text-balance">{{ meme.claim }}</p>
        <p
          class="mt-[4cqw] font-display text-[10cqw] leading-[0.9] font-extrabold tracking-[-0.03em] uppercase [font-stretch:88%]"
        >
          {{ meme.dare }}
        </p>
      </div>
      <div class="relative mt-[6cqw]" aria-hidden="true">
        <CoffeeIcon class="absolute right-[6cqw] bottom-full size-[12cqw]" :stroke-width="1.5" />
        <span class="block h-[2.4cqw] rounded-full bg-paper/25" />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* "Two buttons": chunky arcade buttons that press down. */
.press {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3.4cqw;
  outline: none;
}

.press-cap {
  display: block;
  width: 24cqw;
  aspect-ratio: 1;
  border-radius: 999px;
  background: var(--ember);
  box-shadow:
    inset 0 -2.4cqw 0 oklch(0.52 0.19 32),
    0 0 0 0.6cqw var(--ink),
    0 1.8cqw 0 0.6cqw var(--ink);
  transition:
    translate 120ms var(--ease-out-quint),
    box-shadow 120ms var(--ease-out-quint);
}

.press:active .press-cap {
  translate: 0 1.4cqw;
  box-shadow:
    inset 0 -1cqw 0 oklch(0.52 0.19 32),
    0 0 0 0.6cqw var(--ink),
    0 0.4cqw 0 0.6cqw var(--ink);
}

.press:focus-visible .press-cap {
  outline: 0.8cqw solid var(--ink);
  outline-offset: 2.4cqw;
}

.press-label {
  border-radius: 1cqw;
  background: var(--paper);
  color: var(--ink);
  padding: 1.2cqw 2.6cqw;
  font-family: var(--font-mono);
  font-size: 3.2cqw;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  white-space: nowrap;
  box-shadow: 0 0 0 0.4cqw var(--ink);
}

.dialog-ok {
  transition: translate 120ms var(--ease-out-quint);
}

.dialog-ok:active {
  translate: 0.4cqw 0.4cqw;
}

.dialog-ok:focus-visible {
  outline: 0.6cqw solid var(--ink);
  outline-offset: 1cqw;
}

/* Speech-bubble tail, pointing back at the mug. */
.bubble::before {
  content: '';
  position: absolute;
  top: 50%;
  left: -1.7cqw;
  width: 3.2cqw;
  height: 3.2cqw;
  background: var(--paper);
  border-bottom: 0.5cqw solid var(--ink);
  border-left: 0.5cqw solid var(--ink);
  transform: translateY(-50%) rotate(45deg);
}

.flame {
  transform-origin: 50% 100%;
  animation: flicker 1.4s var(--ease-in-out-quart) infinite alternate;
}

@keyframes flicker {
  0% {
    transform: scale(1, 1) rotate(-2deg);
  }
  50% {
    transform: scale(0.94, 1.08) rotate(1.5deg);
  }
  100% {
    transform: scale(1.04, 0.95) rotate(-1deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .flame {
    animation: none;
  }

  .press-cap,
  .dialog-ok {
    transition: none;
  }
}
</style>
