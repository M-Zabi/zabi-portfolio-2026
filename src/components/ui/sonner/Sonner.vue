<script lang="ts" setup>
import type { ToasterProps } from 'vue-sonner'

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
  XIcon,
} from '@lucide/vue'
import { reactiveOmit } from '@vueuse/core'
import { Toaster as Sonner } from 'vue-sonner'
import { cn } from '@/lib/utils'

const props = defineProps<ToasterProps>()
const delegatedProps = reactiveOmit(props, 'class', 'toastOptions')
</script>

<template>
  <!--
    Portfolio toasts: the site's type, a full-colour brand tile per toast type, a mono kicker
    like the section labels, and a countdown bar. Styled in the unscoped block below because
    vue-sonner renders the toast markup itself.
  -->
  <Sonner
    :class="cn('toaster mz-toaster group', props.class)"
    :style="{
      // vue-sonner hard-codes a system font stack on the toaster; use the site's body face.
      'font-family': 'var(--font-sans)',
      '--width': '25rem',
      '--normal-bg': 'var(--popover)',
      '--normal-text': 'var(--popover-foreground)',
      '--normal-border': 'var(--border)',
      '--border-radius': '1.25rem',
      '--gray2': 'var(--muted)',
      '--gray3': 'var(--border)',
      '--gray4': 'var(--border)',
      '--gray5': 'var(--border)',
      '--gray12': 'var(--popover-foreground)',
    }"
    :toast-options="props.toastOptions"
    v-bind="delegatedProps"
  >
    <template #success-icon>
      <CircleCheckIcon />
    </template>
    <template #info-icon>
      <InfoIcon />
    </template>
    <template #warning-icon>
      <TriangleAlertIcon />
    </template>
    <template #error-icon>
      <OctagonXIcon />
    </template>
    <template #loading-icon>
      <div>
        <Loader2Icon class="animate-spin" />
      </div>
    </template>
    <template #close-icon>
      <XIcon class="size-4" />
    </template>
  </Sonner>
</template>

<style>
/* Matches vue-sonner's TOAST_LIFETIME; the countdown bar runs for the toast's life. */
.mz-toaster {
  --mz-duration: 4000ms;
  --mz-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
}

.mz-toaster [data-sonner-toast] {
  --mz-tile: var(--foreground);
  --mz-tile-ink: var(--background);
  --mz-accent: var(--foreground);
}
.mz-toaster [data-sonner-toast][data-type='success'] {
  --mz-tile: var(--mint);
  --mz-tile-ink: var(--mint-foreground);
  --mz-accent: var(--mint);
}
.mz-toaster [data-sonner-toast][data-type='error'] {
  --mz-tile: var(--destructive);
  --mz-tile-ink: oklch(0.99 0 0);
  --mz-accent: var(--destructive);
}
.mz-toaster [data-sonner-toast][data-type='warning'] {
  --mz-tile: var(--volt);
  --mz-tile-ink: var(--volt-foreground);
  --mz-accent: var(--volt);
}
.mz-toaster [data-sonner-toast][data-type='info'] {
  --mz-tile: var(--cobalt);
  --mz-tile-ink: var(--cobalt-foreground);
  --mz-accent: var(--cobalt);
}

/* ───── The card ───── */

.mz-toaster [data-sonner-toast][data-styled='true'] {
  align-items: center;
  gap: 0.875rem;
  min-height: 4.75rem;
  padding: 0.875rem 1.25rem 1rem 0.875rem;
  font-size: 0.9375rem;
  background-color: color-mix(in oklch, var(--popover) 94%, transparent);
  background-image: linear-gradient(var(--mz-accent), var(--mz-accent));
  background-repeat: no-repeat;
  background-position: left bottom;
  background-size: 100% 3px;
  backdrop-filter: blur(18px) saturate(1.4);
  box-shadow:
    0 28px 60px -28px rgb(0 0 0 / 0.5),
    0 10px 24px -16px rgb(0 0 0 / 0.25);
  animation:
    mz-toast-in 700ms var(--ease-out-expo) both,
    mz-toast-timer var(--mz-duration) linear forwards;
}

.mz-toaster [data-sonner-toast][data-type='loading'] {
  background-size: 0 3px;
  animation: mz-toast-in 700ms var(--ease-out-expo) both;
}

/* Springier stacking and entrance than sonner's linear `ease` (swipes keep their own). */
.mz-toaster [data-sonner-toast][data-mounted='true']:not([data-swiping='true']):not([data-removed='true']) {
  transition:
    transform 560ms var(--mz-spring),
    opacity 400ms,
    height 400ms var(--ease-out-quint),
    box-shadow 200ms;
}

/* Sonner pauses its timers while the stack is hovered; so does the countdown. */
.mz-toaster:hover [data-sonner-toast] {
  animation-play-state: paused;
}

/* ───── Brand tile ───── */

.mz-toaster [data-sonner-toast][data-styled='true'] [data-icon] {
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  margin: 0;
  border-radius: 0.875rem;
  background: var(--mz-tile);
  color: var(--mz-tile-ink);
  animation:
    mz-toast-pop 620ms var(--mz-spring) 90ms both,
    mz-toast-ring 900ms var(--ease-out-quint) 260ms;
}

