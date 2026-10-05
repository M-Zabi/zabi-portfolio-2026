/**
 * Motion tokens. CSS mirrors these in `styles/main.css` (`--ease-*`), so a transition
 * written in Tailwind and an animation written with motion-v decelerate identically.
 *
 * Budget (from docs/DESIGN.md §3, extended for a showcase site):
 *   micro-interactions ≤ 300ms · UI enter/exit 180–300ms · reveals ≤ 1s
 *   The preloader and route curtain are the only orchestrated sequences that run longer.
 */

type Bezier = [number, number, number, number]

export const ease = {
  outQuint: [0.22, 1, 0.36, 1] as Bezier,
  outExpo: [0.16, 1, 0.3, 1] as Bezier,
  inOutQuart: [0.76, 0, 0.24, 1] as Bezier,
}

export const duration = {
  micro: 0.12,
  enter: 0.18,
  ui: 0.3,
  reveal: 0.95,
  curtain: 0.7,
} as const

export const spring = {
  /** Buttons, toggles, chips — fast with no overshoot. */
  snappy: { type: 'spring', stiffness: 520, damping: 40, mass: 0.8 },
  /** Tilt, magnetism, cursor followers — soft but settles quickly. */
  soft: { type: 'spring', stiffness: 170, damping: 22, mass: 0.9 },
  /** Layout shifts (DESIGN.md: 220ms spring). */
  layout: { type: 'spring', bounce: 0, duration: 0.22 },
} as const

/** Shared enter variant for content blocks that fade up into place. */
export const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
} as const
