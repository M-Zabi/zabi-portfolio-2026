<script setup lang="ts">
import { useId } from 'vue'

import { blockClass } from '@/lib/brand'
import { cn } from '@/lib/utils'
import type { PostCoverKind } from '@/types/blog'
import type { BrandColor } from '@/types/content'

/**
 * Generated cover art — one composition per article, drawn on the post's brand block so the
 * blog reads as part of the same colour system as the rest of the site. Purely decorative.
 *
 * `live` keeps it moving (the article hero); otherwise it animates on hover only.
 */
withDefaults(defineProps<{ kind: PostCoverKind; color: BrandColor; live?: boolean; class?: string }>(), {
  live: false,
  class: undefined,
})

// Several covers share a page; pattern and gradient ids must not collide.
const uid = useId()
</script>

<template>
  <div :class="cn('cover grain relative isolate overflow-hidden', blockClass[color], live && 'is-live', $props.class)" aria-hidden="true">
    <svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" class="absolute inset-0 size-full">
      <defs>
        <pattern :id="`${uid}-dots`" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.4" fill="currentColor" opacity="0.18" />
        </pattern>
        <radialGradient :id="`${uid}-orb`" cx="38%" cy="34%" r="70%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95" />
          <stop offset="28%" stop-color="var(--cobalt)" />
          <stop offset="100%" stop-color="var(--cobalt)" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="800" height="600" :fill="`url(#${uid}-dots)`" />

      <!-- Editors: a window, a diff, an agent cursor and a green test run -->
      <g v-if="kind === 'terminal'">
        <rect x="150" y="128" width="520" height="360" rx="20" fill="currentColor" opacity="0.14" />
        <g class="float-a">
          <rect x="132" y="104" width="520" height="360" rx="20" fill="var(--paper)" />
          <rect x="132" y="104" width="520" height="48" rx="20" fill="var(--ink)" opacity="0.06" />
          <circle cx="162" cy="128" r="6" fill="var(--ember)" />
          <circle cx="182" cy="128" r="6" fill="var(--volt)" />
          <circle cx="202" cy="128" r="6" fill="var(--mint)" />
          <rect x="236" y="116" width="116" height="24" rx="8" fill="var(--ink)" opacity="0.08" />
          <text x="250" y="133" class="cover-mono" fill="var(--ink)" opacity="0.6">orders.ts</text>
          <g fill="var(--ink)">
            <rect x="172" y="184" width="40" height="10" rx="5" opacity="0.18" />
            <rect x="222" y="184" width="150" height="10" rx="5" opacity="0.4" />
            <rect x="192" y="214" width="96" height="10" rx="5" opacity="0.25" />
            <rect x="298" y="214" width="180" height="10" rx="5" opacity="0.4" />
          </g>
          <rect x="160" y="240" width="470" height="30" rx="6" fill="var(--ember)" opacity="0.18" />
          <rect x="192" y="250" width="230" height="10" rx="5" fill="var(--ember)" opacity="0.7" />
          <rect x="160" y="276" width="470" height="30" rx="6" fill="var(--mint)" opacity="0.35" />
          <rect x="192" y="286" width="270" height="10" rx="5" fill="var(--ink)" opacity="0.6" />
          <rect class="blink" x="468" y="282" width="3" height="18" fill="var(--ink)" />
          <g fill="var(--ink)">
            <rect x="192" y="326" width="120" height="10" rx="5" opacity="0.25" />
            <rect x="322" y="326" width="90" height="10" rx="5" opacity="0.4" />
            <rect x="172" y="356" width="60" height="10" rx="5" opacity="0.18" />
            <rect x="192" y="386" width="210" height="10" rx="5" opacity="0.3" />
            <rect x="172" y="416" width="30" height="10" rx="5" opacity="0.18" />
          </g>
        </g>
        <g class="float-b">
          <path d="M540 214 l0 30 l8 -8 l7 14 l6 -3 l-7 -14 l11 0 z" fill="var(--ink)" stroke="var(--paper)" stroke-width="2.5" stroke-linejoin="round" />
          <rect x="562" y="242" width="86" height="32" rx="16" fill="var(--ember)" />
          <text x="581" y="263" class="cover-label" fill="var(--ember-foreground)">agent</text>
        </g>
        <g class="float-c">
          <rect x="520" y="430" width="170" height="44" rx="22" fill="var(--ink)" />
          <circle cx="546" cy="452" r="9" fill="var(--mint)" class="pulse" />
          <text x="564" y="458" class="cover-label" fill="var(--paper)">42 passed</text>
        </g>
      </g>

      <!-- Context engineering: stacked context planes around a cached core -->
      <g v-else-if="kind === 'planes'">
        <line x1="130" y1="470" x2="690" y2="130" stroke="currentColor" stroke-width="2" stroke-dasharray="6 9" opacity="0.4" class="dash" />
        <polygon points="120,330 290,230 290,470 120,570" fill="var(--paper)" opacity="0.5" stroke="currentColor" stroke-opacity="0.35" stroke-width="2" class="float-a" />
        <polygon points="240,290 410,190 410,430 240,530" fill="none" stroke="var(--cobalt)" stroke-width="3" class="float-b" />
        <g class="float-c">
          <polygon points="360,250 530,150 530,390 360,490" fill="var(--paper)" opacity="0.75" stroke="var(--ember)" stroke-width="3" />
          <circle cx="445" cy="322" r="62" :fill="`url(#${uid}-orb)`" />
        </g>
        <polygon points="480,210 650,110 650,350 480,450" fill="var(--blush)" opacity="0.55" class="float-a" />
        <g class="float-b">
          <polygon points="642,92 676,72 710,92 676,112" fill="var(--mint)" />
          <polygon points="642,92 676,112 676,150 642,130" fill="var(--mint)" style="filter: brightness(0.82)" />
          <polygon points="676,112 710,92 710,130 676,150" fill="var(--mint)" style="filter: brightness(0.68)" />
        </g>
        <g class="float-c">
          <rect x="196" y="200" width="88" height="32" rx="16" fill="var(--ink)" />
          <text x="214" y="221" class="cover-label" fill="var(--paper)">system</text>
          <path d="M296 196 l0 26 l7 -7 l6 12 l5 -2 l-6 -12 l9 0 z" fill="var(--ink)" stroke="var(--paper)" stroke-width="2" stroke-linejoin="round" />
        </g>
        <g class="float-a">
          <rect x="538" y="408" width="84" height="32" rx="16" fill="var(--ember)" />
          <text x="557" y="429" class="cover-label" fill="var(--ember-foreground)">cache</text>
          <path d="M520 382 l0 26 l7 -7 l6 12 l5 -2 l-6 -12 l9 0 z" fill="var(--ink)" stroke="var(--paper)" stroke-width="2" stroke-linejoin="round" />
        </g>
        <rect x="96" y="96" width="132" height="30" rx="15" fill="var(--paper)" stroke="currentColor" stroke-opacity="0.25" />
        <text x="114" y="116" class="cover-mono" fill="var(--ink)" opacity="0.7">AGENTS.md</text>
      </g>

      <!-- Local AI: a GPU die filling with weights and cache -->
      <g v-else-if="kind === 'chip'">
        <g opacity="0.45" stroke="currentColor" stroke-width="2">
          <path class="heat" d="M300 112 q12 -18 0 -36 q-12 -18 0 -36" fill="none" />
          <path class="heat heat-2" d="M400 112 q12 -18 0 -36 q-12 -18 0 -36" fill="none" />
          <path class="heat heat-3" d="M500 112 q12 -18 0 -36 q-12 -18 0 -36" fill="none" />
        </g>
        <g fill="currentColor" opacity="0.5">
          <rect v-for="i in 9" :key="`t${i}`" :x="226 + i * 34" y="126" width="12" height="26" rx="3" />
          <rect v-for="i in 9" :key="`b${i}`" :x="226 + i * 34" y="478" width="12" height="26" rx="3" />
          <rect v-for="i in 7" :key="`l${i}`" x="208" :y="166 + i * 38" width="26" height="12" rx="3" />
          <rect v-for="i in 7" :key="`r${i}`" x="566" :y="166 + i * 38" width="26" height="12" rx="3" />
        </g>
        <rect x="236" y="150" width="328" height="330" rx="28" fill="var(--ink)" class="float-a" />
        <g class="float-a">
          <rect x="268" y="182" width="264" height="266" rx="14" fill="var(--paper)" opacity="0.06" />
          <g v-for="row in 6" :key="`row${row}`">
            <rect
              v-for="col in 6"
              :key="`c${row}-${col}`"
              :x="276 + (col - 1) * 42"
              :y="190 + (row - 1) * 42"
              width="34"
              height="34"
              rx="6"
              class="cell"
              :fill="row <= 3 ? 'var(--cobalt)' : row <= 5 ? 'var(--ember)' : 'var(--mint)'"
              :style="{ animationDelay: `${(row * 6 + col) * 0.07}s` }"
            />
          </g>
        </g>
        <g class="float-b">
          <rect x="560" y="400" width="150" height="40" rx="20" fill="var(--paper)" />
          <text x="584" y="426" class="cover-label" fill="var(--ink)">24 GB VRAM</text>
        </g>
        <g class="float-c">
          <rect x="96" y="420" width="118" height="36" rx="18" fill="var(--ink)" />
          <text x="116" y="443" class="cover-mono" fill="var(--paper)">Q4_K_M</text>
        </g>
      </g>

      <!-- Token economics: a receipt and rising cost bars -->
      <g v-else-if="kind === 'ledger'">
        <g fill="currentColor">
          <rect class="rise" x="528" y="300" width="42" height="200" rx="6" opacity="0.85" style="--h: 200" />
          <rect class="rise" x="584" y="380" width="42" height="120" rx="6" opacity="0.6" style="--h: 120; animation-delay: 0.15s" />
          <rect class="rise" x="640" y="430" width="42" height="70" rx="6" opacity="0.4" style="--h: 70; animation-delay: 0.3s" />
          <rect class="rise" x="696" y="474" width="42" height="26" rx="6" opacity="0.25" style="--h: 26; animation-delay: 0.45s" />
        </g>
        <line x1="508" y1="500" x2="760" y2="500" stroke="currentColor" stroke-width="2" opacity="0.5" />
        <g class="float-a" transform="rotate(-6 300 300)">
          <path d="M150 80 h300 v400 l-18 16 l-18 -16 l-18 16 l-18 -16 l-18 16 l-18 -16 l-18 16 l-18 -16 l-18 16 l-18 -16 l-18 16 l-18 -16 l-18 16 l-18 -16 l-18 16 l-18 -16 l-18 16 l-12 -10 z" fill="var(--paper)" />
          <text x="180" y="130" class="cover-mono" fill="var(--ink)" opacity="0.55">ONE TASK · 30 TURNS</text>
          <line x1="180" y1="150" x2="420" y2="150" stroke="var(--ink)" stroke-opacity="0.15" stroke-width="2" stroke-dasharray="4 6" />
          <g class="cover-mono" fill="var(--ink)">
            <text x="180" y="196" opacity="0.7">cache reads</text>
            <text x="420" y="196" text-anchor="end">$0.264</text>
            <text x="180" y="240" opacity="0.7">cache writes</text>
            <text x="420" y="240" text-anchor="end">$0.600</text>
            <text x="180" y="284" opacity="0.7">output</text>
            <text x="420" y="284" text-anchor="end">$0.720</text>
          </g>
          <line x1="180" y1="318" x2="420" y2="318" stroke="var(--ink)" stroke-opacity="0.15" stroke-width="2" />
          <text x="180" y="366" class="cover-total" fill="var(--ink)">TOTAL</text>
          <text x="420" y="366" class="cover-total" fill="var(--ink)" text-anchor="end">$1.58</text>
          <rect x="180" y="398" width="110" height="30" rx="15" fill="var(--mint)" />
          <text x="196" y="418" class="cover-label" fill="var(--mint-foreground)">−76% cached</text>
        </g>
      </g>

      <!-- Protocols: a host with packets flowing to its servers -->
      <g v-else-if="kind === 'protocol'">
        <circle cx="400" cy="300" r="190" fill="none" stroke="currentColor" stroke-opacity="0.18" stroke-width="2" />
        <circle cx="400" cy="300" r="130" fill="none" stroke="currentColor" stroke-opacity="0.25" stroke-width="2" stroke-dasharray="4 8" class="spin" />
        <g fill="none" stroke="currentColor" stroke-width="3" stroke-opacity="0.55">
          <path d="M400 300 C 300 240, 220 190, 150 150" />
          <path d="M400 300 C 520 260, 600 210, 660 160" />
          <path d="M400 300 C 420 380, 470 440, 560 480" />
        </g>
        <g fill="var(--paper)">
          <circle r="8">
            <animateMotion dur="2.4s" repeatCount="indefinite" path="M400 300 C 300 240, 220 190, 150 150" />
          </circle>
          <circle r="8">
            <animateMotion dur="2.8s" repeatCount="indefinite" begin="0.6s" path="M660 160 C 600 210, 520 260, 400 300" />
          </circle>
          <circle r="8">
            <animateMotion dur="2.2s" repeatCount="indefinite" begin="1.1s" path="M400 300 C 420 380, 470 440, 560 480" />
          </circle>
        </g>
        <g class="float-a">
          <rect x="320" y="250" width="160" height="100" rx="24" fill="var(--ink)" />
          <text x="400" y="294" text-anchor="middle" class="cover-total" fill="var(--paper)">host</text>
          <text x="400" y="322" text-anchor="middle" class="cover-mono" fill="var(--paper)" opacity="0.6">3 clients</text>
        </g>
        <g class="float-b">
          <circle cx="140" cy="140" r="54" fill="var(--paper)" />
          <path d="M116 126 h18 l8 8 h22 v30 h-48 z" fill="none" stroke="var(--ink)" stroke-width="4" stroke-linejoin="round" />
          <text x="140" y="222" text-anchor="middle" class="cover-label" fill="currentColor">stdio</text>
        </g>
        <g class="float-c">
          <circle cx="668" cy="150" r="54" fill="var(--paper)" />
          <ellipse cx="668" cy="132" rx="22" ry="8" fill="none" stroke="var(--ink)" stroke-width="4" />
          <path d="M646 132 v34 a22 8 0 0 0 44 0 v-34" fill="none" stroke="var(--ink)" stroke-width="4" />
          <text x="668" y="232" text-anchor="middle" class="cover-label" fill="currentColor">HTTP</text>
        </g>
        <g class="float-a">
          <circle cx="572" cy="488" r="50" fill="var(--volt)" />
          <rect x="550" y="474" width="44" height="28" rx="5" fill="none" stroke="var(--volt-foreground)" stroke-width="4" />
          <path d="M558 488 h28" stroke="var(--volt-foreground)" stroke-width="4" />
        </g>
      </g>

      <!-- Design: an artboard, swatches, a type specimen and a pen path -->
      <g v-else-if="kind === 'palette'">
        <rect x="148" y="112" width="460" height="360" rx="20" fill="currentColor" opacity="0.12" />
        <g class="float-a">
          <rect x="128" y="92" width="460" height="360" rx="20" fill="var(--paper)" />
          <text x="164" y="250" class="cover-specimen" fill="var(--ink)">Aa</text>
          <g fill="var(--ink)" opacity="0.3">
            <rect x="380" y="150" width="170" height="12" rx="6" />
            <rect x="380" y="176" width="130" height="12" rx="6" />
            <rect x="380" y="202" width="150" height="12" rx="6" />
          </g>
          <g>
            <circle cx="186" cy="380" r="26" fill="var(--ember)" />
            <circle cx="248" cy="380" r="26" fill="var(--volt)" />
            <circle cx="310" cy="380" r="26" fill="var(--cobalt)" />
            <circle cx="372" cy="380" r="26" fill="var(--mint)" />
            <circle cx="434" cy="380" r="26" fill="var(--blush)" stroke="var(--ink)" stroke-opacity="0.15" stroke-width="2" />
          </g>
          <path d="M380 300 C 430 240, 500 340, 550 280" fill="none" stroke="var(--cobalt)" stroke-width="4" class="draw" />
          <line x1="380" y1="300" x2="420" y2="252" stroke="var(--cobalt)" stroke-width="2" />
          <line x1="550" y1="280" x2="510" y2="330" stroke="var(--cobalt)" stroke-width="2" />
          <rect x="372" y="292" width="16" height="16" fill="var(--paper)" stroke="var(--cobalt)" stroke-width="3" />
          <rect x="542" y="272" width="16" height="16" fill="var(--paper)" stroke="var(--cobalt)" stroke-width="3" />
          <circle cx="420" cy="252" r="6" fill="var(--cobalt)" />
          <circle cx="510" cy="330" r="6" fill="var(--cobalt)" />
        </g>
        <g class="float-b">
          <path d="M610 150 l0 30 l8 -8 l7 14 l6 -3 l-7 -14 l11 0 z" fill="var(--ink)" stroke="var(--paper)" stroke-width="2.5" stroke-linejoin="round" />
          <rect x="632" y="178" width="96" height="32" rx="16" fill="var(--ink)" />
          <text x="652" y="199" class="cover-label" fill="var(--paper)">tokens</text>
        </g>
        <g class="float-c">
          <rect x="560" y="440" width="150" height="40" rx="20" fill="var(--cobalt)" />
          <text x="580" y="466" class="cover-label" fill="var(--cobalt-foreground)">DESIGN.md</text>
        </g>
      </g>

      <!-- On-device: a phone and a laptop running the model offline -->
      <g v-else-if="kind === 'device'">
        <g class="float-b" opacity="0.9">
          <rect x="400" y="170" width="300" height="196" rx="16" fill="var(--paper)" opacity="0.18" />
          <rect x="414" y="184" width="272" height="168" rx="8" fill="var(--ink)" />
          <g fill="var(--mint)">
            <rect x="434" y="208" width="120" height="8" rx="4" />
            <rect x="434" y="228" width="180" height="8" rx="4" opacity="0.6" />
            <rect x="434" y="248" width="90" height="8" rx="4" opacity="0.6" />
          </g>
          <text x="434" y="300" class="cover-mono" fill="var(--paper)" opacity="0.7">llama-server :8080</text>
          <path d="M372 366 h356 l-24 22 h-308 z" fill="var(--paper)" opacity="0.3" />
        </g>
        <g class="float-a">
          <rect x="190" y="110" width="200" height="390" rx="36" fill="var(--paper)" />
          <rect x="262" y="124" width="56" height="12" rx="6" fill="var(--ink)" opacity="0.85" />
          <rect x="214" y="170" width="120" height="40" rx="14" fill="var(--ink)" opacity="0.08" />
          <rect x="244" y="224" width="124" height="54" rx="14" fill="var(--cobalt)" />
          <rect x="214" y="292" width="140" height="62" rx="14" fill="var(--ink)" opacity="0.08" />
          <g fill="var(--ink)" opacity="0.5">
            <circle cx="232" cy="378" r="5" class="typing" />
            <circle cx="248" cy="378" r="5" class="typing" style="animation-delay: 0.15s" />
            <circle cx="264" cy="378" r="5" class="typing" style="animation-delay: 0.3s" />
          </g>
          <rect x="214" y="440" width="152" height="36" rx="18" fill="var(--ink)" opacity="0.08" />
        </g>
        <g class="float-c">
          <circle cx="164" cy="140" r="38" fill="var(--volt)" />
          <path d="M146 136 q18 -16 36 0 M152 144 q12 -10 24 0" fill="none" stroke="var(--volt-foreground)" stroke-width="4" stroke-linecap="round" />
          <circle cx="164" cy="152" r="4" fill="var(--volt-foreground)" />
          <line x1="144" y1="160" x2="184" y2="120" stroke="var(--volt-foreground)" stroke-width="4" stroke-linecap="round" />
        </g>
        <g class="float-a">
          <rect x="520" y="420" width="160" height="40" rx="20" fill="var(--paper)" />
          <text x="542" y="446" class="cover-label" fill="var(--ink)">on-device</text>
        </g>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.cover :deep(text) {
  font-family: var(--font-sans);
}

