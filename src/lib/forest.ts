/**
 * Procedural rainforest silhouettes for the footer.
 *
 * Every generator is deterministic (seeded), returns plain SVG path data, and works in a
 * fixed scene space (see FOREST in ForestScene) so the same forest renders on every load and
 * scales crisply at any size.
 */

export type Rng = () => number

/** Small, fast, deterministic PRNG. */
export function mulberry32(seed: number): Rng {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const r1 = (n: number) => Math.round(n * 10) / 10
const pt = (x: number, y: number) => `${r1(x)} ${r1(y)}`
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const rad = (deg: number) => (deg * Math.PI) / 180

/** A puffy canopy line — arcs between jittered points — closed down to `floor`. */
export function canopyRidge(o: {
  width: number
  floor: number
  base: number
  amplitude: number
  step: number
  seed: number
}): string {
  const rand = mulberry32(o.seed)
  const parts = [`M0 ${o.floor}`, `L${pt(0, o.base - o.amplitude * rand())}`]
  let x = 0
  while (x < o.width) {
    const dx = o.step * (0.55 + rand() * 0.9)
    const nx = Math.min(o.width, x + dx)
    const ny = o.base - o.amplitude * (0.25 + rand() * 0.75)
    const radius = dx * (0.55 + rand() * 0.25)
    parts.push(`A${r1(radius)} ${r1(radius)} 0 0 1 ${pt(nx, ny)}`)
    x = nx
  }
  parts.push(`L${pt(o.width, o.floor)}Z`)
  return parts.join(' ')
}

/** One leaf blade from `origin`, arched along its top edge and drooping toward the tip. */
export function leaf(origin: { x: number; y: number }, angleDeg: number, length: number, width = 0.13, droop = 0.55) {
  const a = rad(angleDeg)
  const cos = Math.cos(a)
  const sin = Math.sin(a)
  const sag = length * droop * (1 - Math.abs(sin))
  const tip = { x: origin.x + cos * length, y: origin.y + sin * length + sag }
  const mid = { x: origin.x + cos * length * 0.5, y: origin.y + sin * length * 0.5 }
  const w = length * width
  const upper = { x: mid.x - sin * w, y: mid.y + cos * w - sag * 0.15 - w * 0.6 }
  const lower = { x: mid.x + sin * w * 0.5, y: mid.y - cos * w * 0.5 + sag * 0.6 }
  return `M${pt(origin.x, origin.y)} Q${pt(upper.x, upper.y)} ${pt(tip.x, tip.y)} Q${pt(lower.x, lower.y)} ${pt(origin.x, origin.y)}Z`
}

/** A palm: tapered, gently curving trunk with a crown of drooping fronds. */
export function palm(o: {
  x: number
  ground: number
  height: number
  lean: number
  seed: number
  fronds?: number
  size?: number
}): string {
  const rand = mulberry32(o.seed)
  const size = o.size ?? 1
  const top = { x: o.x + o.lean, y: o.ground - o.height }
  const base = 6 * size
  const neck = 2.6 * size
  const ctrl = { x: o.x + o.lean * 0.15, y: o.ground - o.height * 0.6 }
  const trunk =
    `M${pt(o.x - base, o.ground)} Q${pt(ctrl.x - base * 0.7, ctrl.y)} ${pt(top.x - neck, top.y)} ` +
    `L${pt(top.x + neck, top.y)} Q${pt(ctrl.x + base * 0.7, ctrl.y)} ${pt(o.x + base, o.ground)}Z`

  const count = o.fronds ?? 9
  const leaves: string[] = []
  for (let i = 0; i < count; i++) {
    const angle = lerp(-172, -8, i / (count - 1)) + (rand() - 0.5) * 16
    const length = o.height * (0.36 + rand() * 0.16) * Math.min(size, 1.15)
    leaves.push(leaf(top, angle, length, 0.12, 0.6))
  }
  return [trunk, ...leaves].join(' ')
}

/** An emergent rainforest tree: buttressed trunk, two limbs and a wide, flat crown. */
export function canopyTree(o: { x: number; ground: number; height: number; spread: number; seed: number }): string {
  const rand = mulberry32(o.seed)
  const top = o.ground - o.height
  const trunk =
    `M${pt(o.x - 20, o.ground)} Q${pt(o.x - 6, o.ground - 10)} ${pt(o.x - 6, o.ground - 34)} ` +
    `L${pt(o.x - 3.5, top + 18)} L${pt(o.x + 3.5, top + 18)} L${pt(o.x + 6, o.ground - 34)} ` +
    `Q${pt(o.x + 6, o.ground - 10)} ${pt(o.x + 20, o.ground)}Z`
  const limbs = [-1, 1].map((side) => {
    const ex = o.x + side * o.spread * 0.32
    const ey = top + 6
    return `M${pt(o.x - 2, top + 34)} Q${pt(o.x + side * 10, top + 18)} ${pt(ex, ey)} L${pt(ex + side * 3, ey + 4)} Q${pt(o.x + side * 12, top + 24)} ${pt(o.x + 2, top + 40)}Z`
  })

  const blobs: string[] = []
  const n = 7
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1)
    const cx = o.x + (t - 0.5) * o.spread
    const arch = Math.sin(t * Math.PI)
    const rx = (o.spread / n) * (0.9 + rand() * 0.6)
    const ry = rx * (0.5 + rand() * 0.2)
    const cy = top + (1 - arch) * 10 + rand() * 6
    blobs.push(`M${pt(cx - rx, cy)} a${r1(rx)} ${r1(ry)} 0 1 0 ${r1(rx * 2)} 0 a${r1(rx)} ${r1(ry)} 0 1 0 ${r1(-rx * 2)} 0Z`)
  }
  return [trunk, ...limbs, ...blobs].join(' ')
}