.mz-toaster [data-sonner-toast][data-styled='true'] [data-icon] svg {
  width: 1.25rem;
  height: 1.25rem;
  margin: 0;
}

/* The tick draws itself; errors shake; warnings wobble. */
.mz-toaster [data-sonner-toast][data-type='success'] [data-icon] svg path {
  stroke-dasharray: 24;
  stroke-dashoffset: 24;
  animation: mz-toast-draw 520ms var(--ease-out-quint) 340ms forwards;
}
.mz-toaster [data-sonner-toast][data-type='error'] [data-icon] svg {
  animation: mz-toast-shake 520ms var(--ease-in-out-quart) 380ms;
}
.mz-toaster [data-sonner-toast][data-type='warning'] [data-icon] svg {
  animation: mz-toast-wobble 700ms var(--ease-in-out-quart) 380ms;
}

/* ───── Copy ───── */

.mz-toaster [data-sonner-toast][data-styled='true'] [data-content] {
  gap: 0.15rem;
  min-width: 0;
}

/* A mono kicker, like the site's "(Contact)" section labels. Hidden from assistive tech. */
.mz-toaster [data-sonner-toast] [data-content]::before {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  font-stretch: 90%;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted-foreground);
  animation: mz-toast-rise 500ms var(--ease-out-quint) 120ms both;
}
.mz-toaster [data-sonner-toast][data-type='success'] [data-content]::before {
  content: '(Done)';
  content: '(Done)' / '';
}
.mz-toaster [data-sonner-toast][data-type='error'] [data-content]::before {
  content: '(Heads up)';
  content: '(Heads up)' / '';
}
.mz-toaster [data-sonner-toast][data-type='warning'] [data-content]::before {
  content: '(Careful)';
  content: '(Careful)' / '';
}
.mz-toaster [data-sonner-toast][data-type='info'] [data-content]::before {
  content: '(Note)';
  content: '(Note)' / '';
}
.mz-toaster [data-sonner-toast][data-type='loading'] [data-content]::before {
  content: '(Working)';
  content: '(Working)' / '';
}

.mz-toaster [data-sonner-toast][data-styled='true'] [data-title] {
  font-family: var(--font-display);
  font-size: 1.0625rem;
  font-weight: 600;
  font-stretch: 104%;
  line-height: 1.25;
  letter-spacing: -0.015em;
  animation: mz-toast-rise 520ms var(--ease-out-quint) 170ms both;
}

.mz-toaster [data-sonner-toast][data-styled='true'] [data-description] {
  font-size: 0.875rem;
  line-height: 1.45;
  color: var(--muted-foreground);
  animation: mz-toast-rise 520ms var(--ease-out-quint) 230ms both;
}

/* ───── Buttons ───── */

.mz-toaster [data-sonner-toast][data-styled='true'] [data-button] {
  height: 2.25rem;
  padding-inline: 0.875rem;
  border-radius: 999px;
  font-size: 0.8125rem;
  font-weight: 600;
  background: var(--foreground);
  color: var(--background);
}

.mz-toaster [data-sonner-toast][data-styled='true'] [data-close-button] {
  background: var(--popover);
  border-color: var(--border);
  color: var(--muted-foreground);
}

/* ───── Motion ───── */

@keyframes mz-toast-in {
  from {
    filter: blur(8px);
  }
  to {
    filter: blur(0);
  }
}

@keyframes mz-toast-timer {
  from {
    background-size: 100% 3px;
  }
  to {
    background-size: 0% 3px;
  }
}

@keyframes mz-toast-pop {
  0% {
    opacity: 0;
    transform: scale(0.35) rotate(-28deg);
  }
  60% {
    opacity: 1;
    transform: scale(1.12) rotate(6deg);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
}

@keyframes mz-toast-ring {
  from {
    box-shadow: 0 0 0 0 color-mix(in oklch, var(--mz-tile) 55%, transparent);
  }
  to {
    box-shadow: 0 0 0 14px transparent;
  }
}

@keyframes mz-toast-draw {
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes mz-toast-shake {
  0%,
  100% {
    transform: translateX(0);
  }
  20%,
  60% {
    transform: translateX(-3px);
  }
  40%,
  80% {
    transform: translateX(3px);
  }
}

@keyframes mz-toast-wobble {
  0%,
  100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-12deg);
  }
  50% {
    transform: rotate(9deg);
  }
  75% {
    transform: rotate(-4deg);
  }
}

@keyframes mz-toast-rise {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/*
 * Reduced motion: no pop, shake, blur or countdown (the global rule in main.css would finish
 * the bar instantly anyway). Everything renders in its settled state.
 */
@media (prefers-reduced-motion: reduce) {
  .mz-toaster [data-sonner-toast][data-styled='true'] {
    background-image: none;
  }
  .mz-toaster [data-sonner-toast][data-styled='true'] [data-icon],
  .mz-toaster [data-sonner-toast] [data-icon] svg,
  .mz-toaster [data-sonner-toast] [data-content]::before,
  .mz-toaster [data-sonner-toast][data-styled='true'] [data-title],
  .mz-toaster [data-sonner-toast][data-styled='true'] [data-description] {
    animation: none;
  }
  .mz-toaster [data-sonner-toast][data-type='success'] [data-icon] svg path {
    stroke-dashoffset: 0;
  }
}
</style>
