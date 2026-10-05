<script setup lang="ts">
/**
 * A jaguar silhouette with a full walk cycle — rendered as an SVG <g> inside ForestScene.
 *
 * Local space: 260 × 130, facing right, paws on y ≈ 126.
 * Joints are animated with SMIL `animateTransform` so every rotation pivots on an explicit
 * point in this local space (immune to the parent's scale/translate), and the whole cycle can
 * be paused or scrubbed through the SVG DOM (`pauseAnimations`, `setCurrentTime`).
 *
 * Gait: lateral-sequence walk — near hind → near fore (+¼) → far hind (+½) → far fore (+¾).
 */
const props = withDefaults(defineProps<{ animate?: boolean; cycle?: number }>(), {
  animate: true,
  cycle: 1.25,
})

interface Segment {
  d: string
  width: number
  pivot: readonly [number, number]
  values: readonly number[]
  keyTimes: readonly number[]
  paw?: readonly [number, number]
}

interface Leg {
  id: string
  phase: number
  far: boolean
  segments: readonly [Segment, Segment, Segment]
}

const hind = (id: string, phase: number, far: boolean): Leg => ({
  id,
  phase,
  far,
  segments: [
    { d: 'M78 72 L90 97', width: 20, pivot: [78, 72], values: [-21, 19, -6, -21], keyTimes: [0, 0.55, 0.8, 1] },
    { d: 'M90 97 L79 110', width: 11, pivot: [90, 97], values: [0, 6, 38, 8, 0], keyTimes: [0, 0.55, 0.72, 0.9, 1] },
    {
      d: 'M79 110 L83 121',
      width: 8,
      pivot: [79, 110],
      values: [0, -12, -30, 0],
      keyTimes: [0, 0.55, 0.72, 1],
      paw: [87.5, 123.6],
    },
  ],
})

const fore = (id: string, phase: number, far: boolean): Leg => ({
  id,
  phase,
  far,
  segments: [
    { d: 'M168 72 L163 99', width: 17, pivot: [168, 72], values: [-19, 21, -6, -19], keyTimes: [0, 0.6, 0.82, 1] },
    { d: 'M163 99 L165 117', width: 11, pivot: [163, 99], values: [0, 0, 50, 12, 0], keyTimes: [0, 0.58, 0.74, 0.9, 1] },
    {
      d: 'M165 117 L169 121.5',
      width: 8.5,
      pivot: [165, 117],
      values: [0, 18, 38, 0],
      keyTimes: [0, 0.6, 0.74, 1],
      paw: [172.5, 123.6],
    },
  ],
})

// Far legs render first (behind the body); near legs last.
const farLegs: Leg[] = [hind('far-hind', 0.5, true), fore('far-fore', 0.75, true)]
const nearLegs: Leg[] = [hind('near-hind', 0, false), fore('near-fore', 0.25, false)]

const ease = (count: number) => Array.from({ length: count }, () => '0.42 0 0.58 1').join('; ')

function rotation(segment: Segment, phase: number) {
  return {
    attributeName: 'transform',
    type: 'rotate',
    dur: `${props.cycle}s`,
    begin: `${(-phase * props.cycle).toFixed(3)}s`,
    repeatCount: 'indefinite',
    values: segment.values.map((value) => `${value} ${segment.pivot[0]} ${segment.pivot[1]}`).join('; '),
    keyTimes: segment.keyTimes.join('; '),
    calcMode: 'spline',
    keySplines: ease(segment.keyTimes.length - 1),
  }
}

const TORSO =
  'M60 58 C70 47 94 48 114 53 C134 58 150 45 168 47 C180 48 188 57 190 68 C192 80 186 90 174 94 ' +
  'C152 99 122 100 98 96 C84 94 74 92 66 88 C54 82 50 68 60 58 Z'

const HEAD =
  'M162 52 C174 42 188 38 199 40 C200 33 206 31 210 36 C217 37 223 42 227 48 C231 52 233 58 231 62 ' +
  'C229 66 223 68 217 68 C209 70 201 72 193 78 C185 84 178 86 171 84 Z'
</script>