/** A ground fern: blades fanning out of a single root point. */
export function fern(o: { x: number; ground: number; size: number; seed: number; blades?: number }): string {
  const rand = mulberry32(o.seed)
  const count = o.blades ?? 9
  const root = { x: o.x, y: o.ground }
  return Array.from({ length: count }, (_, i) => {
    const angle = lerp(-168, -12, i / (count - 1)) + (rand() - 0.5) * 12
    return leaf(root, angle, o.size * (0.6 + rand() * 0.45), 0.14, 0.45)
  }).join(' ')
}

/** Undulating ground band from `y` down to `floor`. */
export function groundBand(o: { width: number; y: number; floor: number; seed: number }): string {
  const rand = mulberry32(o.seed)
  const parts = [`M0 ${o.floor}`, `L${pt(0, o.y)}`]
  for (let x = 0; x < o.width; x += 160) {
    const nx = Math.min(o.width, x + 160)
    parts.push(`Q${pt(x + 80, o.y + (rand() - 0.5) * 6)} ${pt(nx, o.y + (rand() - 0.5) * 3)}`)
  }
  parts.push(`L${pt(o.width, o.floor)}Z`)
  return parts.join(' ')
}

/** Grass blades along the ground, split into `groups` so each can sway on its own phase. */
export function grass(o: {
  width: number
  ground: number
  seed: number
  spacing: number
  minHeight: number
  maxHeight: number
  groups?: number
}): string[] {
  const rand = mulberry32(o.seed)
  const groups = Array.from({ length: o.groups ?? 3 }, () => [] as string[])
  let index = 0
  for (let x = -10; x < o.width + 10; x += o.spacing * (0.5 + rand())) {
    const h = lerp(o.minHeight, o.maxHeight, rand() ** 1.6)
    const lean = (rand() - 0.5) * h * 0.6
    const w = 2.2 + rand() * 2
    groups[index++ % groups.length]!.push(
      `M${pt(x, o.ground + 2)} Q${pt(x + lean * 0.3, o.ground - h * 0.55)} ${pt(x + lean, o.ground - h)} ` +
        `Q${pt(x + lean * 0.3 + w, o.ground - h * 0.5)} ${pt(x + w * 1.6, o.ground + 2)}Z`,
    )
  }
  return groups.map((blades) => blades.join(' '))
}

export interface Vine {
  d: string
  x: number
  y: number
}

/** Hanging lianas: thin curved strokes anchored in the canopy (sway around the anchor). */
export function vines(o: { anchors: number[]; y: number; seed: number }): Vine[] {
  const rand = mulberry32(o.seed)
  return o.anchors.map((x) => {
    const length = 50 + rand() * 80
    const sway = (rand() - 0.5) * 24
    return {
      x,
      y: o.y,
      d: `M${pt(x, o.y)} C${pt(x + sway, o.y + length * 0.35)} ${pt(x - sway, o.y + length * 0.7)} ${pt(x + sway * 0.4, o.y + length)}`,
    }
  })
}

/** Deterministic scatter of points inside a rectangle — stars, fireflies. */
export function scatter(o: { count: number; x: [number, number]; y: [number, number]; seed: number }) {
  const rand = mulberry32(o.seed)
  return Array.from({ length: o.count }, (_, i) => ({
    id: i,
    x: lerp(o.x[0], o.x[1], rand()),
    y: lerp(o.y[0], o.y[1], rand()),
    size: rand(),
    delay: rand(),
  }))
}