.cover-label {
  font-size: 17px;
  font-weight: 600;
}

.cover-mono {
  font-family: var(--font-mono) !important;
  font-size: 14px;
  letter-spacing: 0.04em;
}

.cover-total {
  font-family: var(--font-display) !important;
  font-size: 30px;
  font-weight: 650;
}

.cover-specimen {
  font-family: var(--font-display) !important;
  font-size: 150px;
  font-weight: 650;
  letter-spacing: -0.04em;
}

.cover.is-live *,
.cover:hover * {
  animation-play-state: running;
}

.float-a {
  animation: cover-float 7s var(--ease-in-out-quart) infinite;
}
.float-b {
  animation: cover-float 8s var(--ease-in-out-quart) -2s infinite;
}
.float-c {
  animation: cover-float 6s var(--ease-in-out-quart) -4s infinite;
}
.blink {
  animation: cover-blink 1.1s steps(1) infinite;
}
.pulse {
  transform-origin: center;
  animation: cover-pulse 1.6s ease-in-out infinite;
}
.dash {
  animation: cover-dash 2s linear infinite;
}
.heat {
  animation: cover-heat 2.4s ease-in-out infinite;
}
.heat-2 {
  animation-delay: -0.8s;
}
.heat-3 {
  animation-delay: -1.6s;
}
.cell {
  animation: cover-cell 3.6s ease-in-out infinite;
}
.rise {
  transform-origin: bottom;
  animation: cover-rise 3.2s var(--ease-out-expo) infinite;
}
.spin {
  transform-origin: center;
  animation: cover-spin 30s linear infinite;
}
.draw {
  stroke-dasharray: 260;
  animation: cover-draw 4s var(--ease-in-out-quart) infinite;
}
.typing {
  animation: cover-typing 1.2s ease-in-out infinite;
}