<template>
  <g class="jaguar" stroke-linecap="round" stroke-linejoin="round">
    <defs>
      <!-- Faint rosettes: enough to read "jaguar" rather than "puma" in silhouette. -->
      <pattern id="jaguar-rosettes" width="21" height="17" patternUnits="userSpaceOnUse" patternTransform="rotate(-8)">
        <g fill="none" stroke="var(--jaguar-rosette)" stroke-width="1.5">
          <path d="M4.5 5.5 a3.6 3.1 0 1 1 1.2 5.2" />
          <path d="M15.5 13 a3.2 2.8 0 1 0 -1.4 -4.8" />
        </g>
        <circle cx="5.6" cy="8.2" r="0.9" fill="var(--jaguar-rosette)" />
        <circle cx="14.4" cy="10.6" r="0.8" fill="var(--jaguar-rosette)" />
      </pattern>
    </defs>

    <g v-for="leg in farLegs" :key="leg.id" transform="translate(-7 -2)" fill="var(--jaguar-far)" stroke="var(--jaguar-far)">
      <g>
        <animateTransform v-if="animate" v-bind="rotation(leg.segments[0], leg.phase)" />
        <path :d="leg.segments[0].d" :stroke-width="leg.segments[0].width" fill="none" />
        <g>
          <animateTransform v-if="animate" v-bind="rotation(leg.segments[1], leg.phase)" />
          <path :d="leg.segments[1].d" :stroke-width="leg.segments[1].width" fill="none" />
          <g>
            <animateTransform v-if="animate" v-bind="rotation(leg.segments[2], leg.phase)" />
            <path :d="leg.segments[2].d" :stroke-width="leg.segments[2].width" fill="none" />
            <ellipse :cx="leg.segments[2].paw![0]" :cy="leg.segments[2].paw![1]" rx="7" ry="3" stroke="none" />
          </g>
        </g>
      </g>
    </g>

    <g fill="var(--jaguar)" stroke="var(--jaguar)">
      <animateTransform
        v-if="animate"
        attributeName="transform"
        type="translate"
        :dur="`${cycle / 2}s`"
        repeatCount="indefinite"
        values="0 0; 0 -1.4; 0 0"
        keyTimes="0; 0.5; 1"
        calcMode="spline"
        keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
      />

      <!-- Tail: thick at the root, tapering, tip curling up; sways on a slower beat. -->
      <g fill="none">
        <animateTransform
          v-if="animate"
          attributeName="transform"
          type="rotate"
          :dur="`${cycle * 2}s`"
          repeatCount="indefinite"
          values="-5 62 62; 7 62 62; -5 62 62"
          keyTimes="0; 0.5; 1"
          calcMode="spline"
          keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
        />
        <path d="M62 62 C46 68 36 84 37 100" stroke-width="8.5" />
        <path d="M37 100 C38 110 36 118 28 116" stroke-width="5.5" />
      </g>

      <path :d="TORSO" stroke="none" />
      <path :d="TORSO" stroke="none" fill="url(#jaguar-rosettes)" />

      <g>
        <animateTransform
          v-if="animate"
          attributeName="transform"
          type="rotate"
          :dur="`${cycle}s`"
          repeatCount="indefinite"
          values="1.5 172 62; -1.2 172 62; 1.5 172 62"
          keyTimes="0; 0.5; 1"
          calcMode="spline"
          keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
        />
        <path :d="HEAD" stroke="none" />
        <circle class="jaguar-eye" cx="219" cy="50.5" r="1.7" stroke="none" />
      </g>
    </g>

    <g v-for="leg in nearLegs" :key="leg.id" fill="var(--jaguar)" stroke="var(--jaguar)">
      <g>
        <animateTransform v-if="animate" v-bind="rotation(leg.segments[0], leg.phase)" />
        <path :d="leg.segments[0].d" :stroke-width="leg.segments[0].width" fill="none" />
        <g>
          <animateTransform v-if="animate" v-bind="rotation(leg.segments[1], leg.phase)" />
          <path :d="leg.segments[1].d" :stroke-width="leg.segments[1].width" fill="none" />
          <g>
            <animateTransform v-if="animate" v-bind="rotation(leg.segments[2], leg.phase)" />
            <path :d="leg.segments[2].d" :stroke-width="leg.segments[2].width" fill="none" />
            <ellipse :cx="leg.segments[2].paw![0]" :cy="leg.segments[2].paw![1]" rx="7" ry="3" stroke="none" />
          </g>
        </g>
      </g>
    </g>
  </g>
</template>

<style scoped>
.jaguar-eye {
  fill: var(--jaguar-eye);
  filter: var(--jaguar-eye-glow, none);
}
</style>