/* Declared after the shorthands above, which would otherwise reset the play state. */
.float-a,
.float-b,
.float-c,
.blink,
.pulse,
.dash,
.heat,
.cell,
.rise,
.spin,
.draw,
.typing {
  animation-play-state: paused;
  transform-box: fill-box;
}

@keyframes cover-float {
  0%,
  100% {
    transform: translate3d(0, 0, 0);
  }
  50% {
    transform: translate3d(0, -10px, 0);
  }
}
@keyframes cover-blink {
  50% {
    opacity: 0;
  }
}
@keyframes cover-pulse {
  50% {
    transform: scale(1.35);
    opacity: 0.6;
  }
}
@keyframes cover-dash {
  to {
    stroke-dashoffset: -30;
  }
}
@keyframes cover-heat {
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateY(-14px);
  }
}
@keyframes cover-cell {
  0%,
  100% {
    opacity: 0.95;
  }
  50% {
    opacity: 0.35;
  }
}
@keyframes cover-rise {
  0% {
    transform: scaleY(0.2);
  }
  40%,
  100% {
    transform: scaleY(1);
  }
}
@keyframes cover-spin {
  to {
    transform: rotate(360deg);
  }
}
@keyframes cover-draw {
  0% {
    stroke-dashoffset: 260;
  }
  50%,
  100% {
    stroke-dashoffset: 0;
  }
}
@keyframes cover-typing {
  0%,
  100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  50% {
    transform: translateY(-5px);
    opacity: 1;
  }
}
</style>

<!-- Unscoped: the trigger is the card link in another component (see RollingText for why). -->
<style>
.group\/card:hover .cover *,
.group\/card:focus-visible .cover * {
  animation-play-state: running;
}
</style>
